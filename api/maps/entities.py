from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Role:
    name: str
    detail: Optional[str] = field(default=None)


@dataclass(unsafe_hash=True)
class Artist:
    id: int
    name: str
    aliases: List["Artist"] = field(default_factory=list, compare=False, hash=False)
    groups: List["Artist"] = field(default_factory=list, compare=False, hash=False)
    members: List["Artist"] = field(default_factory=list, compare=False, hash=False)
    roles: List[Role] = field(default_factory=list, compare=False, hash=False)


@dataclass(unsafe_hash=True)
class Label:
    id: int
    name: str
    parent_label: Optional["Label"] = field(default=None, compare=False, hash=False)
    roles: List[Role] = field(default_factory=list, compare=False, hash=False)
    sublabels: List["Label"] = field(default_factory=list, compare=False, hash=False)


@dataclass
class Master:
    id: int
    main_release_id: int
    name: str


@dataclass
class Track:
    id: str
    name: str
    position: str
    artists: List[Artist] = field(default_factory=list)
    extra_artists: List[Artist] = field(default_factory=list)


@dataclass
class Release:
    id: int
    name: str
    artists: List[Artist] = field(default_factory=list)
    companies: List[Label] = field(default_factory=list)
    country: Optional[str] = field(default=None)
    extra_artists: List[Artist] = field(default_factory=list)
    formats: List[str] = field(default_factory=list)
    genres: List[str] = field(default_factory=list)
    is_main_release: bool = field(default=False)
    labels: List[Label] = field(default_factory=list)
    master_id: Optional[int] = field(default=None)
    styles: List[str] = field(default_factory=list)
    tracks: List[Track] = field(default_factory=list)
    year: Optional[int] = field(default=None)
