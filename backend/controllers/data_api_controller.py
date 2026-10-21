import os
from urllib.parse import quote

import requests


DATA_API_BASE_URL = os.getenv(
    "DATA_API_BASE_URL",
    "http://127.0.0.1:8080"
).rstrip("/")


def _get(endpoint, params=None):
    response = requests.get(
        f"{DATA_API_BASE_URL}{endpoint}",
        params=params,
        headers={"Accept": "application/json"},
        timeout=10
    )

    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError(
            "The data API returned an invalid JSON response."
        ) from error

    return payload, response.status_code


def retrieve_dashboard(user_id=None):
    params = {"user_id": user_id} if user_id else None
    return _get("/api/dashboard", params)


def retrieve_profiles(user_id=None):
    if user_id:
        safe_id = quote(str(user_id), safe="")
        return _get(f"/api/profiles/{safe_id}")

    return _get("/api/profiles")


def retrieve_events(event_id=None):
    if event_id:
        safe_id = quote(str(event_id), safe="")
        return _get(f"/api/events/{safe_id}")

    return _get("/api/events")


def retrieve_interests():
    return _get("/api/interests")


def retrieve_connections(user_id=None):
    if user_id:
        safe_id = quote(str(user_id), safe="")
        return _get(f"/api/users/{safe_id}/connections")

    return _get("/api/connections")


def retrieve_invitations(user_id=None):
    if user_id:
        safe_id = quote(str(user_id), safe="")
        return _get(f"/api/users/{safe_id}/invitations")

    return _get("/api/event-invitations")


def retrieve_attendees(event_id=None):
    if event_id:
        safe_id = quote(str(event_id), safe="")
        return _get(f"/api/events/{safe_id}/attendees")

    return _get("/api/event_attendees")