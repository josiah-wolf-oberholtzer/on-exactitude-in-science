from pathlib import Path

from maps import xml


def test_get_artist_iterator():
    path = Path(__file__).parent / "discogs_test_artists.xml.gz"
    iterator = xml.get_artist_iterator(path)
    artist = next(iterator)
    assert artist == xml.Artist(
        id=1,
        name="The Persuader",
        aliases=[
            xml.Artist(
                id=239, name="Jesper Dahlbäck", aliases=[], groups=[], members=[]
            ),
        ],
    )


def test_get_label_iterator():
    path = Path(__file__).parent / "discogs_test_labels.xml.gz"
    iterator = xml.get_label_iterator(path)
    label = next(iterator)
    assert label == xml.Label(
        id=1,
        name="Planet E",
        parent_label=None,
        sublabels=[
            xml.Label(id=31405, name="I Ner Zon Sounds"),
            xml.Label(id=1560615, name="Planet E Productions"),
        ],
    )


def test_get_master_iterator():
    path = Path(__file__).parent / "discogs_test_masters.xml.gz"
    iterator = xml.get_master_iterator(path)
    master = next(iterator)
    assert master == xml.Master(id=18500, main_release_id=155102, name="New Soil")


def test_get_release_iterator():
    path = Path(__file__).parent / "discogs_test_releases.xml.gz"
    iterator = xml.get_release_iterator(path)
    release = next(iterator)
    assert release == xml.Release(
        id=1,
        name="Stockholm",
        artists=[xml.Artist(id=1, name="The Persuader")],
        companies=[
            xml.Label(id=56025, name="MPO", roles=[xml.Role(name="Pressed By")]),
            xml.Label(
                id=271046,
                name="The Globe Studios",
                roles=[xml.Role(name="Recorded At")],
            ),
        ],
        country="Sweden",
        extra_artists=[
            xml.Artist(
                id=239,
                name="Jesper Dahlbäck",
                roles=[{"name": "Music By", "detail": "All Tracks By"}],
            ),
        ],
        formats=['12"', "33 ⅓ RPM", "Vinyl"],
        genres=["Electronic"],
        is_main_release=True,
        labels=[xml.Label(id=5, name="Svek")],
        master_id=1660109,
        styles=["Deep House"],
        tracks=[
            xml.Track(id="1-A", name="Östermalm", position="A"),
            xml.Track(id="1-B1", name="Vasastaden", position="B1"),
            xml.Track(id="1-B2", name="Kungsholmen", position="B2"),
            xml.Track(id="1-C1", name="Södermalm", position="C1"),
            xml.Track(id="1-C2", name="Norrmalm", position="C2"),
            xml.Track(id="1-D", name="Gamla Stan", position="D"),
        ],
        year=1999,
    )
