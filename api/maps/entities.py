import goblin
from gremlin_python.process.traversal import Cardinality


class Vertex(goblin.Vertex):
    random = goblin.Property(goblin.Float)


class Edge(goblin.Edge):
    pass


class Artist(Vertex):
    __label__ = "artist"
    artist_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)


class Company(Vertex):
    __label__ = "company"
    company_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)


class Master(Vertex):
    __label__ = "master"
    master_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)


class Release(Vertex):
    __label__ = "release"
    country = goblin.Property(goblin.String)
    formats = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    genres = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    is_main_release = goblin.Property(goblin.Boolean)
    name = goblin.Property(goblin.String)
    release_id = goblin.Property(goblin.Integer)
    style = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    year = goblin.Property(goblin.Integer)


class Track(Vertex):
    __label__ = "track"
    name = goblin.Property(goblin.String)
    position = goblin.Property(goblin.String)
    track_id = goblin.Property(goblin.String)


class AliasOf(Edge):
    __label__ = "alias_of"
    __valid_relations__ = frozenset([(Artist, Artist)])


class CreditedWith(Edge):
    __label__ = "credited_with"
    __valid_relations__ = frozenset(
        [(Artist, Release), (Artist, Track), (Company, Release)]
    )
    role = goblin.Property(goblin.String)


class Includes(Edge):
    __label__ = "includes"
    __valid_relations__ = frozenset([(Release, Track)])


class MemberOf(Edge):
    __label__ = "member_of"
    __valid_relations__ = frozenset([(Artist, Artist)])


class Released(Edge):
    __label__ = "released"
    __valid_relations__ = frozenset([(Artist, Release), (Artist, Track)])


class ReleasedOn(Edge):
    __label__ = "released_on"
    __valid_relations__ = frozenset([(Release, Company)])


class SubsidiaryOf(Edge):
    __label__ = "subsidiary_of"
    __valid_relations__ = frozenset([(Company, Company)])


class SubreleaseOf(Edge):
    __label__ = "subrelease_of"
    __valid_relations__ = frozenset([(Release, Master)])