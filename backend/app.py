from pathlib import Path

import requests
from flask import Flask, jsonify, send_file

from controllers.profile_controller import retrieve_profiles
from controllers.event_controller import retrieve_events


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "www"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)


@app.route("/")
def home():
    return send_file(FRONTEND_DIR / "index.html")


@app.get("/api/dashboard")
def dashboard():
    try:
        events = retrieve_events()
        profiles = retrieve_profiles()

        return jsonify({
            "profile": profiles[0] if profiles else None,
            "events": events
        })

    except requests.RequestException as error:
        return jsonify({
            "error": "Data API unavailable",
            "details": str(error)
        }), 502

    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500


@app.get("/api/events")
def events():
    try:
        return jsonify(retrieve_events())

    except requests.RequestException as error:
        return jsonify({
            "error": "Data API unavailable",
            "details": str(error)
        }), 502

    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500

@app.get("/api/profiles")
def profiles():
    try:
        return jsonify(retrieve_profiles())

    except requests.RequestException as error:
        return jsonify({
            "error": "Data API unavailable",
            "details": str(error)
        }), 502

    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)