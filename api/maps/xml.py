import datetime
import gzip
import re
import traceback
from dataclasses import dataclass, field
from pathlib import Path
from typing import IO, Any, Generator, List, Optional, Set, cast
from xml.dom import minidom
from xml.etree import cElementTree as ElementTree

date_regex = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
date_no_dashes_regex = re.compile(r"^(\d{4})(\d{2})(\d{2})$")
year_regex = re.compile(r"^\d\d\d\d$")


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
class Company:
    id: int
    name: str
    parent_company: Optional["Company"] = field(default=None, compare=False, hash=False)
    roles: List[Role] = field(default_factory=list, compare=False, hash=False)
    subsidiaries: List["Company"] = field(
        default_factory=list, compare=False, hash=False
    )


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
    companies: List[Company] = field(default_factory=list)
    country: Optional[str] = field(default=None)
    extra_artists: List[Artist] = field(default_factory=list)
    formats: List[str] = field(default_factory=list)
    genres: List[str] = field(default_factory=list)
    is_main_release: bool = field(default=False)
    labels: List[Company] = field(default_factory=list)
    master_id: Optional[int] = field(default=None)
    styles: List[str] = field(default_factory=list)
    tracks: List[Track] = field(default_factory=list)
    year: Optional[int] = field(default=None)


def get_xml_path(directory_path: Path, tag: str):
    glob_string = "discogs_*_{}s.xml.gz".format(tag)
    file_paths = list(directory_path.glob(glob_string))
    if not file_paths:
        raise FileNotFoundError
    file_paths.sort(reverse=True)  # Sorting by timestamp descending
    return file_paths[0]


def iterate_xml(xml_path: Path, tag: str):
    with gzip.GzipFile(xml_path, "r") as gzip_file:
        context = ElementTree.iterparse(
            cast(IO[Any], gzip_file), events=["start", "end"]
        )
        context = iter(context)
        _, root = next(context)
        depth = 0
        for event, element in context:
            if element.tag != tag:
                continue
            if event == "start":
                depth += 1
            else:
                depth -= 1
                if depth == 0:
                    yield element
                    root.clear()


def prettify(element):
    string = ElementTree.tostring(element, "utf-8")
    reparsed = minidom.parseString(string)
    return reparsed.toprettyxml(indent=" " * 4)


def build_test_files(source_path: Path, target_path: Path, n=10):
    for tag in ["artist", "label", "master", "release"]:
        source_file_path = get_xml_path(source_path, tag)
        target_file_path = target_path / "discogs_test_{}s.xml.gz".format(tag)
        iterator = iterate_xml(source_file_path, tag)
        with gzip.GzipFile(target_file_path, "w") as gzip_file:
            gzip_file.write(b'<?xml version="1.0" ?>\n')
            gzip_file.write("<{}s>\n".format(tag).encode())
            for _ in range(n):
                element = next(iterator)
                for line in prettify(element).splitlines()[1:]:  # strip <?xml>
                    gzip_file.write((line + "\n").encode())
            gzip_file.write("</{}s>\n".format(tag).encode())


def get_artist_iterator(xml_path: Path) -> Generator[Artist, None, None]:
    for element in iterate_xml(xml_path, "artist"):
        artist = Artist(id=int(element.find("id").text), name=element.find("name").text)
        for subelement in element.find("aliases") or []:
            alias = Artist(id=int(subelement.get("id")), name=subelement.text)
            artist.aliases.append(alias)
        for subelement in element.find("groups") or []:
            group = Artist(id=int(subelement.get("id")), name=subelement.text)
            artist.groups.append(group)
        for subelement in element.find("members") or []:
            if subelement.tag == "id":
                continue
            member = Artist(id=int(subelement.get("id")), name=subelement.text)
            artist.members.append(member)
        artist.aliases.sort(key=lambda x: x.id)
        artist.groups.sort(key=lambda x: x.id)
        artist.members.sort(key=lambda x: x.id)
        yield artist


def get_company_iterator(xml_path: Path) -> Generator[Company, None, None]:
    for element in iterate_xml(xml_path, "label"):
        company = Company(
            id=int(element.find("id").text), name=element.find("name").text
        )
        if (parent_company := element.find("parentLabel")) is not None:
            company.parent_company = Company(
                id=int(parent_company.get("id")), name=parent_company.text
            )
        for subelement in element.find("sublabels") or []:
            subsidiary = Company(id=int(subelement.get("id")), name=subelement.text)
            company.subsidiaries.append(subsidiary)
        company.subsidiaries.sort(key=lambda x: x.id)
        yield company


def get_master_iterator(xml_path: Path) -> Generator[Master, None, None]:
    for element in iterate_xml(xml_path, "master"):
        master = Master(
            id=int(element.get("id")),
            name=element.find("title").text,
            main_release_id=int(element.find("main_release").text),
        )
        yield master


def get_release_iterator(xml_path: Path):
    def get_artists(element) -> List[Artist]:
        artists: Set[Artist] = set()
        for artist in element.find("artists") or []:
            artists.add(
                Artist(id=int(artist.find("id").text), name=artist.find("name").text)
            )
        return sorted(artists, key=lambda x: x.id)

    def get_companies(element) -> List[Company]:
        companies: List[Company] = []
        for company in element.find("companies") or []:
            companies.append(
                Company(
                    id=int(company.find("id").text),
                    name=company.find("name").text,
                    roles=parse_roles(company.find("entity_type_name").text),
                )
            )
        return sorted(companies, key=lambda x: x.id)

    def get_country(element) -> Optional[str]:
        if (country := element.find("country")) is not None:
            return country.text
        return None

    def get_extra_artists(element) -> List[Artist]:
        extra_artists: List[Artist] = []
        for extra_artist in element.find("extraartists") or []:
            extra_artists.append(
                Artist(
                    id=int(extra_artist.find("id").text),
                    name=extra_artist.find("name").text,
                    roles=parse_roles(extra_artist.find("role").text),
                )
            )
        return sorted(extra_artists, key=lambda x: x.id)

    def get_formats(element) -> List[str]:
        formats: Set[str] = set()
        for format_ in element.find("formats") or []:
            formats.add(format_.get("name"))
            for description in format_.find("descriptions") or []:
                formats.add(description.text)
        return sorted(formats)

    def get_genres(element) -> List[str]:
        result = []
        for genre in element.find("genres") or []:
            result.append(genre.text)
        return sorted(set(result))

    def get_labels(element) -> List[Company]:
        labels: Set[Company] = set()
        for label in element.find("labels") or []:
            label = Company(id=int(label.get("id")), name=label.get("name"))
            labels.add(label)
        return sorted(labels, key=lambda x: x.id)

    def get_master_id(element) -> Optional[int]:
        if (master_id := element.find("master_id")) is not None:
            return int(master_id.text)
        return None

    def get_is_main_release(element) -> Optional[bool]:
        if (master_id := element.find("master_id")) is not None:
            return master_id.get("is_main_release") == "true"
        return None

    def get_styles(element) -> List[str]:
        result = []
        for style in element.find("styles") or []:
            result.append(style.text)
        return sorted(set(result))

    def get_tracks(element, release_id) -> List[Track]:
        tracks: List[Track] = []
        for i, track in enumerate(element.find("tracklist") or [], 1):
            position = (track.find("position").text or "").strip() or str(i)
            tracks.append(
                Track(
                    id="{}-{}".format(release_id, position),
                    name=track.find("title").text,
                    position=position,
                    artists=get_artists(track),
                    extra_artists=get_extra_artists(track),
                )
            )
        return tracks

    def get_year(element) -> Optional[int]:
        element = element.find("released")
        if element is not None:
            date = parse_release_date(element.text)
            if date:
                return date.year
        return None

    for element in iterate_xml(xml_path, "release"):
        release = Release(
            artists=get_artists(element),
            companies=get_companies(element),
            country=get_country(element),
            extra_artists=get_extra_artists(element),
            formats=get_formats(element),
            genres=get_genres(element),
            id=int(element.get("id")),
            is_main_release=bool(get_is_main_release(element)),
            labels=get_labels(element),
            master_id=get_master_id(element),
            name=element.find("title").text,
            styles=get_styles(element),
            tracks=get_tracks(element, int(element.get("id"))),
            year=get_year(element),
        )
        yield release


def parse_roles(text):
    def from_text(text):
        name = ""
        current_buffer = ""
        details = []
        had_detail = False
        bracket_depth = 0
        for character in text:
            if character == "[":
                bracket_depth += 1
                if bracket_depth == 1 and not had_detail:
                    name = current_buffer
                    current_buffer = ""
                    had_detail = True
                elif 1 < bracket_depth:
                    current_buffer += character
            elif character == "]":
                bracket_depth -= 1
                if not bracket_depth:
                    details.append(current_buffer)
                    current_buffer = ""
                else:
                    current_buffer += character
            else:
                current_buffer += character
        if current_buffer and not had_detail:
            name = current_buffer
        name = name.strip()
        detail = ", ".join(_.strip() for _ in details)
        return Role(name=name, detail=detail or None)

    roles = []
    if not text:
        return roles
    current_text = ""
    bracket_depth = 0
    for character in text:
        if character == "[":
            bracket_depth += 1
        elif character == "]":
            bracket_depth -= 1
        elif not bracket_depth and character == ",":
            current_text = current_text.strip()
            if current_text:
                roles.append(from_text(current_text))
            current_text = ""
            continue
        current_text += character
    current_text = current_text.strip()
    if current_text:
        roles.append(from_text(current_text))
    return roles


def parse_release_date(date_string):
    # empty string
    if not date_string:
        return None
    # yyyy-mm-dd
    match = date_regex.match(date_string)
    if match:
        year, month, day = match.groups()
        return validate_release_date(year, month, day)
    # yyyymmdd
    match = date_no_dashes_regex.match(date_string)
    if match:
        year, month, day = match.groups()
        return validate_release_date(year, month, day)
    # yyyy
    match = year_regex.match(date_string)
    if match:
        year, month, day = match.group(), "1", "1"
        return validate_release_date(year, month, day)
    # other: "?", "????", "None", "Unknown"
    return None


def validate_release_date(year, month, day):
    try:
        year = int(year)
        if month.isdigit():
            month = int(month)
        if month < 1:
            month = 1
        if day.isdigit():
            day = int(day)
        if day < 1:
            day = 1
        if 12 < month:
            day, month = month, day
        date = datetime.datetime(year, month, 1, 0, 0)
        day_offset = day - 1
        date = date + datetime.timedelta(days=day_offset)
    except ValueError:
        traceback.print_exc()
        print("BAD DATE:", year, month, day)
        date = None
    return date
