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
    edge_counts = await (
        session.traversal().E().groupCount().by(__.values("name"))
    ).next()
    assert vertex_counts == {
        "artist": 50,
        "company": 50,
        "master": 50,
        "release": 50,
        "track": 246,
    }
    assert edge_counts == {
        "Alias Of": 5,
        "Arranged By": 15,
        "Co-producer": 1,
        "Copyright (c)": 5,
        "DJ Mix": 1,
        "Distributed By": 2,
        "Includes": 246,
        "Keyboards": 1,
        "Manufactured By": 2,
        "Member Of": 7,
        "Mixed By": 1,
        "Performer": 4,
        "Phonographic Copyright (p)": 5,
        "Presenter": 1,
        "Producer": 20,
        "Recorded By": 4,
        "Released On": 50,
        "Released": 34,
        "Remix": 15,
        "Strings": 1,
        "Subsidiary Of": 1,
        "Written-By": 13,
    }
