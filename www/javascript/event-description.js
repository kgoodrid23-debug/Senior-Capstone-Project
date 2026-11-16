
import {
  authenticatedFetch
} from "./firebase-auth.js";

import {
  setProfileImage
} from "./profile-image.js";
import {
  setEventImage
} from "./event-image.js";
document.addEventListener(
  "DOMContentLoaded",
  loadEventDescription
);


async function loadEventDescription() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");

  if (!eventId) {
    document.getElementById("eventTitle").textContent =
      "Event not found";
    return;
  }

  console.log("Loading event:", eventId);

  await Promise.all([
    loadEventDetails(eventId),
    loadEventAttendees(eventId)
  ]);
}


function getApiUrl(path) {
  const config = window.APP_CONFIG || {};

  const capacitorReportsNative =
    typeof window.Capacitor?.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform();

  const looksLikeCapacitor =
    window.location.hostname === "localhost" &&
    !window.location.port &&
    ["capacitor:", "https:"].includes(
      window.location.protocol
    );

  const isNative =
    capacitorReportsNative || looksLikeCapacitor;

  const configuredBase = isNative
    ? config.NATIVE_API_BASE_URL
    : config.WEB_API_BASE_URL;

  const baseUrl = String(configuredBase || "").replace(/\/+$/, "");

  return `${baseUrl}${path}`;
}


async function loadEventDetails(eventId) {
  try {
    const response =
      await authenticatedFetch(
        getApiUrl(
          `/api/events/${encodeURIComponent(eventId)}`
        ),
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    console.log(
      "Event details response:",
      data
    );

    // Support a direct event object or
    // an object wrapped inside "event".
    const event =
      data.event || data;

    document.getElementById(
      "eventTitle"
    ).textContent =
      event.title ||
      event.event_name ||
      "Untitled Event";

    const eventDate =
      event.start_time ||
      event.date;

    document.getElementById(
      "eventDate"
    ).textContent =
      eventDate
        ? new Date(eventDate)
            .toLocaleString()
        : "Date unavailable";

    document.getElementById(
      "eventLocation"
    ).textContent =
      event.location ||
      "Location unavailable";

    document.getElementById(
      "eventCategory"
    ).textContent =
      event.category ||
      "Event";

    document.getElementById(
      "eventDescription"
    ).textContent =
      event.description ||
      "No description available.";

    const image =
      document.getElementById(
        "eventImage"
      );

    setEventImage(
      image,
      event.image_url,
      event.title ||
        event.event_name ||
        "Event"
    );
  } catch (error) {
    console.error(
      "Unable to load event details:",
      error
    );

    document.getElementById(
      "eventTitle"
    ).textContent =
      "Unable to load event";

    document.getElementById(
      "eventDescription"
    ).textContent =
      "Event information is currently unavailable.";
  }
}


async function loadEventAttendees(eventId) {
  const attendeesList = document.getElementById("attendeesList");

  try {
    const response = await authenticatedFetch(
      getApiUrl(
        `/api/events/${encodeURIComponent(eventId)}/attendees`
      ),
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("Event attendees response:", data);

    const attendees = Array.isArray(data)
      ? data
      : data.attendees || [];

    attendeesList.replaceChildren();

    if (!attendees.length) {
      attendeesList.textContent = "No attendees yet.";
      return;
    }

    attendees.forEach((attendee) => {
      const card = document.createElement("div");
      card.className = "event-attendee-card";

      const avatar =
      document.createElement("img");

      avatar.className =
        "event-attendee-avatar";

      setProfileImage(
        avatar,
        attendee.profile_photo_url,
        attendee.display_name || "User"
      );

      const info = document.createElement("div");
      info.className = "event-attendee-info";

      const name = document.createElement("h3");
      name.textContent =
        attendee.display_name || "Unknown User";

      const location = document.createElement("p");
      location.textContent = attendee.location || "";

      info.append(name, location);
      card.append(avatar, info);

      attendeesList.appendChild(card);
    });

  } catch (error) {
    console.error("Unable to load attendees:", error);

    attendeesList.textContent =
      "Unable to load attendees.";
  }
}
