import asyncio

import pytest


@pytest.mark.asyncio
async def test_health(api_client):
    response = await api_client.get("/health")
    assert response.status == 200
    assert await response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_index(api_client):
    response = await api_client.get("/")
    assert response.status == 200
    assert await response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_random(api_client, testdata):
    results = []
    for _ in range(10):
        response = await api_client.get("/random")
        assert response.status == 200
        results.append(await response.json())
    assert len(set([result["result"]["label"] for result in results])) > 1
    assert len(set([result["result"]["eid"] for result in results])) > 1


@pytest.mark.asyncio
async def test_random_by_label(api_client, testdata):
    for label in ["artist", "company", "master", "release", "track"]:
        results = []
        for _ in range(10):
            response = await api_client.get(f"/random/{label}")
            assert response.status == 200
            results.append(await response.json())
        assert all(result["result"]["label"] == label for result in results)
        assert len(set([result["result"]["eid"] for result in results])) > 1


@pytest.mark.asyncio
async def test_search(api_client, testdata):
    await asyncio.sleep(0.5)  # Let elasticsearch catch up
    response = await api_client.get("/search?q=Mood+Swing&limit=10")
    assert response.status == 200
    json = await response.json()
    for entry in json["result"]:
        assert isinstance(entry["id"], int)
        assert isinstance(entry["last_modified"], float)
        entry["id"] = ...
        entry["last_modified"] = ...
    json["result"].sort(key=lambda x: (x["label"], x["eid"]))
    assert json == {
        "limit": 10,
        "query": "Mood Swing",
        "result": [
            {
                "child_count": 0,
                "eid": 8,
                "id": ...,
                "label": "artist",
                "last_modified": ...,
                "name": "Mood II Swing",
                "total_edge_count": 1,
            },
            {
                "child_count": 0,
                "eid": "3-3",
                "id": ...,
                "label": "track",
                "last_modified": ...,
                "name": "When The Funk Hits The Fan (Mood II Swing When The Dub Hits The Fan)",
                "position": "3",
                "total_edge_count": 3,
            },
            {
                'child_count': 0,
                 'eid': '60-6',
                 'id': Ellipsis,
                 'label': 'track',
                 'last_modified': Ellipsis,
                 'name': 'Mood Swing',
                 'position': '6',
                 'total_edge_count': 1,
            },
        ],
    }


@pytest.mark.asyncio
async def test_search_by_label(api_client, testdata):
    await asyncio.sleep(0.25)  # Let elasticsearch catch up
    response = await api_client.get("/search/company?q=Seasons&limit=10")
    assert response.status == 200
    json = await response.json()
    for entry in json["result"]:
        assert isinstance(entry["id"], int)
        assert isinstance(entry["last_modified"], float)
        entry["id"] = ...
        entry["last_modified"] = ...
    json["result"].sort(key=lambda x: x["eid"])
    assert json == {
        "limit": 10,
        "query": "Seasons",
        "result": [
            {
                "child_count": 0,
                "eid": 3,
                "id": ...,
                "label": "company",
                "last_modified": ...,
                "name": "Seasons Recordings",
                "total_edge_count": 4,
            },
        ],
    }


@pytest.mark.asyncio
async def test_vertex_by_goblin_id(api_client, testdata):
    response = await api_client.get("/vertex/release/1")
    json = await response.json()
    id = json["result"]["id"]
    last_modified = json["result"]["last_modified"]
    response = await api_client.get(f"/vertex/{id}")
    assert await response.json() == {
        "result": {
            "child_count": 0,
            "country": "Sweden",
            "eid": 1,
            "formats": ["33 ⅓ RPM", '12"', "Vinyl"],
            "genres": ["Electronic"],
            "id": id,
            "is_main_release": True,
            "label": "release",
            "last_modified": last_modified,
            "name": "Stockholm",
            "styles": ["Deep House"],
            "total_edge_count": 8,
            "year": 1999,
        },
    }


@pytest.mark.asyncio
async def test_vertex_by_label(api_client, testdata):
    response = await api_client.get("/vertex/release/1")
    assert response.status == 200
    json = await response.json()
    id = json["result"]["id"]
    last_modified = json["result"]["last_modified"]
    assert json == {
        "result": {
            "child_count": 0,
            "country": "Sweden",
            "eid": 1,
            "formats": ["33 ⅓ RPM", '12"', "Vinyl"],
            "genres": ["Electronic"],
            "id": id,
            "is_main_release": True,
            "label": "release",
            "last_modified": last_modified,
            "name": "Stockholm",
            "styles": ["Deep House"],
            "total_edge_count": 8,
            "year": 1999,
        },
    }


@pytest.mark.asyncio
async def test_locality_by_label(api_client, testdata):
    response = await api_client.get("/locality/release/1")
    assert response.status == 200
    json = await response.json()
    assert json


@pytest.mark.asyncio
async def test_path(api_client, testdata):
    response = await api_client.get("/path/artist/1/release/1")
    assert response.status == 200
    json = await response.json()
    assert json
