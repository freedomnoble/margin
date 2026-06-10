"""Backend tests for Margin (unit economics) app.

Covers:
- Auth: register / login / me / refresh / logout / brute force lockout
- Businesses CRUD + ownership enforcement
- Simulations CRUD
- Partial business updates (icp / value_prop / money_model / journey)
"""

import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://simple-money-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@margin.app"
ADMIN_PASSWORD = "Admin123!"


# ---------- fixtures ----------

@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def admin_session(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return session


@pytest.fixture
def fresh_user_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    email = f"test_{uuid.uuid4().hex[:10]}@margintest.io"
    r = s.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "Passw0rd!"})
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    s.test_email = email  # type: ignore
    return s


# ---------- auth ----------

class TestAuth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert "Margin" in r.json().get("message", "")

    def test_admin_login_sets_cookies_and_me(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "id" in data
        # cookies
        assert "access_token" in session.cookies
        assert "refresh_token" in session.cookies
        # me
        me = session.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == ADMIN_EMAIL

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "WRONG_pw_123!"})
        assert r.status_code == 401
        assert "Wrong email or password" in r.json().get("detail", "")

    def test_register_then_me(self, fresh_user_session):
        me = fresh_user_session.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == fresh_user_session.test_email

    def test_register_duplicate_email(self, fresh_user_session):
        r = fresh_user_session.post(f"{API}/auth/register",
                                    json={"name": "X", "email": fresh_user_session.test_email, "password": "Passw0rd!"})
        assert r.status_code == 400

    def test_refresh_issues_new_access_token(self, admin_session):
        old = admin_session.cookies.get("access_token")
        # ensure new token differs (jwt exp second precision)
        time.sleep(1.1)
        r = admin_session.post(f"{API}/auth/refresh")
        assert r.status_code == 200, r.text
        new = admin_session.cookies.get("access_token")
        assert new and new != old
        # me still works
        assert admin_session.get(f"{API}/auth/me").status_code == 200

    def test_logout_clears_cookies(self, admin_session):
        r = admin_session.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # cookies should be cleared
        me = admin_session.get(f"{API}/auth/me")
        assert me.status_code == 401

    def test_brute_force_lockout(self, session):
        # use a unique fake email so admin account is not affected
        fake_email = f"lockout_{uuid.uuid4().hex[:8]}@margintest.io"
        for i in range(5):
            r = session.post(f"{API}/auth/login", json={"email": fake_email, "password": "bad"})
            # first 5 attempts: 401 (user not found = wrong creds)
            assert r.status_code == 401, f"attempt {i + 1}: {r.status_code}"
        # 6th attempt should be locked out
        r = session.post(f"{API}/auth/login", json={"email": fake_email, "password": "bad"})
        assert r.status_code == 429
        assert "Too many" in r.json().get("detail", "")


# ---------- businesses ----------

class TestBusinesses:
    def test_list_create_get_update_delete(self, fresh_user_session):
        s = fresh_user_session
        # initially empty
        r = s.get(f"{API}/businesses")
        assert r.status_code == 200 and r.json() == []

        # create
        r = s.post(f"{API}/businesses", json={"name": "TEST Biz One"})
        assert r.status_code == 200, r.text
        biz = r.json()
        assert biz["name"] == "TEST Biz One"
        assert biz["icp"]["who"] == ""
        assert biz["money_model"]["x_customers"] == 100
        bid = biz["id"]

        # list
        r = s.get(f"{API}/businesses")
        assert r.status_code == 200
        assert any(b["id"] == bid for b in r.json())

        # get
        r = s.get(f"{API}/businesses/{bid}")
        assert r.status_code == 200 and r.json()["id"] == bid

        # partial update -- icp + value_prop
        patch = {
            "icp": {"who": "SMB owners", "want": "more sales", "blocker": "no time", "words": "growth"},
            "value_prop": "Make money predictably",
        }
        r = s.put(f"{API}/businesses/{bid}", json=patch)
        assert r.status_code == 200
        out = r.json()
        assert out["icp"]["who"] == "SMB owners"
        assert out["value_prop"] == "Make money predictably"

        # money_model + journey update
        mm = {
            "steps": [{"id": "s1", "modelKey": "lead-magnet", "offerName": "Free guide",
                       "price": 500, "cost": 100, "takeRate": 50, "whenDays": 0, "recurring": False}],
            "x_customers": 250,
        }
        journey = {"stages": [{"id": "st1", "name": "Awareness", "description": "find us",
                               "pains": [{"id": "p1", "text": "don't know us"}]}]}
        r = s.put(f"{API}/businesses/{bid}", json={"money_model": mm, "journey": journey})
        assert r.status_code == 200
        out = r.json()
        assert out["money_model"]["x_customers"] == 250
        assert len(out["money_model"]["steps"]) == 1
        assert out["journey"]["stages"][0]["name"] == "Awareness"
        # ensure prior fields preserved
        assert out["value_prop"] == "Make money predictably"

        # delete
        r = s.delete(f"{API}/businesses/{bid}")
        assert r.status_code == 200
        r = s.get(f"{API}/businesses/{bid}")
        assert r.status_code == 404

    def test_ownership_isolation(self):
        # user A creates a business; user B cannot access it (404)
        sa = requests.Session(); sa.headers["Content-Type"] = "application/json"
        sb = requests.Session(); sb.headers["Content-Type"] = "application/json"
        ea = f"test_{uuid.uuid4().hex[:8]}@margintest.io"
        eb = f"test_{uuid.uuid4().hex[:8]}@margintest.io"
        assert sa.post(f"{API}/auth/register", json={"name": "A", "email": ea, "password": "Passw0rd!"}).status_code == 200
        assert sb.post(f"{API}/auth/register", json={"name": "B", "email": eb, "password": "Passw0rd!"}).status_code == 200
        r = sa.post(f"{API}/businesses", json={"name": "TEST A only"})
        bid = r.json()["id"]
        # user B should get 404
        r = sb.get(f"{API}/businesses/{bid}")
        assert r.status_code == 404
        r = sb.put(f"{API}/businesses/{bid}", json={"name": "hack"})
        assert r.status_code == 404
        r = sb.delete(f"{API}/businesses/{bid}")
        assert r.status_code == 404
        # cleanup
        sa.delete(f"{API}/businesses/{bid}")

    def test_unauthenticated_blocked(self, session):
        # no cookies/headers
        assert session.get(f"{API}/businesses").status_code == 401
        assert session.post(f"{API}/businesses", json={"name": "x"}).status_code == 401


# ---------- simulations ----------

class TestSimulations:
    def test_simulation_crud(self, fresh_user_session):
        s = fresh_user_session
        biz = s.post(f"{API}/businesses", json={"name": "TEST SimBiz"}).json()
        bid = biz["id"]

        # list empty
        r = s.get(f"{API}/businesses/{bid}/simulations")
        assert r.status_code == 200 and r.json() == []

        # create
        offers = [{"id": "o1", "kind": "core", "name": "Plan A", "unit": "month",
                   "price": 100, "cost": 40, "unitsPerMonth": 20}]
        r = s.post(f"{API}/businesses/{bid}/simulations", json={"name": "TEST baseline", "offers": offers})
        assert r.status_code == 200, r.text
        sim = r.json()
        sid = sim["id"]
        assert sim["name"] == "TEST baseline"
        assert sim["offers"][0]["price"] == 100

        # list contains
        r = s.get(f"{API}/businesses/{bid}/simulations")
        assert r.status_code == 200
        assert any(x["id"] == sid for x in r.json())

        # update
        r = s.put(f"{API}/simulations/{sid}", json={"name": "TEST baseline v2"})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST baseline v2"

        # delete
        r = s.delete(f"{API}/simulations/{sid}")
        assert r.status_code == 200
        # subsequent delete returns 404
        r = s.delete(f"{API}/simulations/{sid}")
        assert r.status_code == 404

        # cleanup
        s.delete(f"{API}/businesses/{bid}")

    def test_simulation_other_business_forbidden(self):
        # user A creates biz+sim; user B cannot update/delete sim
        sa = requests.Session(); sa.headers["Content-Type"] = "application/json"
        sb = requests.Session(); sb.headers["Content-Type"] = "application/json"
        ea = f"test_{uuid.uuid4().hex[:8]}@margintest.io"
        eb = f"test_{uuid.uuid4().hex[:8]}@margintest.io"
        sa.post(f"{API}/auth/register", json={"name": "A", "email": ea, "password": "Passw0rd!"})
        sb.post(f"{API}/auth/register", json={"name": "B", "email": eb, "password": "Passw0rd!"})
        biz = sa.post(f"{API}/businesses", json={"name": "TEST iso"}).json()
        sim = sa.post(f"{API}/businesses/{biz['id']}/simulations",
                      json={"name": "TEST x", "offers": []}).json()
        # B cannot list sims for A's business
        assert sb.get(f"{API}/businesses/{biz['id']}/simulations").status_code == 404
        assert sb.put(f"{API}/simulations/{sim['id']}", json={"name": "hax"}).status_code == 404
        assert sb.delete(f"{API}/simulations/{sim['id']}").status_code == 404
        sa.delete(f"{API}/businesses/{biz['id']}")
