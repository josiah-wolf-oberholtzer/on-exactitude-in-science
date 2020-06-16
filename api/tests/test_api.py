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
    await asyncio.sleep(0.25)  # Let elasticsearch catch up
    response = await api_client.get("/search?q=Mood+Swing&limit=10")
    assert response.status == 200
    json = await response.json()
    for entry in json["result"]:
        entry["vid"] = ...
    json["result"].sort(key=lambda x: (x["label"], x["eid"]))
    assert json == {
        "limit": 10,
        "query": "Mood Swing",
        "result": [
            {
                "eid": 8,
                "label": "artist",
                "values": {"name": "Mood II Swing"},
                "vid": ...,
            },
            {
                "eid": "3-3",
                "label": "track",
                "values": {
                    "name": "When The Funk Hits The Fan (Mood II Swing "
                    "When The Dub Hits The Fan)",
                    "position": "3",
                },
                "vid": ...,
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
        entry["vid"] = ...
    json["result"].sort(key=lambda x: x["eid"])
    assert json == {
        "limit": 10,
        "query": "Seasons",
        "result": [
            {
                "eid": 3,
                "label": "company",
                "values": {"name": "Seasons Recordings"},
                "vid": ...,
            },
            {
                "eid": 66542,
                "label": "company",
                "values": {"name": "Seasons Limited"},
                "vid": ...,
            },
            {
                "eid": 297127,
                "label": "company",
                "values": {"name": "Seasons Classics"},
                "vid": ...,
            },
        ],
        "vertex_label": "company",
    }


@pytest.mark.asyncio
async def test_vertex_by_goblin_id(api_client, testdata):
    response = await api_client.get("/vertex/release/1")
    json = await response.json()
    vid = json["result"]["vid"]
    response = await api_client.get(f"/vertex/{vid}")
    assert await response.json() == {
        "result": {
            "eid": 1,
            "label": "release",
            "values": {
                "country": "Sweden",
                "formats": ["33 ⅓ RPM", '12"', "Vinyl"],
                "genres": ["Electronic"],
                "is_main_release": True,
                "name": "Stockholm",
                "styles": ["Deep House"],
                "year": 1999,
            },
            "vid": vid,
        },
    }


@pytest.mark.asyncio
async def test_vertex_by_label(api_client, testdata):
    response = await api_client.get("/vertex/release/1")
    assert response.status == 200
    json = await response.json()
    json["result"]["vid"] = ...
    assert json == {
        "result": {
            "eid": 1,
            "label": "release",
            "values": {
                "country": "Sweden",
                "formats": ["33 ⅓ RPM", '12"', "Vinyl"],
                "genres": ["Electronic"],
                "is_main_release": True,
                "name": "Stockholm",
                "styles": ["Deep House"],
                "year": 1999,
            },
            "vid": ...,
        },
        "vertex_label": "release",
    }
