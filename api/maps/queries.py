import random
from collections import deque

from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Order, P, Pick, Scope

from maps.graphutils import (
    cleanup_edge,
    cleanup_vertex,
    project_vertex,
    roles_to_labels,
)
from maps.gremlin import textContainsFuzzy, textFuzzy


async def get_locality(
    goblin_app,
    vertex_id,
    countries=None,
    formats=None,
    genres=None,
    labels=None,
    limit=200,
    offset=0,
    roles=None,
    styles=None,
    years=None,
    vertex_label=None,
):
    session = await goblin_app.session()
    edge_filters = build_locality_edge_filter(
        countries=countries,
        formats=formats,
        genres=genres,
        labels=labels,
        roles=roles,
        styles=styles,
        years=years,
        show_secondary_entities=True,
    )
    root_vertex = await get_locality_root_query(
        session,
        vertex_id,
        vertex_label=vertex_label,
        edge_filters=edge_filters,
    )
    if not root_vertex:
        return None
    cleanup_vertex(root_vertex, goblin_app)
    edge_result = await get_locality_query(
        session,
        root_vertex["id"],
        edge_filters=edge_filters,
        limit=limit,
        offset=offset,
    )
    vertices, edges = get_locality_cleanup(goblin_app, edge_result, root_vertex["id"])
    root_vertex.update(depth=0, edge_count=0, maximum_depth=1)
    root_vertex.update(**vertices.get(root_vertex["id"], {}))
    vertices[root_vertex["id"]] = root_vertex
    return (
        root_vertex,
        [vertex for _, vertex in sorted(vertices.items())],
        [edge for _, edge in sorted(edges.items())],
    )


async def get_locality_root_query(
    session,
    vertex_id,
    vertex_label=None,
    edge_filters=None,
):
    edge_filters = edge_filters or [__.identity()]
    if vertex_label:
        center_traversal = session.g.V().has(
            vertex_label, f"{vertex_label}_id", vertex_id
        )
    else:
        center_traversal = session.g.V(vertex_id)
    traversal = (
        center_traversal.project(
            "id",
            "label",
            "values",
            "total_edge_count",
            "pageable_edge_count",
            "child_count",
            "extra",
            "in_labels",
            "in_roles",
            "out_labels",
            "out_roles",
        )
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .by(__.bothE().count())
        .by(__.bothE().and_(*edge_filters).count())
        .by(__.inE("member_of", "subsidiary_of", "subrelease_of").count())
        .by(
            __.choose(
                __.inE("includes").count().is_(P.gt(0)),
                __.in_("includes").valueMap(),
                __.constant(False),
            )
        )
        .by(__.inE().groupCount().by(__.label()))
        .by(__.inE("credited_with").groupCount().by("role"))
        .by(__.outE().groupCount().by(__.label()))
        .by(__.outE("credited_with").groupCount().by("role"))
    )
    return await traversal.next()


async def get_locality_query(
    session,
    vertex_id,
    vertex_label=None,
    limit=200,
    offset=0,
    edge_filters=None,
):
    edge_filters = edge_filters or [__.identity()]
    if vertex_label:
        center_traversal = session.g.V().has(
            vertex_label, f"{vertex_label}_id", vertex_id
        )
    else:
        center_traversal = session.g.V(vertex_id)
    traversal = (
        center_traversal.repeat(
            __.local(
                __.bothE()
                .dedup()
                .and_(*edge_filters)
                .choose(
                    __.loops().is_(0),
                    __.order().range(offset, offset + 50),
                    __.limit(10),
                )
            )
            .dedup()
            .aggregate("edges")
            .otherV()
            .dedup()
            .where(__.local(__.bothE().count().is_(P.lt(100))))
            .timeLimit(500)
        )
        .until(
            __.or_(
                __.cap("edges").unfold().count().is_(P.gt(limit)),
                __.loops().is_(10),
            )
        )
        .cap("edges")
        .unfold()
        .limit(limit)
        .project("source", "edge", "target")
        .by(
            __.outV()
            .project(
                "id", "label", "values", "total_edge_count", "child_count", "extra"
            )
            .by(__.id())
            .by(__.label())
            .by(__.valueMap())
            .by(__.bothE().count())
            .by(__.inE("member_of", "subsidiary_of", "subrelease_of").count())
            .by(
                __.choose(
                    __.inE("includes").count().is_(P.gt(0)),
                    __.in_("includes").valueMap(),
                    __.constant(False),
                )
            )
        )
        .by(
            __.project("id", "label", "values")
            .by(__.id())
            .by(__.label())
            .by(__.valueMap())
        )
        .by(
            __.inV()
            .project(
                "id", "label", "values", "total_edge_count", "child_count", "extra"
            )
            .by(__.id())
            .by(__.label())
            .by(__.valueMap())
            .by(__.bothE().count())
            .by(__.inE("member_of", "subsidiary_of", "subrelease_of").count())
            .by(
                __.choose(
                    __.inE("includes").count().is_(P.gt(0)),
                    __.in_("includes").valueMap(),
                    __.constant(False),
                )
            )
        )
    )
    return await traversal.toList()


def get_locality_cleanup(goblin_app, result, vertex_id):
    edges = {}
    vertices = {}
    for entry in result:
        source, edge, target = entry["source"], entry["edge"], entry["target"]
        if source["id"] not in vertices:
            vertices[source["id"]] = cleanup_vertex(source, goblin_app)
            vertices[source["id"]]["edge_count"] = 0
        if target["id"] not in vertices:
            vertices[target["id"]] = cleanup_vertex(target, goblin_app)
            vertices[target["id"]]["edge_count"] = 0
        edge = cleanup_edge(edge)
        edge.update(source=source["id"], target=target["id"])
        edges[edge["id"]] = edge
        vertices[source["id"]]["edge_count"] += 1
        vertices[target["id"]]["edge_count"] += 1
    # find the root so we can establish depth calculations
    for _, vertex in vertices.items():
        if vertex["id"] == vertex_id:
            vertex["depth"] = 0
            break
    edge_deque = deque(edge for _, edge in sorted(edges.items()))
    maximum_depth = 1
    while edge_deque:
        edge = edge_deque.popleft()
        source = vertices[edge["source"]]
        target = vertices[edge["target"]]
        if "depth" in source and "depth" in target:
            continue
        elif "depth" in source:
            target["depth"] = source["depth"] + 1
            if target["depth"] > maximum_depth:
                maximum_depth = target["depth"]
        elif "depth" in target:
            source["depth"] = target["depth"] + 1
            if source["depth"] > maximum_depth:
                maximum_depth = source["depth"]
        else:
            edge_deque.append(edge)
    for vertex in vertices.values():
        vertex["maximum_depth"] = maximum_depth
    return vertices, edges


def build_locality_edge_filter(
    countries=None,
    formats=None,
    genres=None,
    labels=None,
    roles=None,
    styles=None,
    years=None,
    show_secondary_entities=None,
):
    return [
        traversal
        for traversal in (
            build_locality_secondary_entity_filter(show_secondary_entities),
            build_locality_label_filter(labels),
            build_locality_release_filter(
                countries=countries,
                formats=formats,
                genres=genres,
                styles=styles,
                years=years,
            ),
            build_locality_role_filter(roles),
        )
        if traversal is not None
    ]


def build_locality_secondary_entity_filter(show_secondary_entities):
    if show_secondary_entities:
        return None
    return (
        __.otherV()
        .choose(__.label())
        .option(
            "release",
            __.or_(
                __.has("is_main_release", True),
                __.in_("subrelease_of").count().is_(P.gt(0)),
            ),
        )
        .option(
            "track",
            __.in_("includes").or_(
                __.has("is_main_release", True),
                __.in_("subrelease_of").count().is_(P.gt(0)),
            ),
        )
        .option(Pick.none, __.identity())
    )


def build_locality_label_filter(labels):
    valid_labels = ["Artist", "Company", "Master", "Release", "Track"]
    if validated_labels := [
        label.lower() for label in (labels or []) if label in valid_labels
    ]:
        return __.otherV().hasLabel(*validated_labels)
    return None


def build_locality_release_filter(
    countries=None,
    formats=None,
    genres=None,
    styles=None,
    years=None,
):
    if not any((countries, formats, genres, styles, years)):
        return None
    traversal = __.coalesce(__.in_("includes"), __.identity())
    # TODO: Determine if we want "all within" or "any within" behavior for country, format, genre, style
    if countries:
        traversal = traversal.has("country", P.within(*countries))
    if formats:
        traversal = traversal.has("formats", P.within(*formats))
    if genres:
        traversal = traversal.has("genres", P.within(*genres))
    if styles:
        traversal = traversal.has("styles", P.within(*styles))
    if years:
        valid_years = []
        for year in years:
            try:
                valid_years.append(int(year))
            except Exception:
                pass
        traversal = traversal.has("year", P.within(*valid_years))
    return __.otherV().choose(
        __.hasLabel("release", "track"),
        traversal,
        __.identity(),
    )


def build_locality_role_filter(roles):
    traversals = []
    labels = []
    credits = []
    for role in roles or []:
        if (label := roles_to_labels.get(role)) is not None:
            labels.append(label)
        else:
            credits.append(role)
    if labels:
        traversals.append(__.hasLabel(*labels))
    if credits:
        traversals.append(__.has("credited_with", "role", P.within(*credits)))
    if len(traversals) > 1:
        return __.or_(*traversals)
    elif len(traversals) == 1:
        return traversals[0]
    return None


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


async def get_search(goblin_app, query, limit=50, vertex_label=None):
    session = await goblin_app.session()
    has_contains_fuzzy = ["name", textContainsFuzzy(query + " ")]
    has_fuzzy = ["name", textFuzzy(query + " ")]
    if vertex_label:
        has_contains_fuzzy.insert(0, vertex_label)
        has_fuzzy.insert(0, vertex_label)
    traversal = project_vertex(
        session.g.V()
        .or_(
            __.has(*has_contains_fuzzy),
            __.has(*has_fuzzy),
        )
        .order()
        .by(__.bothE().count(), Order.desc)
        .limit(limit)
    )
    result = await traversal.toList()
    for entry in result:
        cleanup_vertex(entry, goblin_app)
    return result


async def get_vertex(goblin_app, vertex_id, vertex_label=None):
    if vertex_label:
        return await get_vertex_by_entity_id(goblin_app, vertex_label, vertex_id)
    else:
        return await get_vertex_by_vertex_id(goblin_app, vertex_id)


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
