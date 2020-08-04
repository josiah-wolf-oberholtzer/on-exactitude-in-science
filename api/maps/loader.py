import asyncio
import dataclasses
import datetime
import logging
import random
import time
import traceback
from pathlib import Path

from aiogremlin.exception import GremlinServerError
from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Cardinality, P

from maps import entities, goblin, xml

logging.basicConfig()

logger = logging.getLogger(__name__)


async def drop():
    async with goblin.GoblinManager() as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()


async def load(goblin_app, path, consumer_count=1, limit=None):
    logger.info("Loading data ...")
    start_date = datetime.datetime.now()
    start_time = time.time()
    iterator = producer(Path(path), consumer_count=consumer_count, limit=limit)
    tasks = [
        vertex_consumer(goblin_app, iterator, consumer_id=i, timestamp=start_time)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    iterator = producer(Path(path), consumer_count=consumer_count, limit=limit)
    tasks = [
        edge_consumer(goblin_app, iterator, consumer_id=i, timestamp=start_time)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    logger.info("Loaded data in {}".format(datetime.datetime.now() - start_date))


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


async def vertex_consumer(goblin_app, iterator, consumer_id=1, timestamp=0.0):
    session = await goblin_app.session()
    while (iterator_output := next(iterator)) is not None:
        i, xml_entity = iterator_output
        await upsert_vertex(xml_entity, session)
        if isinstance(xml_entity, xml.Release):
            for xml_track in xml_entity.tracks:
                await upsert_vertex(xml_track, session)
        if not i % 100:
            logger.info(
                f"[{consumer_id}] V {type(xml_entity).__name__} {i} [eid: {xml_entity.entity_id}]"
            )


async def edge_consumer(goblin_app, iterator, consumer_id=1, timestamp=0.0):
    procedures = {
        xml.Artist: load_artist_edges,
        xml.Company: load_company_edges,
        xml.Release: load_release_edges,
    }
    session = await goblin_app.session()
    while (iterator_output := next(iterator)) is not None:
        i, xml_entity = iterator_output
        if type(xml_entity) not in procedures:
            continue
        procedure = procedures[type(xml_entity)]
        await procedure(xml_entity, session)
        """
        label = type(xml_entity).__name__.lower()
        await (
            session.g.V()
            .has(label, f"{label}_id", xml_entity.entity_id)
            .bothE()
            .has("last_modified", P.lt(timestamp))
            .drop()
            .toList()
        )
        """
        if not i % 100:
            logger.info(
                f"[{consumer_id}] E {type(xml_entity).__name__} {i} [eid: {xml_entity.entity_id}]"
            )


async def load_artist_edges(xml_artist, session):
    for xml_alias in xml_artist.aliases:
        # alias but only from low to high id
        if xml_artist.entity_id > xml_alias.entity_id:
            continue
        await upsert_edge(
            session,
            entities.AliasOf.__label__,
            entities.Artist.__label__,
            xml_artist.entity_id,
            entities.Artist.__label__,
            xml_alias.entity_id,
        )
    for xml_member in xml_artist.members:
        await upsert_edge(
            session,
            entities.MemberOf.__label__,
            entities.Artist.__label__,
            xml_member.entity_id,
            entities.Artist.__label__,
            xml_artist.entity_id,
        )


async def load_company_edges(xml_company, session):
    for xml_subsidiary in xml_company.subsidiaries:
        await upsert_edge(
            session,
            entities.SubsidiaryOf.__label__,
            entities.Company.__label__,
            xml_subsidiary.entity_id,
            entities.Company.__label__,
            xml_company.entity_id,
        )


async def load_release_edges(xml_release, session):
    for xml_artist in xml_release.artists:
        await upsert_edge(
            session,
            entities.Released.__label__,
            entities.Artist.__label__,
            xml_artist.entity_id,
            entities.Release.__label__,
            xml_release.entity_id,
        )
    for xml_extra_artist in xml_release.extra_artists:
        for role in xml_extra_artist.roles:
            await upsert_edge(
                session,
                entities.CreditedWith.__label__,
                entities.Artist.__label__,
                xml_extra_artist.entity_id,
                entities.Release.__label__,
                xml_release.entity_id,
                role=role.name,
            )
    for xml_company in xml_release.companies:
        for role in xml_company.roles:
            await upsert_edge(
                session,
                entities.CreditedWith.__label__,
                entities.Company.__label__,
                xml_company.entity_id,
                entities.Release.__label__,
                xml_release.entity_id,
                role=role.name,
            )
    for xml_label in xml_release.labels:
        await upsert_edge(
            session,
            entities.ReleasedOn.__label__,
            entities.Release.__label__,
            xml_release.entity_id,
            entities.Company.__label__,
            xml_label.entity_id,
        )
    for xml_track in xml_release.tracks:
        await upsert_edge(
            session,
            entities.Includes.__label__,
            entities.Release.__label__,
            xml_release.entity_id,
            entities.Track.__label__,
            xml_track.entity_id,
        )
        for xml_artist in xml_track.artists:
            await upsert_edge(
                session,
                entities.Released.__label__,
                entities.Artist.__label__,
                xml_artist.entity_id,
                entities.Track.__label__,
                xml_track.entity_id,
            )
        for xml_extra_artist in xml_track.extra_artists:
            for role in xml_extra_artist.roles:
                await upsert_edge(
                    session,
                    entities.CreditedWith.__label__,
                    entities.Artist.__label__,
                    xml_extra_artist.entity_id,
                    entities.Track.__label__,
                    xml_track.entity_id,
                    role=role.name,
                )
    if xml_release.master_id:
        await upsert_edge(
            session,
            entities.SubreleaseOf.__label__,
            entities.Release.__label__,
            xml_release.entity_id,
            entities.Master.__label__,
            xml_release.master_id,
        )


async def upsert_vertex(xml_entity, session):
    kind = type(xml_entity).__name__
    goblin_entity = getattr(entities, kind)()
    label = kind.lower()
    entity_key = f"{label}_id"
    traversal = (
        session.g.V()
        .has(label, entity_key, xml_entity.entity_id)
        .fold()
        .coalesce(
            __.unfold(), __.addV(label).property(entity_key, xml_entity.entity_id),
        )
        .property("last_modified", time.time())
        .property("random", random.random())
    )
    for key, value in dataclasses.asdict(xml_entity).items():
        if value is None or key == entity_key or not hasattr(goblin_entity, key):
            continue
        if isinstance(value, (set, list)):
            for subvalue in value:
                traversal = traversal.property(Cardinality.set_, key, subvalue)
        else:
            traversal = traversal.property(Cardinality.single, key, value)
    traversal = traversal.id()
    for attempt in range(10):
        try:
            return await traversal.next()
        except GremlinServerError as e:
            logger.error(f"Backing off: {e!s}\n{traceback.format_exc()}")
            await backoff(attempt)


async def upsert_edge(
    session, edge_label, from_label, from_id, to_label, to_id, **kwargs
):
    traversal = (
        session.g.V()
        .has(from_label, f"{from_label}_id", from_id)
        .addE(edge_label)
        .to(__.V().has(to_label, f"{to_label}_id", to_id))
        .property("last_modified", time.time())
    )
    for key, value in kwargs.items():
        traversal = traversal.property(key, value)
    for attempt in range(10):
        try:
            await traversal.fold().toList()
        except GremlinServerError as e:
            if "The provided traverser does not map to a value" in str(e):
                return
            logger.error(f"Backing off: {e!s}\n{traceback.format_exc()}")
            await backoff(attempt)


async def backoff(attempts, timeout=1.0, backoff_factor=1.5):
    await asyncio.sleep(timeout * pow(backoff_factor, attempts))
