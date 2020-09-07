import aiohttp.web

from maps import queries

routes = aiohttp.web.RouteTableDef()


def validate_filters(request):
    filters = {}
    for key, value in request.items():
        key = key.strip("[]")
        filters.setdefault(key, []).append(value)
    return filters


def validate_boolean(request, key, default=False):
    boolean = request.query.get(key, default)
    if boolean in (True, "true", "1"):
        return True
    return False


def validate_limit(request, default=20, minimum=1, maximum=100):
    limit = request.query.get("limit", default)
    try:
        limit = int(limit)
    except Exception:
        limit = default
    if limit < minimum:
        limit = default
    if limit > maximum:
        limit = maximum
    return limit


def validate_offset(request):
    offset = request.query.get("offset", 0)
    try:
        offset = int(offset)
    except Exception:
        offset = 0
    if offset < 0:
        offset = 0
    return offset


def validate_vertex_label(request):
    vertex_label = request.match_info.get("vertex_label")
    if vertex_label and vertex_label not in request.app["goblin"].vertices:
        raise aiohttp.web.HTTPNotFound()
    return vertex_label


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
    show_secondary_entities = validate_boolean(request, "secondary", False)
    limit = validate_limit(request, default=250, minimum=0, maximum=500)
    offset = validate_offset(request)
    vertex_label = validate_vertex_label(request)
    vertex_id = request.match_info.get("vertex_id")
    if vertex_label != "track":
        vertex_id = int(vertex_id)
    # cache = request.app["cache"]
    # cache_key = str(request.rel_url).encode()
    # if (cached := await cache.get(cache_key)) is not None:
    #    return aiohttp.web.json_response(cached)
    locality = await queries.get_locality(
        request.app["goblin"],
        vertex_id,
        countries=request.query.getall("countries[]", []),
        formats=request.query.getall("formats[]", []),
        genres=request.query.getall("genres[]", []),
        labels=request.query.getall("labels[]", []),
        limit=limit,
        offset=offset,
        roles=request.query.getall("roles[]", []),
        show_secondary_entities=show_secondary_entities,
        styles=request.query.getall("styles[]", []),
        vertex_label=vertex_label,
        years=request.query.getall("years[]", []),
    )
    if locality is None:
        raise aiohttp.web.HTTPNotFound()
    root_vertex, vertices, edges = locality
    data = {
        "result": {
            "center": root_vertex,
            "edges": edges,
            "vertices": vertices,
        },
    }
    # await cache.set(cache_key, data)
    return aiohttp.web.json_response(data)


@routes.get("/random")
@routes.get("/random/{vertex_label}")
async def get_random(request):
    vertex_label = validate_vertex_label(request)
    if (
        result := await queries.get_random(
            request.app["goblin"], vertex_label=vertex_label
        )
    ) is None:
        raise aiohttp.web.HTTPBadRequest()
    return aiohttp.web.json_response({"result": result})


@routes.get("/search")
@routes.get("/search/{vertex_label}")
async def get_search(request):
    vertex_label = validate_vertex_label(request)
    query = request.query.get("q", "")
    if not query or len(query) < 3:
        raise aiohttp.web.HTTPBadRequest(reason="Query too short")
    limit = validate_limit(request)
    result = await queries.get_search(
        request.app["goblin"], query, limit=limit, vertex_label=vertex_label
    )
    return aiohttp.web.json_response({"limit": limit, "query": query, "result": result})


@routes.get("/vertex/{vertex_id}")
@routes.get("/vertex/{vertex_label}/{vertex_id}")
async def get_vertex(request):
    vertex_label = validate_vertex_label(request)
    vertex_id = request.match_info.get("vertex_id")
    if vertex_label != "track":
        vertex_id = int(vertex_id)
    if vertex_label:
        coroutine = queries.get_vertex_by_entity_id(
            request.app["goblin"], vertex_label, vertex_id
        )
    else:
        coroutine = queries.get_vertex_by_vertex_id(request.app["goblin"], vertex_id)
    if (result := await coroutine) is None:
        raise aiohttp.web.HTTPNotFound()
    return aiohttp.web.json_response({"result": result})


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
    if (
        result := await queries.get_path(
            request.app["goblin"], source_label, source_id, target_label, target_id
        )
    ) is None:
        raise aiohttp.web.HTTPNotFound()
    return aiohttp.web.json_response({"result": result})
