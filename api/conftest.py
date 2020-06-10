import asyncio
import pytest

from maps import goblin

schema_loaded = []


@pytest.fixture(autouse=True)
async def load_schema():
    if schema_loaded:
        print("NO")
        return
    print("YES")
    goblin_manager = goblin.GoblinManager()
    async with goblin_manager as goblin_app:
        await goblin.load_schema(goblin_app)
    schema_loaded.append(True)



@pytest.fixture(autouse=True)
async def goblin_app(event_loop):
    goblin_manager = goblin.GoblinManager()
    async with goblin_manager as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()
        yield goblin_app


@pytest.fixture
async def session(goblin_app):
    yield await goblin_app.session()
