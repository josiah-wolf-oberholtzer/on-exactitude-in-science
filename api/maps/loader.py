import asyncio
import dataclasses
import time
from pathlib import Path

from maps import entities, goblin, xml


async def run(path, consumer_count=1, limit=None):
    start_time = time.time()
    cache = setup_cache()
    iterator = producer(path, consumer_count=consumer_count, limit=limit)
    tasks = [consumer(iterator, cache, consumer_id=i) for i in range(consumer_count)]
    await asyncio.gather(*tasks)
    print(cache)
    stop_time = time.time()
    print(f"Elapsed Time: {stop_time - start_time}")


def setup_cache():
    cache = {}
    cache["Artist"] = {}
    cache["Company"] = {}
    cache["Master"] = {}
    cache["Release"] = {}
    cache["Track"] = {}
    return cache


def producer(path: Path, consumer_count=1, limit=None):
    for iterator in [
        xml.get_artist_iterator(xml.get_xml_path(path, "artist")),
        xml.get_company_iterator(xml.get_xml_path(path, "label")),
        xml.get_master_iterator(xml.get_xml_path(path, "master")),
        xml.get_release_iterator(xml.get_xml_path(path, "release")),
    ]:
        for i, entity in enumerate(iterator):
            if i == limit:
                break
            yield i, entities.Vertex, entity
    for iterator in [
        xml.get_artist_iterator(xml.get_xml_path(path, "artist")),
        xml.get_company_iterator(xml.get_xml_path(path, "label")),
        xml.get_release_iterator(xml.get_xml_path(path, "release")),
    ]:
        for i, entity in enumerate(iterator):
            if i == limit:
                break
            yield i, entities.Edge, entity
    for _ in range(consumer_count):
        yield None


async def consumer(iterator, cache, consumer_id=1):
    procedures = {
        (entities.Vertex, xml.Artist): load_artist_vertices,
        (entities.Vertex, xml.Company): load_company_vertices,
        (entities.Vertex, xml.Master): load_master_vertices,
        (entities.Vertex, xml.Release): load_release_vertices,
        (entities.Edge, xml.Artist): load_artist_edges,
        (entities.Edge, xml.Company): load_company_edges,
        (entities.Edge, xml.Release): load_release_edges,
    }
    async with goblin.GoblinManager() as goblin_app:
        session = await goblin_app.session()
        while (iterator_output := next(iterator)) is not None:
            _, entity_class, entity = iterator_output
            procedure = procedures[entity_class, type(entity)]
            await procedure(entity, session, cache)


async def load_artist_vertices(xml_artist, session, cache):
    await save_vertex(xml_artist, session, cache)
    for xml_alias in xml_artist.aliases:
        await save_vertex(xml_alias, session, cache)
    for xml_group in xml_artist.groups:
        await save_vertex(xml_group, session, cache)
    for xml_member in xml_artist.members:
        await save_vertex(xml_member, session, cache)


async def load_company_vertices(xml_company, session, cache):
    await save_vertex(xml_company, session, cache)
    if xml_company.parent_company:
        await save_vertex(xml_company.parent_company, session, cache)
    for xml_subsidiary in xml_company.subsidiaries:
        await save_vertex(xml_subsidiary, session, cache)


async def load_master_vertices(xml_master, session, cache):
    await save_vertex(xml_master, session, cache)


async def load_release_vertices(xml_release, session, cache):
    await save_vertex(xml_release, session, cache)
    for xml_artist in xml_release.artists:
        await save_vertex(xml_artist, session, cache)
    for xml_extra_artist in xml_release.extra_artists:
        await save_vertex(xml_extra_artist, session, cache)
    for xml_company in xml_release.companies:
        await save_vertex(xml_company, session, cache)
    for xml_track in xml_release.tracks:
        await save_vertex(xml_track, session, cache)
        for xml_artist in xml_track.artists:
            await save_vertex(xml_artist, session, cache)
        for xml_extra_artist in xml_track.extra_artists:
            await save_vertex(xml_extra_artist, session, cache)


async def load_artist_edges(xml_artist, session, cache):
    pass


async def load_company_edges(xml_company, session, cache):
    pass


async def load_release_edges(xml_release, session, cache):
    pass


async def save_vertex(xml_entity, session, cache):
    kind = type(xml_entity).__name__
    if xml_entity.entity_id in cache[kind]:
        print(f"Cache Hit:  {kind} {xml_entity.entity_id}")
        return
    print(f"Cache Miss: {kind} {xml_entity.entity_id}")
    goblin_entity = getattr(entities, kind)()
    setattr(goblin_entity, f"{kind.lower()}_id", xml_entity.entity_id)
    for key, value in dataclasses.asdict(xml_entity).items():
        if isinstance(value, list):
            continue  # TODO: Implement goblin schema loading
        elif value is None:
            continue
        if hasattr(goblin_entity, key):
            setattr(goblin_entity, key, value)
    await session.save(goblin_entity)
    cache[kind][xml_entity.entity_id] = goblin_entity.id
