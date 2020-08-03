import asyncio
import dataclasses
import datetime
import logging
import random
import time
from pathlib import Path

from aiogremlin.exception import GremlinServerError
from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Binding, P

from maps import entities, goblin, xml

logging.basicConfig()

logger = logging.getLogger(__name__)


async def load(goblin_app, path, consumer_count=1, limit=None):
    logger.info("Loading data ...")
    start_time = datetime.datetime.now()
    iterator = producer(Path(path), consumer_count=consumer_count, limit=limit)
    now = time.time()
    tasks = [
        consumer(goblin_app, iterator, consumer_id=i, timestamp=now)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    logger.info("Loaded data in {}".format(datetime.datetime.now() - start_time))


async def drop():
    async with goblin.GoblinManager() as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()


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


async def consumer(goblin_app, iterator, consumer_id=1, timestamp=0.0):
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
        vid = await procedure(xml_entity, session)
        await session.g.V(vid).bothE().has(
            "last_modified", P.lt(timestamp)
        ).drop().toList()
        if not i % 100:
            logger.info(
                f"[{consumer_id}] {type(xml_entity).__name__} {i} [eid: {xml_entity.entity_id}, vid: {vid}]"
            )


async def load_artist(xml_artist, session):
    artist_vid = await save_vertex(xml_artist, session)
    for xml_alias in xml_artist.aliases:
        alias_vid = await save_vertex(xml_alias, session)
        if xml_artist.entity_id < xml_alias.entity_id:
            await save_edge(session, entities.AliasOf, artist_vid, alias_vid)
    for xml_group in xml_artist.groups:
        group_vid = await save_vertex(xml_group, session)
        await save_edge(session, entities.MemberOf, artist_vid, group_vid)
    for xml_member in xml_artist.members:
        await save_vertex(xml_member, session)
    return artist_vid


async def load_company(xml_company, session):
    company_vid = await save_vertex(xml_company, session)
    if xml_company.parent_company:
        parent_company_vid = await save_vertex(xml_company.parent_company, session)
        await save_edge(session, entities.SubsidiaryOf, company_vid, parent_company_vid)
    for xml_subsidiary in xml_company.subsidiaries:
        await save_vertex(xml_subsidiary, session)
    return company_vid


async def load_master(xml_master, session):
    return await save_vertex(xml_master, session)


async def load_release(xml_release, session):
    release_vid = await save_vertex(xml_release, session)
    for xml_artist in xml_release.artists:
        artist_vid = await save_vertex(xml_artist, session)
        await save_edge(session, entities.Released, artist_vid, release_vid)
    for xml_extra_artist in xml_release.extra_artists:
        extra_artist_vid = await save_vertex(xml_extra_artist, session)
        for role in xml_extra_artist.roles:
            await save_edge(
                session,
                entities.CreditedWith,
                extra_artist_vid,
                release_vid,
                role=role.name,
            )
    for xml_company in xml_release.companies:
        company_vid = await save_vertex(xml_company, session)
        for role in xml_company.roles:
            await save_edge(
                session, entities.CreditedWith, company_vid, release_vid, role=role.name
            )
    for xml_label in xml_release.labels:
        label_vid = await save_vertex(xml_label, session)
        await save_edge(session, entities.ReleasedOn, release_vid, label_vid)
    for xml_track in xml_release.tracks:
        track_vid = await save_vertex(xml_track, session)
        await save_edge(session, entities.Includes, release_vid, track_vid)
        for xml_artist in xml_track.artists:
            artist_vid = await save_vertex(xml_artist, session)
            await save_edge(session, entities.Released, artist_vid, track_vid)
        for xml_extra_artist in xml_track.extra_artists:
            extra_artist_vid = await save_vertex(xml_extra_artist, session)
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
        master_vid = await save_vertex(master, session)
        await save_edge(session, entities.SubreleaseOf, release_vid, master_vid)
    return release_vid


async def save_vertex(xml_entity, session):
    for attempt in range(10):
        try:
            kind = type(xml_entity).__name__
            goblin_entity = getattr(entities, kind)()
            label = kind.lower()
            entity_key = f"{label}_id"
            traversal = (
                session.g.V()
                .has(label, entity_key, xml_entity.entity_id)
                .fold()
                .coalesce(
                    __.unfold(),
                    __.addV(label).property(entity_key, xml_entity.entity_id),
                )
                .property("last_modified", time.time())
                .property("random", random.random())
            )
            for key, value in dataclasses.asdict(xml_entity).items():
                if value is None or key == entity_key:
                    continue
                if hasattr(goblin_entity, key):
                    traversal = traversal.property(key, value)
            return await traversal.id().next()
        except GremlinServerError as e:
            logger.error(f"Backing off: {e!s}")
            await backoff(attempt)


async def save_edge(session, edge_class, from_id, to_id, **kwargs):
    for attempt in range(10):
        try:
            traversal = (
                session.g.V(from_id)
                .addE(edge_class.__label__)
                .to(__.V(to_id))
                .property("last_modified", time.time())
            )
            for key, value in kwargs.items():
                traversal = traversal.property(key, value)
            return await traversal.id().next()
        except GremlinServerError as e:
            logger.error(f"Backing off: {e!s}")
            await backoff(attempt)


async def backoff(attempts, timeout=1.0, backoff_factor=1.5):
    await asyncio.sleep(timeout * pow(backoff_factor, attempts))
