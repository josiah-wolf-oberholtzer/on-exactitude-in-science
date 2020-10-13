import asyncio
import logging
import time
from pathlib import Path

import pytest
from aiogremlin.process.graph_traversal import __

from maps import loader, xml


@pytest.fixture
async def session(goblin_app):
    yield await goblin_app.session()


@pytest.mark.asyncio
@pytest.mark.parametrize("consumer_count", [1, 8])
async def test_loader_run(goblin_app, session, consumer_count, caplog):
    caplog.set_level(logging.INFO, logger="maps")
    expected_vertex_counts = {
        "artist": 50,
        "company": 50,
        "master": 50,
        "release": 50,
        "track": 246,
    }
    expected_edge_counts = {
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
    for _ in range(2):
        await loader.load(
            goblin_app, Path(__file__).parent, consumer_count=consumer_count, limit=50
        )
        await asyncio.sleep(1)
        actual_vertex_counts = await (session.traversal().V().groupCount().by(__.label())).next()
        actual_edge_counts = await (
            session.traversal().E().groupCount().by(__.values("name"))
        ).next()
        assert actual_vertex_counts == expected_vertex_counts
        assert actual_edge_counts == expected_edge_counts


@pytest.mark.asyncio
async def test_load_artist_vertex(session):
    xml_artist = xml.Artist(entity_id=666, name="Foo")
    # verify non existence
    assert (await session.g.V().has("artist", "artist_id", 666).count().next()) == 0
    # verify existence
    await loader.load_artist_vertex(session, xml_artist, timestamp=time.time())
    values_a = await session.g.V().has("artist", "artist_id", 666).valueMap().next()
    last_modified_a = values_a.pop("last_modified")[0]
    random_a = values_a.pop("random")[0]
    assert values_a == {"artist_id": [666], "name": ["Foo"]}
    # modify xml artist
    xml_artist.name = "Foo 2"
    await loader.load_artist_vertex(session, xml_artist, timestamp=time.time())
    values_b = await session.g.V().has("artist", "artist_id", 666).valueMap().next()
    last_modified_b = values_b.pop("last_modified")[0]
    random_b = values_b.pop("random")[0]
    assert values_b == {"artist_id": [666], "name": ["Foo 2"]}
    assert random_b != random_a
    assert last_modified_b > last_modified_a


@pytest.mark.asyncio
async def test_load_company_vertex(session):
    xml_company = xml.Company(entity_id=23, name="Bar")
    # verify non existence
    await loader.load_company_vertex(session, xml_company, 0)
    # verify existence
    # modify xml company
    await loader.load_company_vertex(session, xml_company, 0)
    # verify modifications (including properties and timestamp)


@pytest.mark.asyncio
async def test_load_release_vertex(session):
    xml_release = xml.Release(entity_id=2001, name="Baz")
    # verify non existence
    await loader.load_release_vertex_and_edges(session, xml_release, 0)
    # verify existence
    # modify xml release
    await loader.load_release_vertex_and_edges(session, xml_release, 0)
    # verify modifications (including properties and timestamp)
