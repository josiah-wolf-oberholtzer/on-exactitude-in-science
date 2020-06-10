import asyncio
from pathlib import Path

import pytest
from aiogremlin.process.graph_traversal import __

from maps import loader


@pytest.mark.asyncio
async def test_loader_run(session):
    await loader.load(Path(__file__).parent, consumer_count=1)
    await asyncio.sleep(1)
    vertex_counts = await (session.traversal().V().groupCount().by(__.label())).next()
    edge_counts = await (session.traversal().E().groupCount().by(__.label())).next()
    assert vertex_counts == {
        "artist": 127,
        "company": 48,
        "master": 20,
        "release": 10,
        "track": 58,
    }
    assert edge_counts == {
        "alias_of": 49,
        "credited_with": 96,
        "includes": 58,
        "member_of": 21,
        "released": 27,
        "released_on": 10,
        "subrelease_of": 10,
        "subsidiary_of": 4,
    }
