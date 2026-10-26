import {
  authenticatedFetch
} from "./firebase-auth.js";

document.addEventListener("DOMContentLoaded", loadProfilePage);

async function loadProfilePage() {
  const eventsGrid = document.getElementById("profileEventsGrid");

  try {
    const response = await authenticatedFetch(getDashboardUrl(), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.profile) {
      renderProfile(data.profile);
    }

    renderProfileEvents(data.events, eventsGrid);
  } catch (error) {
    console.error("Profile page load failed:", error);
    showEventsMessage(eventsGrid, "Unable to load upcoming events.");
  }
}

function getDashboardUrl() {
  const config = window.APP_CONFIG || {};

  const capacitorReportsNative =
    typeof window.Capacitor?.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform();

  const looksLikeCapacitor =
    window.location.hostname === "localhost" &&
    !window.location.port &&
    ["capacitor:", "https:"].includes(window.location.protocol);

  const isNative = capacitorReportsNative || looksLikeCapacitor;

  const configuredBase = isNative
    ? config.NATIVE_API_BASE_URL
    : config.WEB_API_BASE_URL;

  const baseUrl = String(configuredBase || "").replace(/\/+$/, "");

  return `${baseUrl}/api/dashboard`;
}

function renderProfile(profile) {
  const photoElement = document.getElementById("profilePhoto");
  const nameElement = document.getElementById("profileName");
  const locationElement = document.getElementById("profileLocation");
  const bioElement = document.getElementById("profileBio");
  const interestsElement = document.getElementById("profileInterests");

  const displayName = profile.display_name || "Profile unavailable";
  const age = calculateAge(profile.date_of_birth);

  renderProfileName(nameElement, displayName, age);

  if (locationElement) {
    locationElement.textContent = profile.location || "";
  }

  if (bioElement) {
    bioElement.textContent = profile.bio || "";
  }

  if (photoElement && profile.profile_photo_url) {
    photoElement.src = profile.profile_photo_url;
    photoElement.alt = `${displayName} portrait`;
  }

  renderInterests(interestsElement, profile.interests);
}

function renderProfileName(nameElement, displayName, age) {
  if (!nameElement) return;

  nameElement.replaceChildren();

  const nameParts = displayName.trim().split(/\s+/);
  const firstName = nameParts.shift();
  const remainingName = nameParts.join(" ");

  nameElement.appendChild(
    document.createTextNode(firstName || "Profile unavailable")
  );

  if (remainingName) {
    nameElement.appendChild(document.createElement("br"));

    const secondLine =
      age !== null
        ? `${remainingName}, ${age}`
        : remainingName;

    nameElement.appendChild(document.createTextNode(secondLine));
  } else if (age !== null) {
    nameElement.appendChild(document.createTextNode(`, ${age}`));
  }
}

function renderInterests(interestsElement, interests) {
  if (!interestsElement) return;

  interestsElement.replaceChildren();

  const interestList = Array.isArray(interests) ? interests : [];
  const colors = ["green", "purple", "blue", "pink"];

  interestList.forEach((interest, index) => {
    const tag = document.createElement("span");
    tag.className = `tag ${colors[index % colors.length]}`;

    const icon = document.createElement("span");
    icon.textContent = getInterestIcon(interest);

    tag.append(
      icon,
      document.createTextNode(` ${interest}`)
    );

    interestsElement.appendChild(tag);
  });
}

function getInterestIcon(interest) {
  const icons = {
    fitness: "🏋",
    volleyball: "🏐",
    church: "✝",
    music: "♫",
    technology: "💻",
    volunteering: "♡",
    gaming: "🎮",
    outdoors: "🌳"
  };

  return icons[String(interest).toLowerCase()] || "•";
}

function renderProfileEvents(events, eventsGrid) {
  if (!eventsGrid) return;

  eventsGrid.replaceChildren();

  const upcomingEvents = Array.isArray(events)
    ? events.slice(0, 2)
    : [];

  if (upcomingEvents.length === 0) {
    showEventsMessage(eventsGrid, "No upcoming events.");
    return;
  }

  upcomingEvents.forEach((event) => {
    eventsGrid.appendChild(createProfileEventCard(event));
  });
}

function createProfileEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = String(event.event_id || "");

  const image = document.createElement("div");
  image.className = "event-image";

  if (event.image_url) {
    image.style.backgroundImage =
      `url("${encodeURI(event.image_url)}")`;
  }

  const content = document.createElement("div");
  content.className = "event-content";

  const dateBadge = createEventDateBadge(event.start_time);

  const title = document.createElement("h3");
  title.textContent = event.title || "Untitled Event";

  const date = document.createElement("p");
  date.className = "event-meta";
  date.textContent = `📅 ${formatEventDate(event.start_time)}`;

  const location = document.createElement("p");
  location.className = "event-meta";
  location.textContent =
    `📍 ${event.location || "Location unavailable"}`;

  content.append(dateBadge, title, date, location);
  card.append(image, content);

  return card;
}

function createEventDateBadge(startTime) {
  const badge = document.createElement("div");
  badge.className = "event-date-badge";

  const date = parseEventDate(startTime);

  if (!date) {
    badge.textContent = "TBD";
    return badge;
  }

  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();

  badge.append(
    document.createTextNode(month),
    document.createElement("br"),
    document.createTextNode(String(date.getDate()))
  );

  return badge;
}

function formatEventDate(startTime) {
  const date = parseEventDate(startTime);

  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function parseEventDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function showEventsMessage(eventsGrid, text) {
  if (!eventsGrid) return;

  eventsGrid.replaceChildren();

  const message = document.createElement("p");
  message.textContent = text;
  eventsGrid.appendChild(message);
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dateValue = String(dateOfBirth);
  const birthDate = new Date(
    dateValue.length === 10
      ? `${dateValue}T00:00:00`
      : dateValue
  );

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasOccurred =
    today.getMonth() > birthDate.getMonth() ||
    (
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate()
    );

  if (!birthdayHasOccurred) {
    age -= 1;
  }

  return age;
}