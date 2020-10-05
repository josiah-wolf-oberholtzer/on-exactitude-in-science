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
        last_modified = mgmt.makePropertyKey('last_modified').dataType(Float.class).cardinality(SINGLE).make()
        master_id = mgmt.makePropertyKey('master_id').dataType(Integer.class).cardinality(SINGLE).make()
        name = mgmt.makePropertyKey('name').dataType(String.class).cardinality(SINGLE).make()
        position = mgmt.makePropertyKey('position').dataType(String.class).cardinality(SINGLE).make()
        primacy = mgmt.makePropertyKey('primacy').dataType(Integer.class).cardinality(SINGLE).make()
        random = mgmt.makePropertyKey('random').dataType(Float.class).cardinality(SINGLE).make()
        release_id = mgmt.makePropertyKey('release_id').dataType(Integer.class).cardinality(SINGLE).make()
        release_name = mgmt.makePropertyKey('release_name').dataType(String.class).cardinality(SINGLE).make()
        source_label = mgmt.makePropertyKey('source_label').dataType(Integer.class).cardinality(SINGLE).make()
        styles = mgmt.makePropertyKey('styles').dataType(String.class).cardinality(SET).make()
        target_label = mgmt.makePropertyKey('target_label').dataType(Integer.class).cardinality(SINGLE).make()
        track_id = mgmt.makePropertyKey('track_id').dataType(String.class).cardinality(SINGLE).make()
        videos = mgmt.makePropertyKey('videos').dataType(String.class).cardinality(SINGLE).make()
        year = mgmt.makePropertyKey('year').dataType(Integer.class).cardinality(SINGLE).make()

        // PageRank property keys
        mgmt.makePropertyKey('gremlin.pageRankVertexProgram.edgeCount').dataType(Integer.class).make();
        mgmt.makePropertyKey('gremlin.traversalVertexProgram.activeTraversers').dataType(Integer.class).make();
        mgmt.makePropertyKey('gremlin.traversalVertexProgram.haltedTraversers').dataType(Integer.class).make();
        page_rank = mgmt.makePropertyKey('page_rank').dataType(Double.class).make();

        // Edge labels
        relationship = mgmt.makeEdgeLabel('relationship').multiplicity(MULTI).make()

        // Vertex Indices
        mgmt.buildIndex('foo_by_artist_id', Vertex.class).addKey(artist_id).indexOnly(artist).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_company_id', Vertex.class).addKey(company_id).indexOnly(company).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_master_id', Vertex.class).addKey(master_id).indexOnly(master).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_release_id', Vertex.class).addKey(release_id).indexOnly(release).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_track_id', Vertex.class).addKey(track_id).indexOnly(track).unique().buildCompositeIndex()
        mgmt.buildIndex('foo_by_last_modified', Vertex.class).addKey(name).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_artist_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).indexOnly(artist).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_company_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).indexOnly(company).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_release_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).indexOnly(release).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_track_name', Vertex.class).addKey(name, Mapping.TEXTSTRING.asParameter()).indexOnly(track).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_page_rank', Vertex.class).addKey(page_rank).buildMixedIndex('search')
        mgmt.buildIndex('foo_by_random', Vertex.class).addKey(random).buildMixedIndex('search')

        // Vertex-Centric Indices
        mgmt.buildEdgeIndex(relationship, 'foo_by_relationship_name', Direction.BOTH, Order.asc, name)
        mgmt.buildEdgeIndex(relationship, 'foo_by_relationship_primacy_name', Direction.BOTH, Order.asc, primacy, source_label, target_label, name)

        mgmt.commit()
        """
    )
