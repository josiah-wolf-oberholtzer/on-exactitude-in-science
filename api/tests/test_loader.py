import asyncio
import logging
from pathlib import Path

import pytest
from aiogremlin.process.graph_traversal import __

from maps import loader


@pytest.fixture
async def session(goblin_app):
    yield await goblin_app.session()


@pytest.mark.asyncio
@pytest.mark.parametrize("consumer_count", [1, 2, 4, 8])
async def test_loader_run(goblin_app, session, consumer_count, caplog):
    caplog.set_level(logging.INFO)
    await loader.load(
        goblin_app, Path(__file__).parent, consumer_count=consumer_count, limit=50
    )
    await asyncio.sleep(1)
    vertex_counts = await (session.traversal().V().groupCount().by(__.label())).next()
    edge_counts = await (session.traversal().E().groupCount().by(__.label())).next()
    assert vertex_counts == {
        "artist": 50,
        "company": 50,
        "master": 50,
        "release": 50,
        "track": 246,
    }
    assert edge_counts == {
        "alias_of": 5,
        "credited_with": 91,
        "includes": 246,
        "member_of": 7,
        "released": 34,
        "released_on": 50,
        "subsidiary_of": 1,
    }
