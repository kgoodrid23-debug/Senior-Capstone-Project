from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

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
    create_profile,
    create_connection,
    delete_event_rsvp,
    retrieve_event_rsvp,
    save_event_rsvp
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
    return send_file(FRONTEND_DIR / "login.html")


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():
    authorization = request.headers.get(
        "Authorization",
        ""
    )

    return return_data_api_response(
        lambda: retrieve_dashboard(authorization)
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

@app.post("/api/profiles")
def create_profile_route():
    authorization = request.headers.get(
        "Authorization",
        ""
    )

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

@app.post("/api/connections")
def create_connection_route():
    authorization = request.headers.get(
        "Authorization",
        ""
    )

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

@app.get("/api/events/<event_id>/rsvp")
def event_rsvp(event_id):
    authorization = request.headers.get(
        "Authorization",
        ""
    )

    return return_data_api_response(
        lambda: retrieve_event_rsvp(
            event_id,
            authorization # Get the authroization header from the request and pass it to the controller function to verify the user is logged in and has access to the API.
        )
    )


@app.put("/api/events/<event_id>/rsvp")
def save_rsvp(event_id):
    authorization = request.headers.get(
        "Authorization",
        ""
    )

    rsvp_data = request.get_json(
        silent=True
    ) or {}

    if not isinstance(rsvp_data, dict):
        return jsonify({
            "error": "A JSON request body is required"
        }), 400

    status = rsvp_data.get("status", "going")

    return return_data_api_response(
        lambda: save_event_rsvp(
            event_id,
            status,
            authorization
        )
    )


@app.delete("/api/events/<event_id>/rsvp")
def cancel_rsvp(event_id):
    authorization = request.headers.get(
        "Authorization",
        ""
    )

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