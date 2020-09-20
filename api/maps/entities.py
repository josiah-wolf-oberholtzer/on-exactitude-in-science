import goblin
from gremlin_python.process.traversal import Cardinality


class Artist(goblin.Vertex):
    __label__ = "artist"
    artist_id = goblin.Property(goblin.Integer)
    last_modified = goblin.Property(goblin.Float)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)


class Company(goblin.Vertex):
    __label__ = "company"
    company_id = goblin.Property(goblin.Integer)
    last_modified = goblin.Property(goblin.Float)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)


class Master(goblin.Vertex):
    __label__ = "master"
    last_modified = goblin.Property(goblin.Float)
    master_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)


class Release(goblin.Vertex):
    __label__ = "release"
    country = goblin.Property(goblin.String)
    formats = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    genres = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    is_main_release = goblin.Property(goblin.Boolean)
    last_modified = goblin.Property(goblin.Float)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)
    release_id = goblin.Property(goblin.Integer)
    styles = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    videos = goblin.Property(goblin.String)
    year = goblin.Property(goblin.Integer)


class Track(goblin.Vertex):
    __label__ = "track"
    last_modified = goblin.Property(goblin.Float)
    name = goblin.Property(goblin.String)
    position = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)
    track_id = goblin.Property(goblin.String)


class AliasOf(goblin.Edge):
    __label__ = "alias_of"
    __valid_relations__ = frozenset([(Artist, Artist)])
    last_modified = goblin.Property(goblin.Float)


class CreditedWith(goblin.Edge):
    __label__ = "credited_with"
    __valid_relations__ = frozenset(
        [(Artist, Release), (Artist, Track), (Company, Release)]
    )
    last_modified = goblin.Property(goblin.Float)
    role = goblin.Property(goblin.String)


class Includes(goblin.Edge):
    __label__ = "includes"
    __valid_relations__ = frozenset([(Release, Track)])
    last_modified = goblin.Property(goblin.Float)


class MemberOf(goblin.Edge):
    __label__ = "member_of"
    __valid_relations__ = frozenset([(Artist, Artist)])
    last_modified = goblin.Property(goblin.Float)


class Released(goblin.Edge):
    __label__ = "released"
    __valid_relations__ = frozenset([(Artist, Release), (Artist, Track)])
    last_modified = goblin.Property(goblin.Float)


class ReleasedOn(goblin.Edge):
    __label__ = "released_on"
    __valid_relations__ = frozenset([(Release, Company)])
    last_modified = goblin.Property(goblin.Float)


class SubsidiaryOf(goblin.Edge):
    __label__ = "subsidiary_of"
    __valid_relations__ = frozenset([(Company, Company)])
    last_modified = goblin.Property(goblin.Float)


class SubreleaseOf(goblin.Edge):
    __label__ = "subrelease_of"
    __valid_relations__ = frozenset([(Release, Master)])
    last_modified = goblin.Property(goblin.Float)


class Relationship(goblin.Edge):
    __label__ = "relationship"
    last_modified = goblin.Property(goblin.Float)
    primacy = goblin.Property(goblin.Integer)
    role = goblin.Property(goblin.String)
