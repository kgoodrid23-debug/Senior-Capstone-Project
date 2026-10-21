from pathlib import Path

import requests
from flask import Flask, jsonify, request, send_file

from controllers.data_api_controller import (
    retrieve_attendees,
    retrieve_connections,
    retrieve_dashboard,
    retrieve_events,
    retrieve_interests,
    retrieve_invitations,
    retrieve_profiles,
)


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "www"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)


def return_data_api_response(controller_call):
    """
    Run a controller function and preserve the status code returned
    by the Firestore data API.
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


@app.get("/")
def home():
    return send_file(FRONTEND_DIR / "index.html")


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():
    user_id = request.args.get("user_id")

    return return_data_api_response(
        lambda: retrieve_dashboard(user_id)
    )


# ---------------------------------------------------------
# Profiles
# ---------------------------------------------------------

@app.get("/api/profiles")
def profiles():
    return return_data_api_response(
        retrieve_profiles
    )


@app.get("/api/profiles/<user_id>")
def profile_by_id(user_id):
    return return_data_api_response(
        lambda: retrieve_profiles(user_id)
    )


# ---------------------------------------------------------
# Events
# ---------------------------------------------------------

@app.get("/api/events")
def events():
    return return_data_api_response(
        retrieve_events
    )


@app.get("/api/events/<event_id>")
def event_by_id(event_id):
    return return_data_api_response(
        lambda: retrieve_events(event_id)
    )


@app.get("/api/events/<event_id>/attendees")
def event_attendees(event_id):
    return return_data_api_response(
        lambda: retrieve_attendees(event_id)
    )


# ---------------------------------------------------------
# Interests
# ---------------------------------------------------------

@app.get("/api/interests")
def interests():
    return return_data_api_response(
        retrieve_interests
    )


# ---------------------------------------------------------
# Connections
# ---------------------------------------------------------

@app.get("/api/connections")
def connections():
    return return_data_api_response(
        retrieve_connections
    )


@app.get("/api/users/<user_id>/connections")
def user_connections(user_id):
    return return_data_api_response(
        lambda: retrieve_connections(user_id)
    )


# ---------------------------------------------------------
# Invitations
# ---------------------------------------------------------

@app.get("/api/event_invitations")
def event_invitations():
    return return_data_api_response(
        retrieve_invitations
    )


@app.get("/api/users/<user_id>/invitations")
def user_invitations(user_id):
    return return_data_api_response(
        lambda: retrieve_invitations(user_id)
    )


# ---------------------------------------------------------
# All attendance records
# ---------------------------------------------------------

@app.get("/api/event_attendees")
def all_event_attendees():
    return return_data_api_response(
        retrieve_attendees
    )


if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )