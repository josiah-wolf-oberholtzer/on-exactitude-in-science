import asyncio
import dataclasses
import datetime
import logging
import random
import time
from pathlib import Path

from aiogremlin.exception import GremlinServerError
from gremlin_python.process.traversal import Binding

from maps import entities, goblin, xml

logger = logging.getLogger(__name__)


async def load(goblin_app, path, consumer_count=1, limit=None):
    logger.info("Loading data ...")
    start_time = datetime.datetime.now()
    cache = setup_cache()
    iterator = producer(Path(path), consumer_count=consumer_count, limit=limit)
    tasks = [
        consumer(goblin_app, iterator, cache, consumer_id=i)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    logger.info(str({k: len(v) for k, v in cache.items()}))
    logger.info("Loaded data in {}".format(datetime.datetime.now() - start_time))
    return cache


async def drop():
    async with goblin.GoblinManager() as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()


def setup_cache():
    cache = {}
    cache["Artist"] = {}
    cache["Company"] = {}
    cache["Master"] = {}
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
            yield i, entity
    for _ in range(consumer_count):
        yield None


async def consumer(goblin_app, iterator, cache, consumer_id=1):
    procedures = {
        xml.Artist: load_artist,
        xml.Company: load_company,
        xml.Master: load_master,
        xml.Release: load_release,
    }
    session = await goblin_app.session()
    while (iterator_output := next(iterator)) is not None:
        i, xml_entity = iterator_output
        procedure = procedures[type(xml_entity)]
        vid = await procedure(xml_entity, session, cache)
        if not i % 100:
            logger.info(
                f"[{consumer_id}] {type(xml_entity).__name__} {i} [eid: {xml_entity.entity_id}, vid: {vid}] "
                + str({k: len(v) for k, v in cache.items()})
            )


async def load_artist(xml_artist, session, cache):
    artist_vid = await save_vertex(xml_artist, session, cache)
    for xml_alias in xml_artist.aliases:
        alias_vid = await save_vertex(xml_alias, session, cache)
        if xml_artist.entity_id < xml_alias.entity_id:
            await save_edge(session, entities.AliasOf, artist_vid, alias_vid)
    for xml_group in xml_artist.groups:
        group_vid = await save_vertex(xml_group, session, cache)
        await save_edge(session, entities.MemberOf, artist_vid, group_vid)
    for xml_member in xml_artist.members:
        await save_vertex(xml_member, session, cache)
    return artist_vid


async def load_company(xml_company, session, cache):
    company_vid = await save_vertex(xml_company, session, cache)
    if xml_company.parent_company:
        parent_company_vid = await save_vertex(
            xml_company.parent_company, session, cache
        )
        await save_edge(session, entities.SubsidiaryOf, company_vid, parent_company_vid)
    for xml_subsidiary in xml_company.subsidiaries:
        await save_vertex(xml_subsidiary, session, cache)
    return company_vid


async def load_master(xml_master, session, cache):
    return await save_vertex(xml_master, session, cache)


async def load_release(xml_release, session, cache):
    release_vid = await save_vertex(xml_release, session, cache)
    for xml_artist in xml_release.artists:
        artist_vid = await save_vertex(xml_artist, session, cache)
        await save_edge(session, entities.Released, artist_vid, release_vid)
    for xml_extra_artist in xml_release.extra_artists:
        extra_artist_vid = await save_vertex(xml_extra_artist, session, cache)
        for role in xml_extra_artist.roles:
            await save_edge(
                session,
                entities.CreditedWith,
                extra_artist_vid,
                release_vid,
                role=role.name,
            )
    for xml_company in xml_release.companies:
        company_vid = await save_vertex(xml_company, session, cache)
        for role in xml_company.roles:
            await save_edge(
                session, entities.CreditedWith, company_vid, release_vid, role=role.name
            )
    for xml_label in xml_release.labels:
        label_vid = await save_vertex(xml_label, session, cache)
        await save_edge(session, entities.ReleasedOn, release_vid, label_vid)
    for xml_track in xml_release.tracks:
        track_vid = await save_vertex(xml_track, session, cache)
        await save_edge(session, entities.Includes, release_vid, track_vid)
        for xml_artist in xml_track.artists:
            artist_vid = await save_vertex(xml_artist, session, cache)
            await save_edge(session, entities.Released, artist_vid, track_vid)
        for xml_extra_artist in xml_track.extra_artists:
            extra_artist_vid = await save_vertex(xml_extra_artist, session, cache)
            for role in xml_extra_artist.roles:
                await save_edge(
                    session,
                    entities.CreditedWith,
                    extra_artist_vid,
                    track_vid,
                    role=role.name,
                )
    if xml_release.master_id:
        master = xml.Master(
            entity_id=xml_release.master_id, main_release_id=0, name=xml_release.name
        )
        master_vid = await save_vertex(master, session, cache)
        await save_edge(session, entities.SubreleaseOf, release_vid, master_vid)
    return release_vid


async def save_vertex(xml_entity, session, cache):
    kind = type(xml_entity).__name__
    if kind not in ("Release", "Track"):
        if isinstance((goblin_id := cache[kind].get(xml_entity.entity_id)), int):
            logger.debug(f"Cache Hit:  {kind} {xml_entity.entity_id}")
            return goblin_id
        elif isinstance(goblin_id, asyncio.Event):
            # Another consumer is currently populating this same exact vertex
            await goblin_id.wait()
            if (vertex_id := cache[kind].get(xml_entity.entity_id)) is not None:
                return vertex_id
        logger.debug(f"Cache Miss: {kind} {xml_entity.entity_id}")
    for attempt in range(10):
        try:
            if kind not in ("Release", "Track"):
                event = cache[kind][xml_entity.entity_id] = asyncio.Event()
            goblin_entity = getattr(entities, kind)()
            setattr(goblin_entity, f"{kind.lower()}_id", xml_entity.entity_id)
            goblin_entity.last_modified = time.time()
            goblin_entity.random = random.random()
            for key, value in dataclasses.asdict(xml_entity).items():
                # if isinstance(value, list):
                #    continue  # TODO: Implement goblin schema loading
                if value is None:
                    continue
                if hasattr(goblin_entity, key):
                    setattr(goblin_entity, key, value)
            await session.save(goblin_entity)
            session.current.clear()  # Don't cache vertices on the session
            if kind not in ("Release", "Track"):
                cache[kind][xml_entity.entity_id] = goblin_entity.id
                event.set()
            break
        except GremlinServerError as e:
            logger.error(e)
            await backoff(attempt)
    else:
        if kind not in ("Release", "Track"):
            cache[kind].pop(xml_entity.entity_id)
            event.set()
        raise RuntimeError
    return goblin_entity.id


async def backoff(attempts, timeout=1.0, backoff_factor=1.5):
    await asyncio.sleep(timeout * pow(backoff_factor, attempts))


async def save_edge(session, edge_class, from_id, to_id, **kwargs):
    for attempt in range(10):
        try:
            traversal = (
                session.g.V(Binding("sid", from_id))
                .addE(edge_class.__label__)
                .to(session.g.V(Binding("tid", to_id)))
            )
            for key, value in kwargs.items():
                traversal = traversal.property(key, value)
            return await traversal.id().next()
        except GremlinServerError as e:
            logger.error(e)
            await backoff(attempt)
