import os
from urllib.parse import quote

import requests


DATA_API_BASE_URL = os.getenv(
    "DATA_API_BASE_URL",
    "http://127.0.0.1:8080"
).rstrip("/")


def _get(endpoint, params=None, authorization=None):
    headers = {
        "Accept": "application/json"
    }

    if authorization:
        headers["Authorization"] = authorization

    response = requests.get(
        f"{DATA_API_BASE_URL}{endpoint}",
        params=params,
        headers=headers,
        timeout=10
    )

    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError(
            "The data API returned an invalid JSON response."
        ) from error

    return payload, response.status_code

def _post(
    endpoint,
    payload=None,
    authorization=None
):
    headers = {
        "Accept": "application/json"
    }

    if authorization:
        headers["Authorization"] = authorization

    response = requests.post(
        f"{DATA_API_BASE_URL}{endpoint}",
        json=payload,
        headers=headers,
        timeout=10
    )

    try:
        response_payload = response.json()
    except ValueError as error:
        raise RuntimeError(
            "The data API returned an invalid JSON response."
        ) from error

    return response_payload, response.status_code

def _put(
    endpoint,
    payload=None,
    authorization=None
):
    headers = {
        "Accept": "application/json"
    }

    if authorization:
        headers["Authorization"] = authorization

    response = requests.put(
        f"{DATA_API_BASE_URL}{endpoint}",
        json=payload,
        headers=headers,
        timeout=10
    )

    try:
        response_payload = response.json()
    except ValueError as error:
        raise RuntimeError(
            "The data API returned an invalid JSON response."
        ) from error

    return response_payload, response.status_code


def _delete(endpoint, authorization=None):
    headers = {
        "Accept": "application/json"
    }

    if authorization:
        headers["Authorization"] = authorization

    response = requests.delete(
        f"{DATA_API_BASE_URL}{endpoint}",
        headers=headers,
        timeout=10
    )

    try:
        response_payload = response.json()
    except ValueError as error:
        raise RuntimeError(
            "The data API returned an invalid JSON response."
        ) from error

    return response_payload, response.status_code


def retrieve_dashboard(authorization=None):
    return _get(
        "/api/dashboard",
        authorization=authorization
    )


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
        return _get(
            f"/api/users/{safe_id}/connections"
        )

    return _get("/api/connections")


def retrieve_invitations(user_id=None):
    if user_id:
        safe_id = quote(str(user_id), safe="")
        return _get(
            f"/api/users/{safe_id}/invitations"
        )

    return _get("/api/event_invitations")


def retrieve_attendees(event_id=None):
    if event_id:
        safe_id = quote(str(event_id), safe="")
        return _get(
            f"/api/events/{safe_id}/attendees"
        )

    return _get("/api/event_attendees")

def create_profile(profile_data, authorization):
    return _post(
        "/api/profiles",
        payload=profile_data,
        authorization=authorization
    )

def retrieve_event_rsvp(event_id, authorization):
    safe_id = quote(str(event_id), safe="")

    return _get(
        f"/api/events/{safe_id}/rsvp",
        authorization=authorization
    )


def save_event_rsvp(
    event_id,
    status,
    authorization
):
    safe_id = quote(str(event_id), safe="")

    return _put(
        f"/api/events/{safe_id}/rsvp",
        payload={"status": status},
        authorization=authorization
    )


def delete_event_rsvp(event_id, authorization):
    safe_id = quote(str(event_id), safe="")

    return _delete(
        f"/api/events/{safe_id}/rsvp",
        authorization=authorization
    )

def create_connection(
    recipient_user_id,
    authorization
):
    return _post(
        "/api/connections",
        payload={
            "recipient_user_id": recipient_user_id
        },
        authorization=authorization
    )