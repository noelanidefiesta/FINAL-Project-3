def signup(client, username="Lani", email="lani@example.com", password="password1"):
    return client.post("/api/signup", json={"username": username, "email": email, "password": password})

def test_tracks_pagination_and_search(client):
    signup(client)
    for i in range(35):
        client.post("/api/tracks", json={"title": f"Song {i}", "artist": "Noelani", "energy": "warmup" if i % 2 == 0 else "peak"})
    r = client.get("/api/tracks?page=1&per_page=20")
    assert r.status_code == 200
    data = r.get_json()
    assert data["page"] == 1
    assert data["per_page"] == 20
    assert data["total"] == 35
    assert len(data["tracks"]) == 20

    r = client.get("/api/tracks?page=2&per_page=20")
    data2 = r.get_json()
    assert len(data2["tracks"]) == 15

    r = client.get("/api/tracks?q=peak&per_page=100")
    d = r.get_json()
    assert d["total"] in (17, 18)

def test_tracks_crud_and_validation(client):
    signup(client)

    r = client.post("/api/tracks", json={"title": "", "artist": "A"})
    assert r.status_code == 400

    r = client.post("/api/tracks", json={"title": "Song", "artist": ""})
    assert r.status_code == 400

    r = client.post("/api/tracks", json={"title": "Song", "artist": "A", "bpm": "fast"})
    assert r.status_code == 400

    r = client.post("/api/tracks", json={"title": "Song", "artist": "A", "bpm": 128, "musical_key": "8A", "notes": "works great late"})
    assert r.status_code == 201
    t = r.get_json()
    track_id = t["id"]
    assert t["bpm"] == 128
    assert t["musical_key"] == "8A"
    assert t["notes"] == "works great late"

    r = client.get(f"/api/tracks/{track_id}")
    assert r.status_code == 200

    r = client.patch(f"/api/tracks/{track_id}", json={"bpm": "not"})
    assert r.status_code == 400

    r = client.patch(f"/api/tracks/{track_id}", json={"bpm": 130, "energy": "peak"})
    assert r.status_code == 200
    assert r.get_json()["bpm"] == 130
    assert r.get_json()["energy"] == "peak"

    r = client.delete(f"/api/tracks/{track_id}")
    assert r.status_code == 204

    r = client.get(f"/api/tracks/{track_id}")
    assert r.status_code == 404

def test_track_usage_endpoint(client):
    signup(client)

    t = client.post("/api/tracks", json={"title": "Track", "artist": "A"}).get_json()
    g = client.post("/api/gigs", json={"title": "Gig", "gig_date": "2026-02-20", "notes": "worked well"}).get_json()
    s = client.post("/api/sets", json={"name": "Set", "gig_id": g["id"]}).get_json()
    client.post(f"/api/sets/{s['id']}/items", json={"track_id": t["id"]})

    r = client.get(f"/api/tracks/{t['id']}/usage")
    assert r.status_code == 200
    d = r.get_json()
    assert d["track"]["id"] == t["id"]
    assert len(d["usage"]) == 1
    assert d["usage"][0]["gig"]["id"] == g["id"]
    assert d["last_played"] == "2026-02-20"
