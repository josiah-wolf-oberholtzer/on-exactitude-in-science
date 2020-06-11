import random
import aiohttp.web
from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import P

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
    vertex_label = validate_vertex_label(request)
    vertex_entity_id = request.match_info.get("vertex_entity_id")
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
        traversal = (
            session.g.V()
            .has(*has)
            .limit(20)
            .sample(1)
            .project("vid", "label", "values")
            .by(__.id())
            .by(__.label())
            .by(__.valueMap())
        )
        result = await traversal.toList()
        if len(result):
            break
    else:
        raise aiohttp.web.HTTPBadRequest()
    for entry in result:
        values = entry.pop("values")
        entry["name"] = values["name"][0]
        entry["eid"] = values[f"{entry['label']}_id"][0]
    return aiohttp.web.json_response({"result": result[0]})


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


@routes.get("/search")
@routes.get("/search/{vertex_label}")
async def search(request):
    vertex_label = validate_vertex_label(request)
    query = request.query.get("q", "")
    if not query or len(query) < 3:
        raise aiohttp.web.HTTPBadRequest(reason="Query too short")
    limit = validate_limit(request)
    session = await request.app["goblin"].session()
    has = ["name", textContainsFuzzy(query)]
    if vertex_label:
        has.insert(0, vertex_label)
    traversal = (
        session.g.V()
        .has(*has)
        .limit(limit)
        .project("vid", "label", "values")
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .toList()
    )
    result = await traversal
    for entry in result:
        values = entry.pop("values")
        entry["name"] = values["name"][0]
        entry["eid"] = values[f"{entry['label']}_id"][0]
    return aiohttp.web.json_response({
        "limit": limit,
        "query": query,
        "result": result,
        **({"vertex_label": vertex_label} if vertex_label else {}),
    })


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
