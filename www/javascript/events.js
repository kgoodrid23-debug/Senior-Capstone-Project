import {
  authenticatedFetch
} from "./firebase-auth.js";
document.addEventListener("DOMContentLoaded", loadEvents);

async function loadEvents() {
  const eventsGrid = document.getElementById("eventsGrid");

  if (!eventsGrid) {
    console.error('Could not find an element with id="eventsGrid".');
    return;
  }

  try {
    const response = await authenticatedFetch(getEventsUrl(), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const events = Array.isArray(data) ? data : data.events;

    renderEvents(events, eventsGrid);
  } catch (error) {
    console.error("Event load failed:", error);

    eventsGrid.replaceChildren();

    const message = document.createElement("p");
    message.textContent = "Unable to load events right now.";
    eventsGrid.appendChild(message);
  }
}

function getEventsUrl() {
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

  return `${baseUrl}/api/events`;
}

function renderEvents(events, eventsGrid) {
  eventsGrid.replaceChildren();

  if (!Array.isArray(events) || events.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No upcoming events are currently available.";
    eventsGrid.appendChild(message);
    return;
  }

  events.forEach((event) => {
    eventsGrid.appendChild(createEventCard(event));
  });
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = String(event.event_id || "");

  const image = document.createElement("div");
  image.className = "event-image";

  if (event.image_url) {
    image.style.backgroundImage =
      `url("${encodeURI(event.image_url)}")`;
    image.style.backgroundPosition = "center";
    image.style.backgroundSize = "cover";
  } else {
    image.classList.add("event-image-placeholder");
  }

  const content = document.createElement("div");
  content.className = "event-content";

  const dateBadge = createDateBadge(event.start_time);

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

  if (event.description) {
    const description = document.createElement("p");
    description.className = "event-description";
    description.textContent = event.description;
    content.appendChild(description);
  }

  if (event.category) {
    const category = document.createElement("span");
    category.className = "event-category";
    category.textContent = event.category;
    content.appendChild(category);
  }

  card.append(image, content);

  return card;
}

function createDateBadge(startTime) {
  const badge = document.createElement("div");
  badge.className = "event-date-badge";

  const date = parseDate(startTime);

  if (!date) {
    badge.textContent = "TBD";
    return badge;
  }

  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();

  const day = date.getDate();

  badge.append(
    document.createTextNode(month),
    document.createElement("br"),
    document.createTextNode(String(day))
  );

  return badge;
}

function formatEventDate(startTime) {
  const date = parseDate(startTime);

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

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}