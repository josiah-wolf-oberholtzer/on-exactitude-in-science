import asyncio

import pytest

from maps import goblin

pytest_plugins = "aiohttp.pytest_plugin"


@pytest.fixture(scope="module")
def event_loop():
    """Change event_loop fixture to module level."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def goblin_app(event_loop):
    async with goblin.GoblinManager(aliases={"g": "tg"}) as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()
        yield goblin_app
