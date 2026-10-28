from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "www"

# Load DATA_API_BASE_URL before importing the controllers.
load_dotenv(BASE_DIR / ".env")


import requests
from flask import Flask, jsonify, request, send_file

from controllers.data_api_controller import (
    create_connection,
    create_profile,
    delete_event_rsvp,
    retrieve_attendees,
    retrieve_connections,
    retrieve_dashboard,
    retrieve_event_rsvp,
    retrieve_events,
    retrieve_interests,
    retrieve_invitations,
    retrieve_profiles,
    save_event_rsvp,
)


app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)


# ---------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------

def get_authorization_header():
    """
    Read the Firebase ID token sent by authenticatedFetch().

    The header is forwarded through the controller to the
    deployed data API, where main.py verifies the token.
    """
    return request.headers.get(
        "Authorization",
        ""
    )


def return_data_api_response(controller_call):
    """
    Run a controller function and preserve the status code
    returned by the deployed Firestore data API.
    """

    try:
        payload, status_code = controller_call()

        return jsonify(payload), status_code

    except requests.RequestException as error:
        return jsonify({
            "error": "Data API unavailable",
            "details": str(error)
        }), 502

    except RuntimeError as error:
        return jsonify({
            "error": str(error)
        }), 500


# ---------------------------------------------------------
# Frontend
# ---------------------------------------------------------

@app.get("/")
def home():
    return send_file(
        FRONTEND_DIR / "login.html"
    )


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_dashboard(
            authorization=authorization
        )
    )


# ---------------------------------------------------------
# Profiles
# ---------------------------------------------------------

@app.get("/api/profiles")
def profiles():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_profiles(
            authorization=authorization
        )
    )


@app.get("/api/profiles/<user_id>")
def profile_by_id(user_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_profiles(
            user_id=user_id,
            authorization=authorization
        )
    )


@app.post("/api/profiles")
def create_profile_route():
    authorization = get_authorization_header()

    profile_data = request.get_json(
        silent=True
    )

    if not isinstance(profile_data, dict):
        return jsonify({
            "error": "A JSON request body is required"
        }), 400

    return return_data_api_response(
        lambda: create_profile(
            profile_data,
            authorization
        )
    )


# ---------------------------------------------------------
# Events
# ---------------------------------------------------------

@app.get("/api/events")
def events():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_events(
            authorization=authorization
        )
    )


@app.get("/api/events/<event_id>")
def event_by_id(event_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_events(
            event_id=event_id,
            authorization=authorization
        )
    )


@app.get("/api/events/<event_id>/attendees")
def event_attendees(event_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_attendees(
            event_id=event_id,
            authorization=authorization
        )
    )


# ---------------------------------------------------------
# Interests
# ---------------------------------------------------------

@app.get("/api/interests")
def interests():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_interests(
            authorization=authorization
        )
    )


# ---------------------------------------------------------
# Connections
# ---------------------------------------------------------

@app.get("/api/connections")
def connections():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_connections(
            authorization=authorization
        )
    )


@app.post("/api/connections")
def create_connection_route():
    authorization = get_authorization_header()

    connection_data = request.get_json(
        silent=True
    )

    if not isinstance(connection_data, dict):
        return jsonify({
            "error": "A JSON request body is required"
        }), 400

    recipient_user_id = str(
        connection_data.get(
            "recipient_user_id",
            ""
        )
    ).strip()

    if not recipient_user_id:
        return jsonify({
            "error": "recipient_user_id is required"
        }), 400

    return return_data_api_response(
        lambda: create_connection(
            recipient_user_id,
            authorization
        )
    )


@app.get("/api/users/<user_id>/connections")
def user_connections(user_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_connections(
            user_id=user_id,
            authorization=authorization
        )
    )


# ---------------------------------------------------------
# Invitations
# ---------------------------------------------------------

@app.get("/api/event_invitations")
def event_invitations():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_invitations(
            authorization=authorization
        )
    )


@app.get("/api/users/<user_id>/invitations")
def user_invitations(user_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_invitations(
            user_id=user_id,
            authorization=authorization
        )
    )


# ---------------------------------------------------------
# Attendance records
# ---------------------------------------------------------

@app.get("/api/event_attendees")
def all_event_attendees():
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_attendees(
            authorization=authorization
        )
    )


# ---------------------------------------------------------
# RSVP
# ---------------------------------------------------------

@app.get("/api/events/<event_id>/rsvp")
def event_rsvp(event_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: retrieve_event_rsvp(
            event_id,
            authorization
        )
    )


@app.put("/api/events/<event_id>/rsvp")
def save_rsvp(event_id):
    authorization = get_authorization_header()

    rsvp_data = (
        request.get_json(silent=True)
        or {}
    )

    if not isinstance(rsvp_data, dict):
        return jsonify({
            "error": "A JSON request body is required"
        }), 400

    status = rsvp_data.get(
        "status",
        "going"
    )

    return return_data_api_response(
        lambda: save_event_rsvp(
            event_id,
            status,
            authorization
        )
    )


@app.delete("/api/events/<event_id>/rsvp")
def cancel_rsvp(event_id):
    authorization = get_authorization_header()

    return return_data_api_response(
        lambda: delete_event_rsvp(
            event_id,
            authorization
        )
    )


if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )