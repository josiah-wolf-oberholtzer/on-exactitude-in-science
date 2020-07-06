import asyncio
import collections
import datetime
import logging
import os

import goblin

logger = logging.getLogger(__name__)

CARD_MAPPING = {
    "Cardinality.single": "SINGLE",
    "Cardinality.list_": "LIST",
    "Cardinality.set_": "SET",
}


DATA_TYPE_MAPPING = {
    goblin.Integer: "Integer.class",
    goblin.Float: "Float.class",
    goblin.String: "String.class",
    goblin.Boolean: "Boolean.class",
}

PropertyKey = collections.namedtuple("PropertyKey", ["name", "data_type", "card"])


class GoblinManager:
    def __init__(self, aliases=None):
        self.aliases = aliases

    async def __aenter__(self) -> goblin.Goblin:
        return await self.setup_goblin()

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.teardown_goblin()

    async def setup_goblin(self) -> goblin.Goblin:
        self.goblin_app = await goblin.Goblin.open(
            loop=asyncio.get_running_loop(),
            aliases=self.aliases,
            get_hashable_id=self.get_hashable_id,
            scheme=os.environ.get("GOBLIN_SCHEME", "ws"),
            hosts=[os.environ.get("GOBLIN_HOST", "janusgraph")],
            port=int(os.environ.get("GOBLIN_PORT", 8182)),
        )
        self.goblin_app.register_from_module("maps.entities")
        return self.goblin_app

    async def teardown_goblin(self):
        await self.goblin_app.close()

    async def on_startup(self, app):
        goblin_app = await self.setup_goblin()
        app["goblin"] = goblin_app

    async def on_cleanup(self, app):
        await self.teardown_goblin()

    def get_hashable_id(self, value):
        if not isinstance(value, dict):
            return value
        return value["@value"]["relationId"]


async def get_session(aliases=None):
    manager = GoblinManager(aliases=aliases)
    goblin_app = await manager.setup_goblin()
    session = await goblin_app.session()
    return session


async def install_schema(goblin_app, graph_name="graph"):
    definition = format_schema(goblin_app, graph_name=graph_name)
    start_time = datetime.datetime.now()
    logger.info("Processing schema ...")
    client = await goblin_app.cluster.connect()
    response = await client.submit(definition)
    await response.all()
    logger.info("Processed schema in {}".format(datetime.datetime.now() - start_time))


def format_schema(goblin_app, graph_name="graph"):
    lines = [
        f"{graph_name}.tx().rollback()",
        f"mgmt = {graph_name}.openManagement()",
    ]
    lines.extend(["", "// Vertex labels"])
    for label, vertex in sorted(goblin_app.vertices.items()):
        if label == "vertex":
            continue
        lines.append(f"{label} = mgmt.makeVertexLabel('{label}').make()")
    lines.extend(["", "// Property keys"])
    property_keys = set()
    for _, vertex in sorted(goblin_app.vertices.items()) + sorted(
        goblin_app.edges.items()
    ):
        for db_name, (ogm_name, _) in sorted(vertex.__mapping__.db_properties.items()):
            prop = vertex.__properties__[ogm_name]
            # Get cardinality
            mapped_card = CARD_MAPPING[
                str(getattr(prop, "cardinality", "Cardinality.single"))
            ]
            # Get data type
            mapped_data_type = DATA_TYPE_MAPPING[type(prop.data_type)]
            prop_key = PropertyKey(db_name, mapped_data_type, mapped_card)
            property_keys.add(
                f"{prop_key.name} = mgmt.makePropertyKey('{prop_key.name}').dataType("
                f"{prop_key.data_type}).cardinality({prop_key.card}).make()"
            )
    lines.extend(sorted(property_keys))
    lines.extend(["", "// Edge labels"])
    for label, edge in sorted(goblin_app.edges.items()):
        if label == "edge":
            continue
        lines.append(
            f"{label} = mgmt.makeEdgeLabel('{label}').multiplicity(MULTI).make()"
        )
    lines.extend(["", "// Indices"])
    for label, _ in sorted(goblin_app.vertices.items()):
        lines.append(
            f"mgmt.buildIndex('{graph_name}_by_{label}_id', Vertex.class).addKey({label}_id).indexOnly({label}).unique().buildCompositeIndex()"
        )
    lines.extend(
        [
            f"mgmt.buildIndex('{graph_name}_by_last_modified', Vertex.class).addKey(name).buildMixedIndex('search')",
            f"mgmt.buildIndex('{graph_name}_by_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).buildMixedIndex('search')",
            f"mgmt.buildIndex('{graph_name}_by_random', Vertex.class).addKey(random).buildMixedIndex('search')",
        ]
    )
    lines.extend(["", "mgmt.commit()"])
    return "\n".join(lines)
