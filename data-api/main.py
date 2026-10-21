import os
from datetime import date, datetime

import firebase_admin
import functions_framework
from firebase_admin import firestore
from flask import jsonify
from google.cloud.firestore_v1.base_query import FieldFilter


PROJECT_ID = os.getenv(
    "GOOGLE_CLOUD_PROJECT",
    "buddiez-and-bandz"
)

if not firebase_admin._apps:
    firebase_admin.initialize_app(
        options={"projectId": PROJECT_ID}
    )

db = firestore.client()


# ---------------------------------------------------------
# General helpers
# ---------------------------------------------------------

def make_json_safe(value):
    """Convert Firestore values into JSON-safe values."""

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, list):
        return [make_json_safe(item) for item in value]

    if isinstance(value, dict):
        return {
            key: make_json_safe(item)
            for key, item in value.items()
        }

    return value


def get_document(collection_name, document_id):
    """Retrieve one Firestore document by its document ID."""

    document = (
        db.collection(collection_name)
        .document(str(document_id))
        .get()
    )

    return document if document.exists else None


def resolve_interest_names(interest_ids):
    """
    Convert user interest document IDs such as 'rock'
    into readable names such as 'Rock'.
    """

    if not isinstance(interest_ids, list):
        return []

    interests = []

    for interest_id in interest_ids:
        document = get_document("interests", interest_id)

        if document:
            interest_data = document.to_dict() or {}
            interests.append(
                interest_data.get("name", str(interest_id).title())
            )
        else:
            # Provide a reasonable fallback if an interest document
            # is missing.
            interests.append(
                str(interest_id).replace("_", " ").title()
            )

    return interests


# ---------------------------------------------------------
# Profiles
# ---------------------------------------------------------

def map_profile_document(document):
    """Map a Firestore user document to the frontend profile format."""

    user = document.to_dict() or {}

    first_name = user.get("first_name", "")
    last_name = user.get("last_name", "")

    combined_name = " ".join(
        name for name in [first_name, last_name] if name
    )

    profile = {
        "user_id": document.id,
        "display_name": (
            user.get("display_name")
            or combined_name
            or "Profile unavailable"
        ),
        "first_name": first_name,
        "last_name": last_name,
        "bio": user.get("bio", ""),
        "location": user.get("location", ""),
        "role": user.get("role", "user"),
        "is_active": user.get("is_active", False),
        "profile_photo_url": (
            user.get("profile_photo_url")
            or user.get("photo_url")
            or ""
        ),
        "date_of_birth": user.get("date_of_birth"),
        "interests": resolve_interest_names(
            user.get(
                "interest_ids",
                user.get("interests", [])
            )
        )
    }

    # Email and authentication information are intentionally
    # not returned by the public profiles API.
    return make_json_safe(profile)


def retrieve_profiles_api():
    documents = (
        db.collection("users")
        .where(
            filter=FieldFilter("is_active", "==", True)
        )
        .stream()
    )

    profiles = [
        map_profile_document(document)
        for document in documents
    ]

    profiles.sort(
        key=lambda profile: profile.get("display_name", "").lower()
    )

    return profiles


def retrieve_profile_api(user_id):
    document = get_document("users", user_id)

    if not document:
        return None

    user = document.to_dict() or {}

    if not user.get("is_active", False):
        return None

    return map_profile_document(document)


# ---------------------------------------------------------
# Events
# ---------------------------------------------------------

def build_event_location(event):
    if event.get("location"):
        return event["location"]

    location_parts = [
        event.get("venue"),
        event.get("city"),
        event.get("state")
    ]

    return ", ".join(
        part for part in location_parts if part
    )


def map_event_document(document):
    """Map Tim's Firestore event fields to frontend event fields."""

    event = document.to_dict() or {}
    event_date = make_json_safe(
        event.get("date") or event.get("start_time")
    )

    created_by = (
        event.get("created_by")
        or event.get("created_by_user_id")
    )

    organizer = (
        retrieve_profile_api(created_by)
        if created_by
        else None
    )

    mapped_event = {
        "event_id": event.get("event_id", document.id),
        "document_id": document.id,
        "title": (
            event.get("event_name")
            or event.get("title")
            or "Untitled event"
        ),
        "description": event.get("description", ""),
        "category": event.get("category", "Event"),
        "date": event_date,
        "start_time": event_date,
        "end_time": make_json_safe(event.get("end_time")),
        "location": build_event_location(event),
        "venue": event.get("venue", ""),
        "city": event.get("city", ""),
        "state": event.get("state", ""),
        "image_url": event.get("image_url", ""),
        "created_by_user_id": created_by,
        "organizer_name": (
            organizer.get("display_name")
            if organizer
            else ""
        ),
        "is_active": event.get("is_active", False),
        "status": event.get(
            "status",
            "scheduled" if event.get("is_active") else "inactive"
        ),
        "created_at": make_json_safe(event.get("created_at"))
    }

    return mapped_event


def retrieve_events_api():
    documents = (
        db.collection("events")
        .where(
            filter=FieldFilter("is_active", "==", True)
        )
        .stream()
    )

    events = [
        map_event_document(document)
        for document in documents
    ]

    events.sort(
        key=lambda event: event.get("start_time") or ""
    )

    return events


def retrieve_event_api(event_id):
    document = get_document("events", event_id)

    if not document:
        return None

    event = document.to_dict() or {}

    if not event.get("is_active", False):
        return None

    return map_event_document(document)


# ---------------------------------------------------------
# Interests
# ---------------------------------------------------------

def retrieve_interests_api():
    documents = db.collection("interests").stream()

    interests = []

    for document in documents:
        interest = document.to_dict() or {}

        interests.append({
            "interest_id": document.id,
            "name": interest.get(
                "name",
                document.id.replace("_", " ").title()
            )
        })

    interests.sort(
        key=lambda interest: interest["name"].lower()
    )

    return interests


# ---------------------------------------------------------
# Connections
# ---------------------------------------------------------

def map_connection_document(document, current_user_id=None):
    connection = document.to_dict() or {}

    requester_id = connection.get("requester_user_id")
    recipient_id = connection.get("recipient_user_id")

    mapped_connection = {
        "connection_id": connection.get(
            "connection_id",
            document.id
        ),
        "document_id": document.id,
        "requester_user_id": requester_id,
        "recipient_user_id": recipient_id,
        "status": connection.get("status", "pending"),
        "created_at": make_json_safe(
            connection.get("created_at")
        )
    }

    if current_user_id:
        if requester_id == current_user_id:
            other_user_id = recipient_id
        else:
            other_user_id = requester_id

        mapped_connection["other_user_id"] = other_user_id
        mapped_connection["other_user"] = (
            retrieve_profile_api(other_user_id)
            if other_user_id
            else None
        )

    return mapped_connection


def retrieve_connections_api(user_id=None):
    if not user_id:
        documents = list(
            db.collection("connections").stream()
        )
    else:
        requested_documents = (
            db.collection("connections")
            .where(
                filter=FieldFilter(
                    "requester_user_id",
                    "==",
                    user_id
                )
            )
            .stream()
        )

        received_documents = (
            db.collection("connections")
            .where(
                filter=FieldFilter(
                    "recipient_user_id",
                    "==",
                    user_id
                )
            )
            .stream()
        )

        # Combine both query results without duplicating documents.
        documents_by_id = {}

        for document in requested_documents:
            documents_by_id[document.id] = document

        for document in received_documents:
            documents_by_id[document.id] = document

        documents = list(documents_by_id.values())

    connections = [
        map_connection_document(document, user_id)
        for document in documents
    ]

    connections.sort(
        key=lambda connection: connection.get("created_at") or "",
        reverse=True
    )

    return connections


# ---------------------------------------------------------
# Event invitations
# ---------------------------------------------------------

def map_invitation_document(document):
    invitation = document.to_dict() or {}

    event_id = invitation.get("event_id")
    sender_id = invitation.get("sender_user_id")

    return {
        "invitation_id": invitation.get(
            "invitation_id",
            document.id
        ),
        "document_id": document.id,
        "event_id": event_id,
        "sender_user_id": sender_id,
        "recipient_user_id": invitation.get(
            "recipient_user_id"
        ),
        "status": invitation.get("status", "pending"),
        "created_at": make_json_safe(
            invitation.get("created_at")
        ),
        "sender": (
            retrieve_profile_api(sender_id)
            if sender_id
            else None
        ),
        "event": (
            retrieve_event_api(event_id)
            if event_id
            else None
        )
    }


def retrieve_invitations_api(user_id=None):
    collection = db.collection("event_invitations")

    if user_id:
        documents = (
            collection
            .where(
                filter=FieldFilter(
                    "recipient_user_id",
                    "==",
                    user_id
                )
            )
            .stream()
        )
    else:
        documents = collection.stream()

    invitations = [
        map_invitation_document(document)
        for document in documents
    ]

    invitations.sort(
        key=lambda invitation: invitation.get("created_at") or "",
        reverse=True
    )

    return invitations


# ---------------------------------------------------------
# Event attendees and RSVPs
# ---------------------------------------------------------

def map_attendee_document(document):
    attendee = document.to_dict() or {}
    user_id = attendee.get("user_id")

    return {
        "attendee_id": document.id,
        "event_id": attendee.get("event_id"),
        "user_id": user_id,
        "status": attendee.get(
            "attendance_status",
            attendee.get("status", "going")
        ),
        "joined_at": make_json_safe(
            attendee.get("joined_at")
        ),
        "profile": (
            retrieve_profile_api(user_id)
            if user_id
            else None
        )
    }


def retrieve_attendees_api(event_id=None):
    collection = db.collection("event_attendees")

    if event_id:
        documents = (
            collection
            .where(
                filter=FieldFilter(
                    "event_id",
                    "==",
                    event_id
                )
            )
            .stream()
        )
    else:
        documents = collection.stream()

    attendees = [
        map_attendee_document(document)
        for document in documents
    ]

    attendees.sort(
        key=lambda attendee: attendee.get("joined_at") or "",
        reverse=True
    )

    return attendees


# ---------------------------------------------------------
# HTTP routes
# ---------------------------------------------------------

@functions_framework.http
def api(request):
    path_parts = [
        part
        for part in request.path.strip("/").split("/")
        if part
    ]

    if request.method != "GET":
        return jsonify({
            "error": "Method not allowed",
            "method": request.method
        }), 405

    try:
        # GET /api/dashboard
        if path_parts == ["api", "dashboard"]:
            requested_user_id = request.args.get("user_id")

            if requested_user_id:
                profile = retrieve_profile_api(
                    requested_user_id
                )
            else:
                profiles = retrieve_profiles_api()
                profile = profiles[0] if profiles else None

            return jsonify({
                "profile": profile,
                "events": retrieve_events_api()
            })

        # GET /api/profiles
        if path_parts == ["api", "profiles"]:
            return jsonify(retrieve_profiles_api())

        # GET /api/profiles/{user_id}
        if (
            len(path_parts) == 3
            and path_parts[:2] == ["api", "profiles"]
        ):
            profile = retrieve_profile_api(path_parts[2])

            if not profile:
                return jsonify({
                    "error": "Profile not found"
                }), 404

            return jsonify(profile)

        # GET /api/events
        if path_parts == ["api", "events"]:
            return jsonify(retrieve_events_api())

        # GET /api/events/{event_id}/attendees
        if (
            len(path_parts) == 4
            and path_parts[0] == "api"
            and path_parts[1] == "events"
            and path_parts[3] == "attendees"
        ):
            return jsonify(
                retrieve_attendees_api(path_parts[2])
            )

        # GET /api/events/{event_id}
        if (
            len(path_parts) == 3
            and path_parts[:2] == ["api", "events"]
        ):
            event = retrieve_event_api(path_parts[2])

            if not event:
                return jsonify({
                    "error": "Event not found"
                }), 404

            return jsonify(event)

        # GET /api/interests
        if path_parts == ["api", "interests"]:
            return jsonify(retrieve_interests_api())

        # GET /api/connections
        if path_parts == ["api", "connections"]:
            return jsonify(retrieve_connections_api())

        # GET /api/users/{user_id}/connections
        if (
            len(path_parts) == 4
            and path_parts[0] == "api"
            and path_parts[1] == "users"
            and path_parts[3] == "connections"
        ):
            return jsonify(
                retrieve_connections_api(path_parts[2])
            )

        # GET /api/event-invitations
        if path_parts == ["api", "event_invitations"]:
            return jsonify(retrieve_invitations_api())

        # GET /api/users/{user_id}/invitations
        if (
            len(path_parts) == 4
            and path_parts[0] == "api"
            and path_parts[1] == "users"
            and path_parts[3] == "invitations"
        ):
            return jsonify(
                retrieve_invitations_api(path_parts[2])
            )

        # GET /api/event_attendees
        if path_parts == ["api", "event_attendees"]:
            return jsonify(retrieve_attendees_api())

        return jsonify({
            "error": "Endpoint not found",
            "method": request.method,
            "path": request.path
        }), 404

    except Exception as error:
        return jsonify({
            "error": "Unable to retrieve Firestore data",
            "details": str(error)
        }), 500