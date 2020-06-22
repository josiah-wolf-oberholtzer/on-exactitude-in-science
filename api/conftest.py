import asyncio
import pytest

import aiogremlin.exception
from uqbar.strings import normalize
from gremlin_python.process.traversal import P
from maps import app, goblin, loader
from pathlib import Path

from aiohttp.test_utils import TestClient, TestServer


pytest_plugins = 'aiohttp.pytest_plugin'


@pytest.fixture(autouse=True)
async def goblin_app(event_loop):
    async with goblin.GoblinManager(aliases={"g": "tg"}) as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()
        yield goblin_app


@pytest.fixture
async def session(goblin_app):
    yield await goblin_app.session()


@pytest.fixture
async def testdata(goblin_app):
    path = Path(__file__).parent / "tests"
    await loader.load(goblin_app, path, consumer_count=8)
    yield


@pytest.fixture
async def api_client(event_loop):
    application = app.init_app(aliases={"g": "tg"})
    client = TestClient(TestServer(application))
    await client.start_server()
    yield client
    await client.close()
