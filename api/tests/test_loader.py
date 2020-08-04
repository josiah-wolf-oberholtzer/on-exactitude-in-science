import asyncio
import logging
from pathlib import Path

import pytest
from aiogremlin.process.graph_traversal import __

from maps import loader


@pytest.mark.asyncio
@pytest.mark.parametrize("consumer_count", [1, 2, 4, 8])
async def test_loader_run(goblin_app, session, consumer_count, caplog):
    caplog.set_level(logging.INFO)
    await loader.load(
        goblin_app, Path(__file__).parent, consumer_count=consumer_count, limit=200
    )
    await asyncio.sleep(1)
    vertex_counts = await (session.traversal().V().groupCount().by(__.label())).next()
    edge_counts = await (session.traversal().E().groupCount().by(__.label())).next()
    assert vertex_counts == {
        "artist": 200,
        "company": 200,
        "master": 200,
        "release": 200,
        "track": 872,
    }
    assert edge_counts == {
        "alias_of": 19,
        "credited_with": 415,
        "includes": 873,
        "member_of": 12,
        "released": 231,
        "released_on": 188,
        "subsidiary_of": 14,
    }
