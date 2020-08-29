import random

from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Order, P, Scope

from maps.graphutils import (
    cleanup_edge,
    cleanup_vertex,
    project_edge,
    project_vertex,
)
from maps.gremlin import textContainsFuzzy, textFuzzy


async def get_locality_by_entity_id(
    goblin_app, vertex_label, vertex_id, limit=200, offset=0
):
    session = await goblin_app.session()
    center_traversal = session.g.V().has(vertex_label, f"{vertex_label}_id", vertex_id)
    return await get_locality(
        goblin_app, session, center_traversal, limit=limit, offset=offset
    )


async def get_locality_by_vertex_id(goblin_app, vertex_id, limit=200, offset=0):
    session = await goblin_app.session()
    center_traversal = session.g.V(vertex_id)
    return await get_locality(
        goblin_app, session, center_traversal, limit=limit, offset=offset
    )


async def get_locality(goblin_app, session, center_traversal, limit=200, offset=0):
    traversal = center_traversal.union(
        project_vertex(__.identity()),
        project_edge(
            __.repeat(
                __.choose(
                    __.loops().is_(P.eq(0)),
                    __.bothE().range(offset, offset + 50),
                    __.local(__.bothE().sample(10)),
                )
                .dedup()
                .aggregate("edges")
                .otherV()
                .where(__.bothE().count().is_(P.lt(100)))
                .aggregate("vertices")
            )
            .until(__.cap("vertices").unfold().count().is_(P.gt(limit)))
            .cap("edges")
            .unfold()
            .limit(limit)
        ),
    )
    result = await traversal.toList()

    edges = {}
    vertices = {}
    root_vertex = cleanup_vertex(result[0], goblin_app)
    root_vertex["is_center"] = True
    vertices[root_vertex["id"]] = root_vertex
    for i, entry in enumerate(result[1:]):
        source, edge, target = entry["source"], entry["edge"], entry["target"]
        if source["id"] not in vertices:
            vertices[source["id"]] = cleanup_vertex(source, goblin_app)
        if target["id"] not in vertices:
            vertices[target["id"]] = cleanup_vertex(target, goblin_app)
        edge = cleanup_edge(edge)
        edge.update(source=source["id"], target=target["id"])
        edges[edge["id"]] = edge

    for entry in result[1:]:
        source, target = entry["source"], entry["target"]
        vertices[source["id"]].setdefault("edge_count", 0)
        vertices[source["id"]]["edge_count"] += 1
        vertices[target["id"]].setdefault("edge_count", 0)
        vertices[target["id"]]["edge_count"] += 1

    traversal = (
        session.g.V()
        .hasId(*sorted(vertices))
        .bothE()
        .where(__.otherV().hasId(*sorted(vertices)))
        .dedup()
        .project("id", "label", "values", "source", "target")
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .by(__.outV().id())
        .by(__.inV().id())
    )
    result = await traversal.toList()
    for edge in result:
        edge = cleanup_edge(edge)
        edges[edge["id"]] = edge

    return (
        root_vertex,
        [vertex for _, vertex in sorted(vertices.items())],
        [edge for _, edge in sorted(edges.items())],
    )


async def get_path(goblin_app, source_label, source_id, target_label, target_id):
    session = await goblin_app.session()
    traversal = (
        session.g.V()
        .has(source_label, f"{source_label}_id", source_id)
        .repeat(__.bothE().otherV().simplePath())
        .until(
            __.has(target_label, f"{target_label}_id", target_id).or_().loops().is_(6)
        )
        .has(target_label, f"{target_label}_id", target_id)
        .limit(1)
        .path()
        .index()
        .map(
            __.unfold()
            .filter(__.unfold().tail().math("_ % 2").is_(1))
            .limit(Scope.local, 1)
            .project("source", "edge", "target")
            .by(project_vertex(__.outV()))
            .by(
                __.project("id", "label", "values")
                .by(__.id())
                .by(__.label())
                .by(__.valueMap())
            )
            .by(project_vertex(__.inV()))
            .fold()
        )
    )
    result = await traversal.toList()
    if not result:
        return None
    for path in result:
        for entry in path:
            cleanup_vertex(entry["source"], goblin_app)
            cleanup_vertex(entry["target"], goblin_app)
            cleanup_edge(entry["edge"])
    return result


async def get_random(goblin_app, vertex_label=None):
    session = await goblin_app.session()
    for i in range(10):
        has = ["random", P.gte(random.random())]
        if vertex_label:
            has.insert(0, vertex_label)
        traversal = project_vertex(
            session.g.V().has(*has).order().by("random", Order.asc).limit(1)
        )
        result = await traversal.toList()
        if len(result):
            break
    else:
        return None
    for entry in result:
        cleanup_vertex(entry, goblin_app)
    return result[0]


async def get_search(goblin_app, query, limit=20, vertex_label=None):
    session = await goblin_app.session()
    has_contains_fuzzy = ["name", textContainsFuzzy(query + " ")]
    has_fuzzy = ["name", textFuzzy(query + " ")]
    if vertex_label:
        has_contains_fuzzy.insert(0, vertex_label)
        has_fuzzy.insert(0, vertex_label)
    traversal = project_vertex(
        session.g.V().or_(__.has(*has_contains_fuzzy), __.has(*has_fuzzy),).limit(limit)
    )
    result = await traversal.toList()
    for entry in result:
        cleanup_vertex(entry, goblin_app)
    return result


async def get_vertex_by_entity_id(goblin_app, vertex_label, vertex_id):
    session = await goblin_app.session()
    traversal = project_vertex(
        session.g.V().has(vertex_label, f"{vertex_label}_id", vertex_id)
    )
    if not (result := await traversal.next()):
        return None
    return cleanup_vertex(result, goblin_app)


async def get_vertex_by_vertex_id(goblin_app, vertex_id):
    session = await goblin_app.session()
    traversal = project_vertex(session.g.V(vertex_id))
    if not (result := await traversal.next()):
        return None
    return cleanup_vertex(result, goblin_app)
