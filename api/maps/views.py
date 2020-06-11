import aiohttp.web
from aiogremlin.process.graph_traversal import __

from maps.gremlin import textContainsFuzzy

routes = aiohttp.web.RouteTableDef()

edge_pattern = (
    "/edge" "/{source_type}/{source_key}" "/{edge_type}" "/{target_type}/{target_key}"
)


@routes.get("/")
async def index(request):
    return aiohttp.web.json_response({"message": "hello world!"})


@routes.get("/health")
async def health(request):
    try:
        client = await request.app["goblin"].cluster.connect()
        response = await client.submit("100 - 1")
        await response.all()
        return aiohttp.web.json_response({"status": "ok"})
    except Exception as e:
        return aiohttp.web.json_response({"status": str(e)}, status=500)


@routes.get("/vertex/{vertex_goblin_id}")
async def get_vertex_by_goblin_id(request):
    vertex_goblin_id = request.match_info.get("vertex_goblin_id")
    session = await request.app["goblin"].session()
    traversal = (
        session.g.V(vertex_goblin_id)
        .project("id", "label", "values")
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .next()
    )
    result = await traversal
    if not result:
        raise aiohttp.web.HTTPNotFound()
    return aiohttp.web.json_response({"vertex": result})


@routes.get("/vertex/{vertex_label}/{vertex_entity_id}")
async def get_vertex_by_label(request):
    vertex_label = request.match_info.get("vertex_label")
    vertex_entity_id = request.match_info.get("vertex_entity_id")
    if vertex_label not in goblin_app.vertices:
        raise aiohttp.web.HTTPNotFound()
    session = await request.app["goblin"].session()
    traversal = (
        session.g.V()
        .has(vertex_label, f"{vertex_label}_id", vertex_entity_id)
        .project("id", "label", "values")
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .next()
    )
    result = await traversal
    if not result:
        raise aiohttp.web.HTTPNotFound()
    return aiohttp.web.json_response({"vertex": result})


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


@routes.get("/search")
async def search(request):
    query = request.query.get("q", "")
    if not query or len(query) < 3:
        raise aiohttp.web.HTTPBadRequest(reason="Query too short")
    limit = validate_limit(request)
    session = await request.app["goblin"].session()
    traversal = (
        session.g.V()
        .has("name", textContainsFuzzy(query))
        .limit(limit)
        .project("vid", "label", "name")
        .by(__.id())
        .by(__.label())
        .by(__.properties("name").value())
        .toList()
    )
    result = await traversal
    return aiohttp.web.json_response({
        "limit": limit,
        "query": query,
        "result": result,
    })


@routes.get("/search/{vertex_label}")
async def search_by_label(request):
    vertex_label = request.match_info.get("vertex_label")
    if vertex_label not in request.app["goblin"].vertices:
        raise aiohttp.web.HTTPNotFound()
    query = request.query.get("q", "")
    if not query or len(query) < 3:
        raise aiohttp.web.HTTPBadRequest(reason="Query too short")
    limit = validate_limit(request)
    session = await request.app["goblin"].session()
    traversal = (
        session.g.V()
        .has(vertex_label, "name", textContainsFuzzy(query))
        .limit(limit)
        .project("vid", "label", "name")
        .by(__.id())
        .by(__.label())
        .by(__.properties("name").value())
        .toList()
    )
    result = await traversal
    return aiohttp.web.json_response({
        "limit": limit,
        "query": query,
        "result": result,
        "vertex_label": vertex_label,
    })


"""
@routes.get(
    "/edge/{source_label}/{source_entity_id}/{edge_label}/{target_label}/{target_entity_id}"
)
async def edge_edge(request):
    goblin_app = request.app["goblin"]
    source_label = request.match_info.get("source_label")
    source_entity_id = request.match_info.get("source_entity_id")
    edge_label = request.match_info.get("edge_label")
    target_label = request.match_info.get("target_label")
    target_entity_id = request.match_info.get("target_entity_id")
    if (
        source_label not in goblin_app.vertices
        or target_label not in goblin_app.vertices
        or edge_label not in goblin_app.edges
    ):
        raise aiohttp.web.HTTPNotFound()
    session = await request.app["goblin"].session()
    return aiohttp.web.json_response({"edge": "yes"})
"""


"""
@routes.get("/locality/{vertex_label}/{vertex_entity_id}")
async def get_locality(request):
    goblin_app = request.app["goblin"]
    vertex_label = request.match_info.get("vertex_label")
    vertex_entity_id = request.match_info.get("vertex_entity_id")
    if vertex_label not in goblin_app.vertices:
        raise aiohttp.web.HTTPNotFound()
    return aiohttp.web.json_response({"locality": "yes"})
"""


"""
@routes.get("/random")
async def get_random(request):
    goblin_app = request.app["goblin"]
    session = await goblin_app.session()
    traversal = session.g
    traversal = traversal.valueMap(True)
    result = await traversal.next()
    return aiohttp.web.json_response({"result": result})
"""
