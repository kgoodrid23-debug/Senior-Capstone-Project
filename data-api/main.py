import os
from pathlib import Path

import functions_framework
import mysql.connector
from dotenv import load_dotenv
from flask import jsonify

# Load database settings from data-api/.env
load_dotenv(Path(__file__).with_name(".env"))


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def retrieve_profiles_api():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                u.user_id,
                u.display_name,
                u.date_of_birth,
                u.bio,
                u.profile_photo_url,
                u.location,
                u.role,
                u.is_active,
                GROUP_CONCAT(
                    i.name
                    ORDER BY i.name
                    SEPARATOR '||'
                ) AS interests
            FROM users AS u
            LEFT JOIN user_interests AS ui
                ON u.user_id = ui.user_id
            LEFT JOIN interests AS i
                ON ui.interest_id = i.interest_id
            WHERE u.is_active = TRUE
            GROUP BY
                u.user_id,
                u.display_name,
                u.date_of_birth,
                u.bio,
                u.profile_photo_url,
                u.location,
                u.role,
                u.is_active
            ORDER BY u.display_name
        """)

        profiles = cursor.fetchall()

        for profile in profiles:
            if profile["date_of_birth"] is not None:
                profile["date_of_birth"] = (
                    profile["date_of_birth"].isoformat()
                )

            profile["interests"] = (
                profile["interests"].split("||")
                if profile["interests"]
                else []
            )

        return profiles

    finally:
        cursor.close()
        connection.close()

def retrieve_events_api():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                e.event_id,
                e.title,
                e.description,
                e.category,
                e.start_time,
                e.end_time,
                e.location,
                e.image_url,
                e.status,
                e.created_by_user_id,
                u.display_name AS organizer_name
            FROM events AS e
            JOIN users AS u
                ON e.created_by_user_id = u.user_id
            WHERE e.status = 'scheduled'
            ORDER BY e.start_time
        """)

        events = cursor.fetchall()

        for event in events:
            event["start_time"] = event["start_time"].isoformat()

            if event["end_time"] is not None:
                event["end_time"] = event["end_time"].isoformat()

        return events

    finally:
        cursor.close()
        connection.close()


@functions_framework.http
def api(request):
    path = request.path.rstrip("/")

    if request.method == "GET" and path.endswith("/api/profiles"):
        try:
            profiles = retrieve_profiles_api()
            return jsonify(profiles)

        except Exception as error:
            return jsonify({
                "error": "Unable to retrieve profiles",
                "details": str(error)
            }), 500

    if request.method == "GET" and path.endswith("/api/events"):
        try:
            events = retrieve_events_api()
            return jsonify(events)

        except Exception as error:
            return jsonify({
                "error": "Unable to retrieve events",
                "details": str(error)
            }), 500

    return jsonify({
        "error": "Endpoint not found",
        "method": request.method,
        "path": request.path
    }), 404