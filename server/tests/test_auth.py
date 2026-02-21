def signup(client, username="Lani", email="lani@example.com", password="password1"):
    return client.post("/api/signup", json={"username": username, "email": email, "password": password})

def login(client, email="lani@example.com", password="password1"):
    return client.post("/api/login", json={"email": email, "password": password})

def logout(client):
    return client.delete("/api/logout")

def test_signup_login_logout_flow(client):
    r = client.get("/api/me")
    assert r.status_code == 401

    r = signup(client)
    assert r.status_code == 201
    data = r.get_json()
    assert data["email"] == "lani@example.com"

    r = client.get("/api/me")
    assert r.status_code == 200

    r = logout(client)
    assert r.status_code == 204

    r = client.get("/api/me")
    assert r.status_code == 401

    r = login(client)
    assert r.status_code == 200
