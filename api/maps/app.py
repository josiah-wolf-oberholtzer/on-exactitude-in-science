import aiohttp.web

from .goblin import GoblinManager
from .views import routes


async def error_middleware(app, handler):
    async def middleware_handler(request):
        try:
            return await handler(request)
        except aiohttp.web.HTTPException as exception:
            return aiohttp.web.json_response(
                {"status": exception.status, "reason": exception.reason},
                status=exception.status,
            )
        except Exception as exception:
            return aiohttp.web.json_response(
                {"status": 400, "reason": "Bad Request", "extra": str(exception)}, status=400,
            )

    return middleware_handler


def init_app():
    app = aiohttp.web.Application(middlewares=[error_middleware])
    app.router.add_routes(routes)
    goblin_manager = GoblinManager()
    app.on_startup.append(goblin_manager.setup_app)
    app.on_cleanup.append(goblin_manager.teardown_app)
    return app


app = init_app()
