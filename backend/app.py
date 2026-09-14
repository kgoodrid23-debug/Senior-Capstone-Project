from pathlib import Path

from flask import Flask, jsonify, send_file

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")


@app.route("/")
def home():
    return send_file(FRONTEND_DIR / "index.html")


@app.route("/api/dashboard")
def dashboard():
    return jsonify(
        {
            "profile": {
                "name": "Jordan Lee",
                "status": "Campus Explorer",
                "location": "Evansville, IN",
                "interests": ["Music", "Volunteering", "Hiking", "Tech"]
            },
            "events": [
                {
                    "title": "Sunset Jam Session",
                    "date": "Fri · 7:00 PM",
                    "location": "Campus Lawn",
                    "category": "Music"
                },
                {
                    "title": "Community Clean-Up",
                    "date": "Sat · 9:00 AM",
                    "location": "Riverfront Park",
                    "category": "Outdoors"
                },
                {
                    "title": "Startup Mixer",
                    "date": "Tue · 6:30 PM",
                    "location": "Innovation Hub",
                    "category": "Networking"
                }
            ]
        }
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)