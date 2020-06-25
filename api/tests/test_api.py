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
        entry["id"] = ...
    json["result"].sort(key=lambda x: (x["label"], x["eid"]))
    assert json == {
        "limit": 10,
        "query": "Mood Swing",
        "result": [
            {"eid": 8, "label": "artist", "name": "Mood II Swing", "id": ...,},
            {
                "eid": "3-3",
                "id": ...,
                "label": "track",
                "name": "When The Funk Hits The Fan (Mood II Swing When The Dub Hits The Fan)",
                "position": "3",
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
        entry["id"] = ...
    json["result"].sort(key=lambda x: x["eid"])
    assert json == {
        "limit": 10,
        "query": "Seasons",
        "result": [
            {"eid": 3, "label": "company", "name": "Seasons Recordings", "id": ...,},
            {"eid": 66542, "label": "company", "name": "Seasons Limited", "id": ...,},
            {
                "eid": 297127,
                "id": ...,
                "label": "company",
                "name": "Seasons Classics",
            },
        ],
    }


@pytest.mark.asyncio
async def test_vertex_by_goblin_id(api_client, testdata):
    response = await api_client.get("/vertex/release/1")
    json = await response.json()
    id = json["result"]["id"]
    response = await api_client.get(f"/vertex/{id}")
    assert await response.json() == {
        "result": {
            "country": "Sweden",
            "eid": 1,
            "formats": ["33 ⅓ RPM", '12"', "Vinyl"],
            "genres": ["Electronic"],
            "id": id,
            "is_main_release": True,
            "label": "release",
            "name": "Stockholm",
            "styles": ["Deep House"],
            "year": 1999,
        },
    }


@pytest.mark.asyncio
async def test_vertex_by_label(api_client, testdata):
    response = await api_client.get("/vertex/release/1")
    assert response.status == 200
    json = await response.json()
    json["result"]["id"] = ...
    assert json == {
        "result": {
            "country": "Sweden",
            "eid": 1,
            "formats": ["33 ⅓ RPM", '12"', "Vinyl"],
            "genres": ["Electronic"],
            "id": ...,
            "is_main_release": True,
            "label": "release",
            "name": "Stockholm",
            "styles": ["Deep House"],
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
