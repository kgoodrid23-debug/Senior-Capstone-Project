import os
from urllib.parse import quote

import requests


DATA_API_BASE_URL = os.getenv(
    "DATA_API_BASE_URL",
    "http://127.0.0.1:8080"
).rstrip("/")


# ---------------------------------------------------------
# Shared HTTP methods
# ---------------------------------------------------------

def _build_headers(authorization=None):
    """
    Build the headers sent to the deployed data API.

    The authorization value already contains:
    Bearer FIREBASE_ID_TOKEN
    """

    headers = {
        "Accept": "application/json"
    }

    if authorization:
        headers["Authorization"] = authorization

    return headers


def _parse_response(response):
    """
    Convert the data API response to JSON and preserve its
    original HTTP status code.
    """

    try:
        payload = response.json()

    except ValueError as error:
        raise RuntimeError(
            "The data API returned an invalid JSON response."
        ) from error

    return payload, response.status_code


def _get(
    endpoint,
    params=None,
    authorization=None
):
    response = requests.get(
        f"{DATA_API_BASE_URL}{endpoint}",
        params=params,
        headers=_build_headers(authorization),
        timeout=10
    )

    return _parse_response(response)


def _post(
    endpoint,
    payload=None,
    authorization=None
):
    response = requests.post(
        f"{DATA_API_BASE_URL}{endpoint}",
        json=payload,
        headers=_build_headers(authorization),
        timeout=10
    )

    return _parse_response(response)


def _put(
    endpoint,
    payload=None,
    authorization=None
):
    response = requests.put(
        f"{DATA_API_BASE_URL}{endpoint}",
        json=payload,
        headers=_build_headers(authorization),
        timeout=10
    )

    return _parse_response(response)


def _delete(
    endpoint,
    authorization=None
):
    response = requests.delete(
        f"{DATA_API_BASE_URL}{endpoint}",
        headers=_build_headers(authorization),
        timeout=10
    )

    return _parse_response(response)


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

def retrieve_dashboard(authorization=None):
    return _get(
        "/api/dashboard",
        authorization=authorization
    )


# ---------------------------------------------------------
# Profiles
# ---------------------------------------------------------

def retrieve_profiles(
    user_id=None,
    authorization=None
):
    if user_id:
        safe_id = quote(
            str(user_id),
            safe=""
        )

        return _get(
            f"/api/profiles/{safe_id}",
            authorization=authorization
        )

    return _get(
        "/api/profiles",
        authorization=authorization
    )


def create_profile(
    profile_data,
    authorization
):
    return _post(
        "/api/profiles",
        payload=profile_data,
        authorization=authorization
    )


# ---------------------------------------------------------
# Events
# ---------------------------------------------------------

def retrieve_events(
    event_id=None,
    authorization=None
):
    if event_id:
        safe_id = quote(
            str(event_id),
            safe=""
        )

        return _get(
            f"/api/events/{safe_id}",
            authorization=authorization
        )

    return _get(
        "/api/events",
        authorization=authorization
    )


# ---------------------------------------------------------
# Interests
# ---------------------------------------------------------

def retrieve_interests(authorization=None):
    return _get(
        "/api/interests",
        authorization=authorization
    )


# ---------------------------------------------------------
# Connections
# ---------------------------------------------------------

def retrieve_connections(
    user_id=None,
    authorization=None
):
    if user_id:
        safe_id = quote(
            str(user_id),
            safe=""
        )

        return _get(
            f"/api/users/{safe_id}/connections",
            authorization=authorization
        )

    return _get(
        "/api/connections",
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

def update_connection(
    connection_id,
    status,
    authorization
):
    safe_id = quote(
        str(connection_id),
        safe=""
    )

    return _put(
        f"/api/connections/{safe_id}",
        payload={
            "status": status
        },
        authorization=authorization
    )


# ---------------------------------------------------------
# Invitations
# ---------------------------------------------------------

def retrieve_invitations(
    user_id=None,
    authorization=None
):
    if user_id:
        safe_id = quote(
            str(user_id),
            safe=""
        )

        return _get(
            f"/api/users/{safe_id}/invitations",
            authorization=authorization
        )

    return _get(
        "/api/event_invitations",
        authorization=authorization
    )


# ---------------------------------------------------------
# Event attendees
# ---------------------------------------------------------

def retrieve_attendees(
    event_id=None,
    authorization=None
):
    if event_id:
        safe_id = quote(
            str(event_id),
            safe=""
        )

        return _get(
            f"/api/events/{safe_id}/attendees",
            authorization=authorization
        )

    return _get(
        "/api/event_attendees",
        authorization=authorization
    )


# ---------------------------------------------------------
# Event RSVP
# ---------------------------------------------------------

def retrieve_event_rsvp(
    event_id,
    authorization
):
    safe_id = quote(
        str(event_id),
        safe=""
    )

    return _get(
        f"/api/events/{safe_id}/rsvp",
        authorization=authorization
    )


def save_event_rsvp(
    event_id,
    status,
    authorization
):
    safe_id = quote(
        str(event_id),
        safe=""
    )

    return _put(
        f"/api/events/{safe_id}/rsvp",
        payload={
            "status": status
        },
        authorization=authorization
    )


def delete_event_rsvp(
    event_id,
    authorization
):
    safe_id = quote(
        str(event_id),
        safe=""
    )

    return _delete(
        f"/api/events/{safe_id}/rsvp",
        authorization=authorization
    )