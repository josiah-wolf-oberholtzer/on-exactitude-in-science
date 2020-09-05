import json
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
    diagnostic_result = await get_locality_diagnostic(
        session,
        vertex_id,
        vertex_label=vertex_label,
        countries=countries,
        formats=formats,
        genres=genres,
        labels=labels,
        limit=limit,
        offset=offset,
        roles=roles,
        styles=styles,
        years=years,
    )
    pass_one_result = await get_locality_pass_one_query(
        session,
        vertex_id,
        vertex_label=vertex_label,
        countries=countries,
        formats=formats,
        genres=genres,
        labels=labels,
        limit=limit,
        offset=offset,
        roles=roles,
        styles=styles,
        years=years,
    )
    root_vertex, vertices, edges = get_locality_pass_one_cleanup(
        goblin_app, pass_one_result
    )
    #pass_two_result = await get_locality_pass_two_query(
    #    session,
    #    sorted(vertices),
    #    roles=roles,
    #)
    #edges.update(get_locality_pass_two_cleanup(pass_two_result))
    return (
        root_vertex,
        [vertex for _, vertex in sorted(vertices.items())],
        [edge for _, edge in sorted(edges.items())],
    )


def build_locality_edge_filter(
    countries=None,
    formats=None,
    genres=None,
    labels=None,
    roles=None,
    styles=None,
    years=None,
):
    traversals = [
        traversal
        for traversal in (
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
    if not traversals:
        return [__.identity()]
    return traversals


def build_locality_label_filter(labels):
    valid_labels = ["Artist", "Company", "Master", "Release", "Track"]
    if validated_labels := [label.lower() for label in (labels or []) if label in valid_labels]:
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
    roles_to_labels = {
        "Alias Of": "alias_of",
        "Includes": "includes",
        "Member Of": "member_of",
        "Released": "released",
        "Released On": "released_on",
        "Subsidiary Of": "subsidiary_of",
        "Subrelease Of": "subrelease_of",
    }
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
        traversals.append(__.has("credited_with", "name", P.within(*credits)))
    if len(traversals) > 1:
        return __.or_(*traversals)
    elif len(traversals) == 1:
        return traversals[0]
    return None


async def get_locality_diagnostic(
    session,
    vertex_id, 
    vertex_label=None,
    countries=None,
    formats=None,
    genres=None,
    labels=None,
    limit=200,
    offset=0,
    roles=None,
    styles=None,
    years=None,
):
    edge_filters = build_locality_edge_filter(
        countries=countries,
        formats=formats,
        genres=genres,
        labels=labels,
        roles=roles,
        styles=styles,
        years=years,
    )
    if vertex_label:
        traversal = session.g.V().has(
            vertex_label, f"{vertex_label}_id", vertex_id
        )
    else:
        traversal = session.g.V(vertex_id)
    traversal = (
        traversal
        .as_("center")
        .repeat(
            __.local(
                __.bothE()
                .dedup()
                .and_(*edge_filters)
                .choose(
                    __.loops().is_(0),
                    __.order().range(offset, offset + 50),
                    __.limit(5),
                )
            )
            .dedup()
            .aggregate("edges")
            .otherV()
            .dedup()
            .where(__.local(__.bothE().count().is_(P.lt(100))))
        )
        .until(__.cap("edges").unfold().count().is_(P.gt(100)))
        .cap("edges").unfold()
        .limit(limit)
        .project("source", "edge", "target")
        .by(
            __.outV()
            .project("id", "label", "values", "total_edge_count", "child_count", "extra")
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
            .project("id", "label", "values", "total_edge_count", "child_count", "extra")
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
    print("DIAGNOSTIC TRAVERSAL", traversal)
    result = await traversal.toList()
    print("DIAGNOSTIC RESULT", json.dumps(result, indent=4))
    return result


async def get_locality_pass_one_query(
    session,
    vertex_id, 
    vertex_label=None,
    countries=None,
    formats=None,
    genres=None,
    labels=None,
    limit=200,
    offset=0,
    roles=None,
    styles=None,
    years=None,
):
    """
    g.V().has("artist","artist_id",41)
      .repeat(
        __.local(
          __.bothE()
          .and(hasLabel("alias_of","member_of","released"))
          .dedup()
          .choose(loops().is(0),order().range(0,50),limit(5))
        )
        .dedup()
        .aggregate("e")
        .otherV()
        .dedup()
        .where(local(bothE().count().is(P.lt(100))))
      )
      .until(cap("e").unfold().count().is(P.gt(100)))
      .cap("e").unfold()
    """
    if vertex_label:
        center_traversal = session.g.V().has(
            vertex_label, f"{vertex_label}_id", vertex_id
        )
    else:
        center_traversal = session.g.V(vertex_id)

    edge_filters = build_locality_edge_filter(
        countries=countries,
        formats=formats,
        genres=genres,
        labels=labels,
        roles=roles,
        styles=styles,
        years=years,
    )
    traversal = center_traversal.union(
        project_vertex(__.identity()),
        project_edge(
            __.repeat(
                __.local(
                    __.bothE()
                    .dedup()
                    .and_(*edge_filters)
                    .choose(
                        __.loops().is_(0),
                        __.order().range(offset, offset + 50),
                        __.sample(5),
                    )
                )
                .dedup()
                .aggregate("edges")
                .otherV()
                .dedup()
                .where(__.bothE().count().is_(P.lt(100)))
            )
            .until(__.cap("edges").unfold().count().is_(P.gt(limit)))
            .cap("edges")
            .unfold()
            .limit(limit)
        ),
    )
    print(f"TRAVERSAL: {traversal}")
    result = await traversal.toList()
    print("RESULT", len(result))
    return result


def get_locality_pass_one_cleanup(goblin_app, result):
    edges = {}
    vertices = {}
    root_vertex = cleanup_vertex(result[0], goblin_app)
    root_vertex.update(is_center=True, edge_count=0)
    vertices[root_vertex["id"]] = root_vertex
    for i, entry in enumerate(result[1:]):
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
    return root_vertex, vertices, edges


async def get_locality_pass_two_query(session, vertex_ids, roles=None):
    """
    Collect all edges between any combination of `vertex_ids`.
    """
    edge_filters = [
        traversal
        for traversal in [
            __.otherV().hasId(*sorted(vertex_ids)),
            build_locality_role_filter(roles=roles),
        ]
        if traversal is not None
    ]
    traversal = (
        session.g.V()
        .hasId(*sorted(vertex_ids))
        .bothE()
        .and_(*edge_filters)
        .dedup()
        .project("id", "label", "values", "source", "target")
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .by(__.outV().id())
        .by(__.inV().id())
    )
    return await traversal.toList()


def get_locality_pass_two_cleanup(result):
    edges = {}
    for edge in result:
        edge = cleanup_edge(edge)
        edges[edge["id"]] = edge
    return edges


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
        session.g.V()
        .or_(
            __.has(*has_contains_fuzzy),
            __.has(*has_fuzzy),
        )
        .limit(limit)
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
