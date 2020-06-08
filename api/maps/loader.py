import asyncio
from pathlib import Path

from maps import entities, goblin, xml


async def run(path, consumer_count=1, limit=None):
    cache = setup_cache()
    iterator = producer(path, consumer_count=consumer_count, limit=limit)
    tasks = [consumer(iterator, cache, consumer_id=i) for i in range(consumer_count)]
    await asyncio.gather(*tasks)


def setup_cache(self):
    cache = {}
    cache["op_count"] = 0
    cache["artists"] = {}
    cache["companies"] = {}
    cache["masters"] = {}
    cache["releases"] = {}
    cache["tracks"] = {}
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
            yield i, entities.VertexMixin, entity
    for iterator in [
        xml.get_artist_iterator(xml.get_xml_path(path, "artist")),
        xml.get_company_iterator(xml.get_xml_path(path, "label")),
        xml.get_release_iterator(xml.get_xml_path(path, "release")),
    ]:
        for i, entity in enumerate(iterator):
            if i == limit:
                break
            yield i, entities.EdgeMixin, entity
    for _ in consumer_count:
        yield None


async def consumer(iterator, cache, consumer_id=1):
    procedures = {
        (entities.VertexMixin, xml.Artist): load_artist_vertices,
        (entities.VertexMixin, xml.Label): load_company_vertices,
        (entities.VertexMixin, xml.Master): load_master_vertices,
        (entities.VertexMixin, xml.Release): load_release_vertices,
        (entities.EdgeMixin, xml.Artist): load_artist_edges,
        (entities.EdgeMixin, xml.Label): load_company_edges,
        (entities.EdgeMixin, xml.Release): load_release_edges,
    }
    async with goblin.GoblinManager() as goblin_app:
        session = await goblin_app.session()
        while (iterator_output := next(iterator)) is not None:
            _, entity_class, entity = iterator_output
            procedure = procedures[entity_class, type(entity)]
            procedure(entity, session, cache)


def load_artist_vertices(entity, session, cache):
    print(entity)


def load_company_vertices(entity, session, cache):
    print(entity)


def load_master_vertices(entity, session, cache):
    print(entity)


def load_release_vertices(entity, session, cache):
    print(entity)


def load_artist_edges(entity, session, cache):
    print(entity)


def load_company_edges(entity, session, cache):
    print(entity)


def load_release_edges(entity, session, cache):
    print(entity)
