import pytest
from uqbar.strings import normalize

from maps.goblin import format_schema, load_schema


@pytest.mark.asyncio
async def test_format_schema(goblin_app):
    assert format_schema(goblin_app) == normalize(
        """
        graph.tx().rollback()
        mgmt = graph.openManagement()

        // Vertex labels
        artist = mgmt.makeVertexLabel('artist').make()
        company = mgmt.makeVertexLabel('company').make()
        master = mgmt.makeVertexLabel('master').make()
        release = mgmt.makeVertexLabel('release').make()
        track = mgmt.makeVertexLabel('track').make()

        // Property keys
        artist_id = mgmt.makePropertyKey('artist_id').dataType(Integer.class).cardinality(SINGLE).make()
        company_id = mgmt.makePropertyKey('company_id').dataType(Integer.class).cardinality(SINGLE).make()
        country = mgmt.makePropertyKey('country').dataType(String.class).cardinality(SINGLE).make()
        dirty = mgmt.makePropertyKey('dirty').dataType(String.class).cardinality(SINGLE).make()
        formats = mgmt.makePropertyKey('formats').dataType(String.class).cardinality(SET).make()
        genres = mgmt.makePropertyKey('genres').dataType(String.class).cardinality(SET).make()
        is_main_release = mgmt.makePropertyKey('is_main_release').dataType(Boolean.class).cardinality(SINGLE).make()
        master_id = mgmt.makePropertyKey('master_id').dataType(Integer.class).cardinality(SINGLE).make()
        name = mgmt.makePropertyKey('name').dataType(String.class).cardinality(SINGLE).make()
        position = mgmt.makePropertyKey('position').dataType(String.class).cardinality(SINGLE).make()
        random = mgmt.makePropertyKey('random').dataType(Float.class).cardinality(SINGLE).make()
        release_id = mgmt.makePropertyKey('release_id').dataType(Integer.class).cardinality(SINGLE).make()
        role = mgmt.makePropertyKey('role').dataType(String.class).cardinality(SINGLE).make()
        style = mgmt.makePropertyKey('style').dataType(String.class).cardinality(SET).make()
        track_id = mgmt.makePropertyKey('track_id').dataType(String.class).cardinality(SINGLE).make()
        year = mgmt.makePropertyKey('year').dataType(Integer.class).cardinality(SINGLE).make()

        // Edge labels
        alias_of = mgmt.makeEdgeLabel('alias_of').multiplicity(SIMPLE).make()
        credited_with = mgmt.makeEdgeLabel('credited_with').multiplicity(SIMPLE).make()
        includes = mgmt.makeEdgeLabel('includes').multiplicity(SIMPLE).make()
        member_of = mgmt.makeEdgeLabel('member_of').multiplicity(SIMPLE).make()
        released = mgmt.makeEdgeLabel('released').multiplicity(SIMPLE).make()
        released_on = mgmt.makeEdgeLabel('released_on').multiplicity(SIMPLE).make()
        subrelease_of = mgmt.makeEdgeLabel('subrelease_of').multiplicity(SIMPLE).make()
        subsidiary_of = mgmt.makeEdgeLabel('subsidiary_of').multiplicity(SIMPLE).make()

        mgmt.commit()
        """
    )


@pytest.mark.asyncio
async def test_load_schema(goblin_app):
    await load_schema(goblin_app)
