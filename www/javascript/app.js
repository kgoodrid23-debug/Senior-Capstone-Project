import {
  authenticatedFetch
} from "./firebase-auth.js";


document.addEventListener(
  "DOMContentLoaded",
  loadDashboard
);


async function loadDashboard() {
  const eventsGrid = document.getElementById("eventsGrid");
  const profileName = document.getElementById("profileName");
  const profileStatus = document.getElementById("profileStatus");
  const profileLocation = document.getElementById("profileLocation");
  const profileInterests = document.getElementById(
    "profileInterests"
  );
  const profileImage = document.getElementById("profileImage");

  try {
    const response = await authenticatedFetch(
      getApiUrl("/api/dashboard"),
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

    renderProfile(
      data.profile,
      profileName,
      profileStatus,
      profileLocation,
      profileInterests,
      profileImage
    );

    renderEvents(data.events, eventsGrid);
  } catch (error) {
    console.error("Dashboard load failed:", error);

    const fallbackData = window.dashboardData || {
      profile: {},
      events: []
    };

    renderProfile(
      fallbackData.profile,
      profileName,
      profileStatus,
      profileLocation,
      profileInterests,
      profileImage
    );

    renderEvents(fallbackData.events, eventsGrid);
  }
}


function getApiBaseUrl() {
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

  return String(configuredBase || "").replace(
    /\/+$/,
    ""
  );
}


function getApiUrl(path) {
  const baseUrl = getApiBaseUrl();

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}


function renderProfile(
  profile,
  profileNameEl,
  profileStatusEl,
  profileLocationEl,
  profileInterestsEl,
  profileImageEl
) {
  if (!profile) return;

  if (profileNameEl) {
    profileNameEl.textContent =
      profile.display_name || "Profile unavailable";
  }

  if (profileStatusEl) {
    profileStatusEl.textContent = profile.bio || "";
  }

  if (profileLocationEl) {
    profileLocationEl.textContent =
      profile.location || "";
  }

  if (
    profileImageEl &&
    profile.profile_photo_url
  ) {
    profileImageEl.style.backgroundImage =
      `url("${encodeURI(profile.profile_photo_url)}")`;

    profileImageEl.classList.add("has-image");
  }

  if (profileInterestsEl) {
    profileInterestsEl.replaceChildren();

    const interests = Array.isArray(profile.interests)
      ? profile.interests
      : [];

    interests.forEach((interest) => {
      const chip = document.createElement("span");

      chip.className = "chip";
      chip.textContent = String(interest);

      profileInterestsEl.appendChild(chip);
    });
  }
}


function renderEvents(events, eventsGridEl) {
  if (!eventsGridEl) return;

  eventsGridEl.replaceChildren();

  if (!Array.isArray(events) || events.length === 0) {
    const message = document.createElement("p");

    message.textContent =
      "Unable to load event data right now.";

    eventsGridEl.appendChild(message);
    return;
  }

  events.forEach((event) => {
    const card = document.createElement("article");

    card.className =
      "event-card home-event-card";

    const image = document.createElement("div");

    image.className =
      "event-image event-image-placeholder";

    if (event.image_url) {
      image.style.backgroundImage =
        `url("${encodeURI(event.image_url)}")`;

      image.style.backgroundPosition = "center";
      image.style.backgroundSize = "cover";
    }

    const body = document.createElement("div");
    body.className = "event-body";

    const copy = document.createElement("div");

    const title = document.createElement("div");
    title.className = "event-title";
    title.textContent =
      event.title || "Untitled event";

    const meta = document.createElement("div");
    meta.className = "event-meta";

    meta.append(
      createMetaLine(
        "🗓",
        event.date ||
        event.start_time ||
        "Date unavailable"
      ),
      createMetaLine(
        "📍",
        event.location ||
        "Location unavailable"
      )
    );

    const rsvpButton =
      document.createElement("button");

    rsvpButton.className = "rsvp-btn";
    rsvpButton.type = "button";
    rsvpButton.textContent = "RSVP";

    const eventId =
      event.document_id || event.event_id;

    if (eventId) {
      configureRsvpButton(
        rsvpButton,
        String(eventId)
      );
    } else {
      rsvpButton.disabled = true;
      rsvpButton.textContent = "Unavailable";
    }

    copy.append(title, meta);
    body.append(copy, rsvpButton);
    card.append(image, body);

    eventsGridEl.appendChild(card);
  });
}


async function configureRsvpButton(
  button,
  eventId
) {
  button.disabled = true;

  try {
    const response = await authenticatedFetch(
      getApiUrl(
        `/api/events/${encodeURIComponent(eventId)}/rsvp`
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

    const rsvp = await response.json();

    updateRsvpButton(
      button,
      rsvp.status
    );
  } catch (error) {
    console.error(
      "Unable to load RSVP status:",
      error
    );

    updateRsvpButton(button, null);
  } finally {
    button.disabled = false;
  }

  button.addEventListener("click", async () => {
    await toggleRsvp(button, eventId);
  });
}


async function toggleRsvp(button, eventId) {
  const currentStatus =
    button.dataset.rsvpStatus || "";

  const isAlreadyRsvped =
    currentStatus === "going" ||
    currentStatus === "interested";

  button.disabled = true;

  try {
    const requestOptions = isAlreadyRsvped
      ? {
          method: "DELETE",
          headers: {
            Accept: "application/json"
          }
        }
      : {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "going"
          })
        };

    const response = await authenticatedFetch(
      getApiUrl(
        `/api/events/${encodeURIComponent(eventId)}/rsvp`
      ),
      requestOptions
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        `HTTP ${response.status}`
      );
    }

    updateRsvpButton(
      button,
      result.status
    );
  } catch (error) {
    console.error(
      "Unable to update RSVP:",
      error
    );

    alert("Unable to update your RSVP.");
  } finally {
    button.disabled = false;
  }
}


function updateRsvpButton(button, status) {
  button.dataset.rsvpStatus = status || "";

  if (status === "going") {
    button.textContent = "Going ✓";
  } else if (status === "interested") {
    button.textContent = "Interested";
  } else {
    button.textContent = "RSVP";
  }
}


function createMetaLine(icon, text) {
  const line = document.createElement("span");
  const iconEl = document.createElement("span");
  const textEl = document.createElement("span");

  iconEl.setAttribute("aria-hidden", "true");
  iconEl.textContent = icon;
  textEl.textContent = text;

  line.append(iconEl, textEl);

  return line;
}