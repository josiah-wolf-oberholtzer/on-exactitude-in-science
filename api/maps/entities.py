import goblin


class VertexMixin:
    pass


class EdgeMixin:
    pass


class Artist(goblin.Vertex, VertexMixin):
    artist_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)


class Company(goblin.Vertex, VertexMixin):
    company_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)


class Master(goblin.Vertex, VertexMixin):
    master_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)


class Release(goblin.Vertex, VertexMixin):
    country = goblin.Property(goblin.String)
    genre = goblin.Property(goblin.String)
    name = goblin.Property(goblin.String)
    is_main = goblin.Property(goblin.Boolean)
    release_id = goblin.Property(goblin.Integer)
    style = goblin.Property(goblin.String)
    year = goblin.Property(goblin.Integer)


class Track(goblin.Vertex, VertexMixin):
    name = goblin.Property(goblin.String)
    position = goblin.Property(goblin.String)
    track_id = goblin.Property(goblin.String)


class AliasOf(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset([(Artist, Artist)])


class CreditedWith(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset(
        [(Artist, Release), (Artist, Track), (Company, Release)]
    )
    role = goblin.Property(goblin.String)


class Includes(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset([(Release, Track)])


class MemberOf(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset([(Artist, Artist)])


class Released(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset([(Release, Company)])


class SubsidiaryOf(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset([(Company, Company)])


class SubreleaseOf(goblin.Edge, EdgeMixin):
    __valid_relations__ = frozenset([(Release, Master)])
