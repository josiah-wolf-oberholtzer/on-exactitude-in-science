import enum

import goblin
from gremlin_python.process.traversal import Cardinality


class Artist(goblin.Vertex):
    __label__ = "artist"
    artist_id = goblin.Property(goblin.Integer)
    last_modified = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)


class Company(goblin.Vertex):
    __label__ = "company"
    company_id = goblin.Property(goblin.Integer)
    last_modified = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)


class Master(goblin.Vertex):
    __label__ = "master"
    last_modified = goblin.Property(goblin.Integer)
    master_id = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    random = goblin.Property(goblin.Float)


class Release(goblin.Vertex):
    __label__ = "release"
    country = goblin.Property(goblin.String)
    formats = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    genres = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    last_modified = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    primacy = goblin.Property(goblin.Integer)
    random = goblin.Property(goblin.Float)
    release_id = goblin.Property(goblin.Integer)
    styles = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    videos = goblin.Property(goblin.String)
    year = goblin.Property(goblin.Integer)


class Track(goblin.Vertex):
    __label__ = "track"
    country = goblin.Property(goblin.String)
    formats = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    genres = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    last_modified = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    position = goblin.Property(goblin.String)
    primacy = goblin.Property(goblin.Integer)
    random = goblin.Property(goblin.Float)
    styles = goblin.VertexProperty(goblin.String, card=Cardinality.set_)
    track_id = goblin.Property(goblin.String)
    year = goblin.Property(goblin.Integer)


class VertexLabelEnum(enum.IntEnum):
    ARTIST = 1
    COMPANY = 2
    MASTER = 3
    RELEASE = 4
    TRACK = 5


class Relationship(goblin.Edge):
    __label__ = "relationship"
    country = goblin.Property(goblin.String)
    last_modified = goblin.Property(goblin.Integer)
    name = goblin.Property(goblin.String)
    primacy = goblin.Property(goblin.Integer)
    source_label = goblin.Property(goblin.Integer)
    target_label = goblin.Property(goblin.Integer)
    year = goblin.Property(goblin.Integer)
