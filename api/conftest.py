import pytest

from maps import goblin


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
