import pytest
from uqbar.strings import normalize

from maps.goblin import format_schema


@pytest.mark.asyncio
async def test_format_schema(goblin_app):
    assert format_schema(goblin_app, "foo") == normalize(
        """
        foo.tx().rollback()
        mgmt = foo.openManagement()

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
        last_modified = mgmt.makePropertyKey('last_modified').dataType(Float.class).cardinality(SINGLE).make()
        master_id = mgmt.makePropertyKey('master_id').dataType(Integer.class).cardinality(SINGLE).make()
        name = mgmt.makePropertyKey('name').dataType(String.class).cardinality(SINGLE).make()
        position = mgmt.makePropertyKey('position').dataType(String.class).cardinality(SINGLE).make()
        random = mgmt.makePropertyKey('random').dataType(Float.class).cardinality(SINGLE).make()
        release_id = mgmt.makePropertyKey('release_id').dataType(Integer.class).cardinality(SINGLE).make()
        role = mgmt.makePropertyKey('role').dataType(String.class).cardinality(SINGLE).make()
        styles = mgmt.makePropertyKey('styles').dataType(String.class).cardinality(SET).make()
        track_id = mgmt.makePropertyKey('track_id').dataType(String.class).cardinality(SINGLE).make()
        year = mgmt.makePropertyKey('year').dataType(Integer.class).cardinality(SINGLE).make()

        // PageRank property keys
        mgmt.makePropertyKey('gremlin.pageRankVertexProgram.edgeCount').dataType(Integer.class).make();
        mgmt.makePropertyKey('gremlin.traversalVertexProgram.activeTraversers').dataType(Integer.class).make();
        mgmt.makePropertyKey('gremlin.traversalVertexProgram.haltedTraversers').dataType(Integer.class).make();
        page_rank = mgmt.makePropertyKey('page_rank').dataType(Double.class).make();

        // Edge labels
        alias_of = mgmt.makeEdgeLabel('alias_of').multiplicity(MULTI).make()
        credited_with = mgmt.makeEdgeLabel('credited_with').multiplicity(MULTI).make()
        includes = mgmt.makeEdgeLabel('includes').multiplicity(MULTI).make()
        member_of = mgmt.makeEdgeLabel('member_of').multiplicity(MULTI).make()
        released = mgmt.makeEdgeLabel('released').multiplicity(MULTI).make()
        released_on = mgmt.makeEdgeLabel('released_on').multiplicity(MULTI).make()
        subrelease_of = mgmt.makeEdgeLabel('subrelease_of').multiplicity(MULTI).make()
        subsidiary_of = mgmt.makeEdgeLabel('subsidiary_of').multiplicity(MULTI).make()

        // Indices
        mgmt.buildIndex('foo_by_artist_id', Vertex.class).addKey(artist_id).indexOnly(artist).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_company_id', Vertex.class).addKey(company_id).indexOnly(company).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_master_id', Vertex.class).addKey(master_id).indexOnly(master).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_release_id', Vertex.class).addKey(release_id).indexOnly(release).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_track_id', Vertex.class).addKey(track_id).indexOnly(track).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_last_modified', Vertex.class).addKey(name).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_page_rank', Vertex.class).addKey(page_rank).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_random', Vertex.class).addKey(random).buildMixedIndex('search')

        mgmt.commit()
        """
    )
