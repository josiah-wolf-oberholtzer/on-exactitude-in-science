import asyncio
import os

import goblin


class GoblinManager:
    async def __aenter__(self) -> goblin.Goblin:
        return await self.setup_goblin()

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.teardown_goblin()

    async def setup_goblin(self) -> goblin.Goblin:
        self.goblin_app = await goblin.Goblin.open(
            loop=asyncio.get_running_loop(),
            aliases={"g": "g"},
            scheme=os.environ.get("GOBLIN_SCHEME", "ws"),
            hosts=[os.environ.get("GOBLIN_HOST", "janusgraph")],
            port=int(os.environ.get("GOBLIN_PORT", 8182)),
        )
        self.goblin_app.register_from_module("maps.entities")
        return self.goblin_app

    async def teardown_goblin(self):
        await self.goblin_app.close()

    async def setup_app(self, app):
        goblin_app = await self.setup_goblin()
        app["goblin"] = goblin_app

    async def teardown_app(self, app):
        await self.teardown_goblin()
