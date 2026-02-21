def signup(client, username="Lani", email="lani@example.com", password="password1"):
    return client.post("/api/signup", json={"username": username, "email": email, "password": password})

def test_sets_and_items_flow(client):
    signup(client)
    t1 = client.post("/api/tracks", json={"title": "Warmup Song", "artist": "A", "energy": "warmup"}).get_json()
    t2 = client.post("/api/tracks", json={"title": "Peak Song", "artist": "B", "energy": "peak"}).get_json()

    s = client.post("/api/sets", json={"name": "Friday Set"}).get_json()
    set_id = s["id"]

    i1 = client.post(f"/api/sets/{set_id}/items", json={"track_id": t1["id"]}).get_json()
    i2 = client.post(f"/api/sets/{set_id}/items", json={"track_id": t2["id"]}).get_json()

    r = client.get(f"/api/sets/{set_id}")
    assert r.status_code == 200
    sd = r.get_json()
    assert len(sd["items"]) == 2
    assert sd["items"][0]["position"] == 0
    assert sd["items"][1]["position"] == 1

    r = client.put(f"/api/sets/{set_id}/items/reorder", json={"order": [i2["id"], i1["id"]]})
    assert r.status_code == 200
    items = r.get_json()["items"]
    assert items[0]["id"] == i2["id"]
    assert items[0]["position"] == 0
