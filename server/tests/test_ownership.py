def signup(client, username, email, password):
    return client.post("/api/signup", json={"username": username, "email": email, "password": password})

def logout(client):
    return client.delete("/api/logout")

def test_user_cannot_access_other_users_data(client):
    r = signup(client, username="User1", email="u1@example.com", password="password1")
    assert r.status_code == 201
    r = client.post("/api/gigs", json={"title": "Gig One"})
    assert r.status_code == 201
    gig_id = r.get_json()["id"]

    logout(client)

    r = signup(client, username="User2", email="u2@example.com", password="password2")
    assert r.status_code == 201

    r = client.get(f"/api/gigs/{gig_id}")
    assert r.status_code == 404

    r = client.patch(f"/api/gigs/{gig_id}", json={"title": "Hacked"})
    assert r.status_code == 404

    r = client.delete(f"/api/gigs/{gig_id}")
    assert r.status_code == 404
