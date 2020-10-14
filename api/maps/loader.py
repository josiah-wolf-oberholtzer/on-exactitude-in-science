import asyncio
import dataclasses
import datetime
import logging
import random
import traceback
from pathlib import Path
from typing import Any, Generator, List

from aiogremlin.exception import GremlinServerError
from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Cardinality, P, WithOptions

from maps import entities, goblin, xml

logger = logging.getLogger(__name__)


async def backoff(attempts, timeout=1.0, backoff_factor=1.5):
    await asyncio.sleep(timeout * pow(backoff_factor, attempts))


async def consume_edges(goblin_app, iterator, consumer_id=1, timestamp=0.0):
    procedures = {
        xml.Artist: load_artist_edges,
        xml.Company: load_company_edges,
    }
    session = await goblin_app.session()
    while (iterator_output := next(iterator)) is not None:
        entity_index, xml_entity = iterator_output
        if type(xml_entity) not in procedures:
            continue
        procedure = procedures[type(xml_entity)]
        await procedure(
            xml_entity,
            session,
            timestamp=timestamp,
            consumer_id=consumer_id,
            entity_index=entity_index,
        )
        if not entity_index % 100:
            logger.info(
                f"[{consumer_id}] E {type(xml_entity).__name__} {entity_index} [eid: {xml_entity.entity_id}]"
            )


async def consume_vertices(goblin_app, iterator, consumer_id=1, timestamp=0.0):
    procedures = {
        xml.Artist: load_artist_vertex,
        xml.Company: load_company_vertex,
        xml.Master: load_master_vertex,
        xml.Release: load_release_vertex_and_edges,
    }
    session = await goblin_app.session()
    while (iterator_output := next(iterator)) is not None:
        entity_index, xml_entity = iterator_output
        await upsert_vertex(session, xml_entity)
        if type(xml_entity) not in procedures:
            continue
        procedure = procedures[type(xml_entity)]
        await procedure(
            session,
            xml_entity,
            timestamp=timestamp,
            consumer_id=consumer_id,
            entity_index=entity_index,
        )
        if not entity_index % 100:
            logger.info(
                f"[{consumer_id}] V {type(xml_entity).__name__} {entity_index} [eid: {xml_entity.entity_id}]"
            )


async def drop():
    async with goblin.GoblinManager() as goblin_app:
        session = await goblin_app.session()
        await session.g.V().drop().toList()


async def drop_edges(session, label, entity_id, timestamp=None, both=False, names=None):
    for attempt in range(10):
        traversal = session.g.V().has(label, f"{label}_id", entity_id)
        if both:
            traversal = traversal.bothE("relationship")
        else:
            traversal = traversal.outE("relationship")
        if names:
            traversal = traversal.has("name", P.within(*names))
        traversal = traversal.has("last_modified", P.lt(timestamp))
        traversal = traversal.drop()
        try:
            return await traversal.toList()
        except GremlinServerError as e:
            logger.error(f"Backing off: {e!s}\n{traceback.format_exc()}")
            await backoff(attempt)


async def drop_properties(session, xml_entity, entity_map):
    to_drop = {}
    for key, desired in dataclasses.asdict(xml_entity).items():
        if key not in entity_map:
            continue
        elif not isinstance(desired, (list, set)):
            continue
        elif sorted(desired) == sorted(entity_map[key]):
            continue
        to_drop[key] = desired
    if not to_drop:
        return
    label = type(xml_entity).__name__.lower()
    for attempt in range(10):
        traversal = session.g.V().has(label, f"{label}_id", xml_entity.entity_id)
        for key, desired in sorted(to_drop.items()):
            traversal = traversal.sideEffect(
                __.properties(key).hasValue(P.without(*desired)).drop()
            )
        traversal = traversal.id()
        try:
            return await traversal.next()
        except GremlinServerError as e:
            logger.error(f"Backing off: {e!s}\n{traceback.format_exc()}")
            await backoff(attempt)


async def load(goblin_app, path, consumer_count=1, limit=None):
    """
    Update graph from Discogs .xml.gz files.

    Upsert vertices and edges

    Delete stale vertices and edges.

    New process:
    - load artist vertices
    - load company vertices
    - load master vertices
    - artist edges:
      - delete old artist outgoing edges
      - load artist outgoing edges
    - company edges:
      - load company outgoing edges
      - delete old company outgoing edges
    - load release vertices
        - delete old release edges
        - load new release edges
        - load track vertices
            - delete old track edges
            - load new track edges
    """
    logger.info("Loading data ...")
    start_date = datetime.datetime.now()
    # Load artist, company, and master vertices.
    iterator = producer(
        Path(path), consumer_count=consumer_count, limit=limit, releases=False
    )
    tasks = [
        consume_vertices(goblin_app, iterator, consumer_id=i, timestamp=start_date)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    # Load artist and company edges (alias-of, member-of, subsidiary-of).
    iterator = producer(
        Path(path),
        consumer_count=consumer_count,
        limit=limit,
        masters=False,
        releases=False,
    )
    tasks = [
        consume_edges(goblin_app, iterator, consumer_id=i, timestamp=start_date)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    # Load release (and track) vertices, and populate edges simultaneously.
    iterator = producer(
        Path(path),
        consumer_count=consumer_count,
        limit=limit,
        artists=False,
        companies=False,
        masters=False,
    )
    tasks = [
        consume_vertices(goblin_app, iterator, consumer_id=i, timestamp=start_date)
        for i in range(consumer_count)
    ]
    await asyncio.gather(*tasks)
    logger.info("Loaded data in {}".format(datetime.datetime.now() - start_date))
    # TODO: Purge vertices untouched during loading.


async def load_artist_edges(
    xml_artist, session, timestamp=None, consumer_id=0, entity_index=0
):
    logger.debug(
        f"[{consumer_id}] E Artist {entity_index} [eid: {xml_artist.entity_id}] Loading..."
    )
    for xml_alias in xml_artist.aliases:
        # alias but only from low to high id
        if xml_artist.entity_id > xml_alias.entity_id:
            continue
        await upsert_edge(
            session,
            source=(entities.Artist.__label__, xml_artist.entity_id),
            target=(entities.Artist.__label__, xml_alias.entity_id),
            source_label=entities.VertexLabelEnum.ARTIST,
            target_label=entities.VertexLabelEnum.ARTIST,
            name="Alias Of",
        )
    for xml_member in xml_artist.members:
        await upsert_edge(
            session,
            source=(entities.Artist.__label__, xml_member.entity_id),
            target=(entities.Artist.__label__, xml_artist.entity_id),
            source_label=entities.VertexLabelEnum.ARTIST,
            target_label=entities.VertexLabelEnum.ARTIST,
            name="Member Of",
        )
    await drop_edges(
        session,
        "artist",
        xml_artist.entity_id,
        timestamp=timestamp,
        both=False,
        names=["Alias Of", "Member Of"],
    )


async def load_artist_vertex(
    session, xml_artist, timestamp=None, consumer_id=0, entity_index=0
):
    logger.debug(
        f"[{consumer_id}] V Artist {entity_index} [eid: {xml_artist.entity_id}] Loading..."
    )
    entity_map = await upsert_vertex(session, xml_artist)
    await drop_properties(session, xml_artist, entity_map)


async def load_company_edges(
    xml_company, session, timestamp=None, consumer_id=0, entity_index=0
):
    logger.debug(
        f"[{consumer_id}] E Company {entity_index} [eid: {xml_company.entity_id}] Loading..."
    )
    for xml_subsidiary in xml_company.subsidiaries:
        await upsert_edge(
            session,
            source=(entities.Company.__label__, xml_subsidiary.entity_id),
            target=(entities.Company.__label__, xml_company.entity_id),
            source_label=entities.VertexLabelEnum.COMPANY,
            target_label=entities.VertexLabelEnum.COMPANY,
            name="Subsidiary Of",
        )
    await drop_edges(
        session,
        "company",
        xml_company.entity_id,
        timestamp=timestamp,
        both=False,
        names=["Subsidiary Of"],
    )


async def load_company_vertex(
    session, xml_company, timestamp=None, consumer_id=0, entity_index=0
):
    logger.debug(
        f"[{consumer_id}] V Company {entity_index} [eid: {xml_company.entity_id}] Loading..."
    )
    entity_map = await upsert_vertex(session, xml_company)
    await drop_properties(session, xml_company, entity_map)


async def load_master_vertex(
    session, xml_master, timestamp=None, consumer_id=0, entity_index=0
):
    logger.debug(
        f"[{consumer_id}] V Master {entity_index} [eid: {xml_master.entity_id}] Loading..."
    )
    entity_map = await upsert_vertex(session, xml_master)
    await drop_properties(session, xml_master, entity_map)


async def load_release_vertex_and_edges(
    session, xml_release, timestamp=None, consumer_id=0, entity_index=0
):
    logger.debug(
        f"[{consumer_id}] V Release {entity_index} [eid: {xml_release.entity_id}] Loading..."
    )
    primacy = 2
    if xml_release.is_main_release:
        primacy = 1
    elif xml_release.master_id is None:
        primacy = 1
    entity_map = await upsert_vertex(session, xml_release, primacy=primacy)
    await drop_properties(session, xml_release, entity_map)
    for xml_track in xml_release.tracks:
        entity_map = await upsert_vertex(session, xml_track, primacy=primacy)
        await drop_properties(session, xml_track, entity_map)
    for xml_artist in xml_release.artists:
        await upsert_edge(
            session,
            source=(entities.Artist.__label__, xml_artist.entity_id),
            target=(entities.Release.__label__, xml_release.entity_id),
            source_label=entities.VertexLabelEnum.ARTIST,
            target_label=entities.VertexLabelEnum.RELEASE,
            primacy=primacy,
            name="Released",
        )
    for xml_extra_artist in xml_release.extra_artists:
        for role in xml_extra_artist.roles:
            await upsert_edge(
                session,
                source=(entities.Artist.__label__, xml_extra_artist.entity_id),
                target=(entities.Release.__label__, xml_release.entity_id),
                source_label=entities.VertexLabelEnum.ARTIST,
                target_label=entities.VertexLabelEnum.RELEASE,
                primacy=primacy,
                name=role.name,
            )
    for xml_company in xml_release.companies:
        for role in xml_company.roles:
            await upsert_edge(
                session,
                source=(entities.Company.__label__, xml_company.entity_id),
                target=(entities.Release.__label__, xml_release.entity_id),
                source_label=entities.VertexLabelEnum.COMPANY,
                target_label=entities.VertexLabelEnum.RELEASE,
                primacy=primacy,
                name=role.name,
            )
    for xml_label in xml_release.labels:
        await upsert_edge(
            session,
            source=(entities.Release.__label__, xml_release.entity_id),
            target=(entities.Company.__label__, xml_label.entity_id),
            source_label=entities.VertexLabelEnum.RELEASE,
            target_label=entities.VertexLabelEnum.COMPANY,
            primacy=primacy,
            name="Released On",
        )
    if xml_release.master_id:
        await upsert_edge(
            session,
            source=(entities.Release.__label__, xml_release.entity_id),
            target=(entities.Master.__label__, xml_release.master_id),
            source_label=entities.VertexLabelEnum.RELEASE,
            target_label=entities.VertexLabelEnum.MASTER,
            primacy=primacy,
            name="Subrelease Of",
        )
    for xml_track in xml_release.tracks:
        await upsert_edge(
            session,
            source=(entities.Release.__label__, xml_release.entity_id),
            target=(entities.Track.__label__, xml_track.entity_id),
            source_label=entities.VertexLabelEnum.RELEASE,
            target_label=entities.VertexLabelEnum.TRACK,
            primacy=primacy,
            name="Includes",
        )
        for xml_artist in xml_track.artists:
            await upsert_edge(
                session,
                source=(entities.Artist.__label__, xml_artist.entity_id),
                target=(entities.Track.__label__, xml_track.entity_id),
                source_label=entities.VertexLabelEnum.ARTIST,
                target_label=entities.VertexLabelEnum.TRACK,
                primacy=primacy,
                name="Released",
            )
        for xml_extra_artist in xml_track.extra_artists:
            for role in xml_extra_artist.roles:
                await upsert_edge(
                    session,
                    source=(entities.Artist.__label__, xml_extra_artist.entity_id),
                    target=(entities.Track.__label__, xml_track.entity_id),
                    source_label=entities.VertexLabelEnum.ARTIST,
                    target_label=entities.VertexLabelEnum.TRACK,
                    primacy=primacy,
                    name=role.name,
                )
        await drop_edges(
            session, "track", xml_track.entity_id, timestamp=timestamp, both=True
        )
    await drop_edges(
        session, "release", xml_release.entity_id, timestamp=timestamp, both=True
    )


def producer(
    path: Path,
    consumer_count=1,
    limit=None,
    artists=True,
    companies=True,
    masters=True,
    releases=True,
):
    iterators: List[Generator[Any, None, None]] = []
    if artists:
        iterators.append(xml.get_artist_iterator(xml.get_xml_path(path, "artist")))
    if companies:
        iterators.append(xml.get_company_iterator(xml.get_xml_path(path, "label")))
    if masters:
        iterators.append(xml.get_master_iterator(xml.get_xml_path(path, "master")))
    if releases:
        iterators.append(xml.get_release_iterator(xml.get_xml_path(path, "release")))
    for iterator in iterators:
        for i, entity in enumerate(iterator):
            if i == limit:
                break
            yield i, entity
    for _ in range(consumer_count):
        yield None


async def upsert_vertex(session, xml_entity, **kwargs):
    # TODO: Return entity map, so we can purge stale properties
    kind = type(xml_entity).__name__
    goblin_entity = getattr(entities, kind)()
    label = kind.lower()
    kwargs = {
        **{
            key: value
            for key, value in dataclasses.asdict(xml_entity).items()
            if hasattr(goblin_entity, key) and value is not None
        },
        **kwargs,
    }
    entity_key = f"{label}_id"
    for attempt in range(10):
        traversal = (
            session.g.V()
            .has(label, entity_key, xml_entity.entity_id)
            .fold()
            .coalesce(
                __.unfold(),
                __.addV(label).property(f"{label}_id", xml_entity.entity_id),
            )
            .property("last_modified", datetime.datetime.now())
            .property("random", random.random())
        )
        for key, value in sorted(kwargs.items()):
            if isinstance(value, (set, list)):
                for subvalue in value:
                    traversal = traversal.property(Cardinality.set_, key, subvalue)
            else:
                traversal = traversal.property(Cardinality.single, key, value)
        traversal = traversal.valueMap().with_(WithOptions.tokens)
        try:
            return await traversal.next()
        except GremlinServerError as e:
            logger.error(f"Backing off: {e!s}\n{traceback.format_exc()}")
            await backoff(attempt)
    return None


async def upsert_edge(
    session, *, name, source, target, primacy=0, source_label=0, target_label=0
):
    from_label, from_id = source
    to_label, to_id = target
    for attempt in range(10):
        traversal = session.g
        if isinstance(source, int):
            traversal = traversal.V(source)
        else:
            traversal = traversal.V().has(source[0], f"{source[0]}_id", source[1])
        traversal = traversal.as_("source")
        if isinstance(target, int):
            traversal = traversal.V(target)
        else:
            traversal = traversal.V().has(target[0], f"{target[0]}_id", target[1])
        traversal = traversal.as_("target")
        traversal = (
            traversal
            # If source or target do not yield traversers, it will not make it here
            .addE("relationship")
            .from_("source")
            .to("target")
            .property("last_modified", datetime.datetime.now())
            .property("name", name)
            .property("primacy", primacy)
            .property("source_label", source_label)
            .property("target_label", target_label)
            .select("source", "target")
            .by(__.id())
        )
        try:
            return await traversal.next()
        except GremlinServerError as e:
            if "The provided traverser does not map to a value" in str(e):
                return
            logger.error(f"Backing off: {e!s}\n{traceback.format_exc()}")
            await backoff(attempt)
