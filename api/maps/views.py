import random

import aiohttp.web
from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Cardinality, P, Scope

from maps.gremlin import textContainsFuzzy

routes = aiohttp.web.RouteTableDef()


def validate_limit(request):
    limit = request.query.get("limit", 20)
    try:
        limit = int(limit)
    except Exception:
        limit = 20
    if limit <= 0:
        limit = 20
    if limit > 100:
        limit = 100
    return limit


def validate_vertex_label(request):
    vertex_label = request.match_info.get("vertex_label")
    if vertex_label and vertex_label not in request.app["goblin"].vertices:
        raise aiohttp.web.HTTPNotFound()
    return vertex_label


def project_edge(traversal):
    return (
        traversal.project("source", "edge", "target")
        .by(project_vertex(__.outV()))
        .by(
            __.project("id", "label", "values")
            .by(__.id())
            .by(__.label())
            .by(__.valueMap())
        )
        .by(project_vertex(__.inV()))
    )


def project_vertex(traversal):
    return (
        traversal.project("id", "label", "values")
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
    )


def cleanup_edge(result):
    result["id"] = result["id"]["@value"]["relationId"]
    result.update(result.pop("values", {}))
    return result


def cleanup_vertex(result, goblin_app):
    vertex = goblin_app.vertices[result["label"]]
    for key, value in result["values"].items():
        prop = vertex.__properties__[key]
        if (
            value
            and getattr(prop, "cardinality", Cardinality.single) == Cardinality.single
        ):
            result["values"][key] = value[0]
    result["values"].pop("random")
    result["eid"] = result["values"].pop(result["label"] + "_id")
    result.update(result.pop("values"))
    return result


@routes.get("/")
@routes.get("/health")
async def get_health(request):
    try:
        client = await request.app["goblin"].cluster.connect()
        response = await client.submit("100 - 1")
        await response.all()
        return aiohttp.web.json_response({"status": "ok"})
    except Exception as e:
        return aiohttp.web.json_response({"status": str(e)}, status=500)


@routes.get("/locality/{vertex_id}")
@routes.get("/locality/{vertex_label}/{vertex_id}")
async def get_locality(request):
    vertex_label = validate_vertex_label(request)
    vertex_id = request.match_info.get("vertex_id")
    if vertex_label != "track":
        vertex_id = int(vertex_id)
    session = await request.app["goblin"].session()
    if vertex_label:
        traversal = session.g.V().has(vertex_label, f"{vertex_label}_id", vertex_id)
    else:
        traversal = session.g.V(vertex_id)
    traversal = traversal.union(
        project_vertex(__.identity()),
        project_edge(
            __.repeat(__.bothE().dedup().aggregate("x").otherV())
            .times(3)
            .cap("x")
            .unfold()
            .limit(333)
        ),
    )
    result = await traversal.toList()
    edges = []
    vertices = {}
    root_vertex = cleanup_vertex(result[0], request.app["goblin"])
    vertices[root_vertex["id"]] = root_vertex
    for entry in result[1:]:
        source = cleanup_vertex(entry["source"], request.app["goblin"])
        target = cleanup_vertex(entry["target"], request.app["goblin"])
        vertices.update({source["id"]: source, target["id"]: target})
        edge = cleanup_edge(entry["edge"])
        edge.update(source=source["id"], target=target["id"])
        edges.append(edge)
    return aiohttp.web.json_response(
        {
            "result": {
                "edges": edges,
                "vertices": [vertex for _, vertex in sorted(vertices.items())],
            }
        }
    )


@routes.get("/random")
@routes.get("/random/{vertex_label}")
async def get_random(request):
    vertex_label = validate_vertex_label(request)
    session = await request.app["goblin"].session()
    predicates = [P.lt, P.lte, P.gt, P.gte]
    for i in range(10):
        random.shuffle(predicates)
        has = ["random", predicates[0](random.random())]
        if vertex_label:
            has.insert(0, vertex_label)
        traversal = project_vertex(session.g.V().has(*has).limit(20).sample(1))
        result = await traversal.toList()
        if len(result):
            break
    else:
        raise aiohttp.web.HTTPBadRequest()
    for entry in result:
        cleanup_vertex(entry, request.app["goblin"])
    return aiohttp.web.json_response({"result": result[0],})


@routes.get("/search")
@routes.get("/search/{vertex_label}")
async def get_search(request):
    vertex_label = validate_vertex_label(request)
    query = request.query.get("q", "")
    if not query or len(query) < 3:
        raise aiohttp.web.HTTPBadRequest(reason="Query too short")
    limit = validate_limit(request)
    session = await request.app["goblin"].session()
    has = ["name", textContainsFuzzy(query)]
    if vertex_label:
        has.insert(0, vertex_label)
    traversal = project_vertex(session.g.V().has(*has).limit(limit))
    result = await traversal.toList()
    for entry in result:
        cleanup_vertex(entry, request.app["goblin"])
    return aiohttp.web.json_response(
        {"limit": limit, "query": query, "result": result,}
    )


@routes.get("/vertex/{vertex_id}")
@routes.get("/vertex/{vertex_label}/{vertex_id}")
async def get_vertex(request):
    vertex_label = validate_vertex_label(request)
    vertex_id = request.match_info.get("vertex_id")
    if vertex_label != "track":
        vertex_id = int(vertex_id)
    session = await request.app["goblin"].session()
    if vertex_label:
        traversal = project_vertex(
            session.g.V().has(vertex_label, f"{vertex_label}_id", vertex_id)
        )
    else:
        traversal = project_vertex(session.g.V(vertex_id))
    result = await traversal.next()
    if not result:
        raise aiohttp.web.HTTPNotFound()
    return aiohttp.web.json_response(
        {"result": cleanup_vertex(result, request.app["goblin"]),}
    )


@routes.get("/path/{source_label}/{source_id}/{target_label}/{target_id}")
async def get_path(request):
    source_label = request.match_info.get("source_label")
    target_label = request.match_info.get("target_label")
    source_id = request.match_info.get("source_id")
    target_id = request.match_info.get("target_id")
    if source_label and source_label not in request.app["goblin"].vertices:
        raise aiohttp.web.HTTPNotFound()
    elif target_label and target_label not in request.app["goblin"].vertices:
        raise aiohttp.web.HTTPNotFound()
    if source_label != "track":
        source_id = int(source_id)
    if target_label != "track":
        target_id = int(target_id)
    session = await request.app["goblin"].session()
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
        raise aiohttp.web.HTTPNotFound()
    for path in result:
        for entry in path:
            cleanup_vertex(entry["source"], request.app["goblin"])
            cleanup_vertex(entry["target"], request.app["goblin"])
            cleanup_edge(entry["edge"])
    return aiohttp.web.json_response({"result": result})
