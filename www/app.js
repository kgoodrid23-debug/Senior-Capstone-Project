document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
  const eventsGrid = document.getElementById("eventsGrid");
  const profileName = document.getElementById("profileName");
  const profileStatus = document.getElementById("profileStatus");
  const profileLocation = document.getElementById("profileLocation");
  const profileInterests = document.getElementById("profileInterests");
  const profileImage = document.getElementById("profileImage");

  try {
    const response = await fetch(getDashboardUrl(), {
      headers: { Accept: "application/json" }
    });

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
    console.warn("Dashboard API unavailable; using mock data.", error);
    const fallbackData = window.dashboardData || { profile: {}, events: [] };
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
  const baseUrl = String(configuredBase || "").replace(/\/$/, "");

  return `${baseUrl}/api/dashboard`;
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
    profileNameEl.textContent = profile.name || "Profile unavailable";
  }
  if (profileStatusEl) profileStatusEl.textContent = profile.status || "";
  if (profileLocationEl) {
    profileLocationEl.textContent = profile.location || "";
  }

  if (profileImageEl && profile.photo_url) {
    profileImageEl.style.backgroundImage = `url("${encodeURI(profile.photo_url)}")`;
    profileImageEl.classList.add("has-image");
  }

  if (profileInterestsEl) {
    profileInterestsEl.replaceChildren();
    const interests = Array.isArray(profile.interests) ? profile.interests : [];

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
    message.textContent = "Unable to load event data right now.";
    eventsGridEl.appendChild(message);
    return;
  }

  events.forEach((event) => {
    const card = document.createElement("article");
    card.className = "event-card home-event-card";

    const image = document.createElement("div");
    image.className = "event-image event-image-placeholder";
    if (event.image_url) {
      image.style.backgroundImage = `url("${encodeURI(event.image_url)}")`;
      image.style.backgroundPosition = "center";
      image.style.backgroundSize = "cover";
    }

    const body = document.createElement("div");
    body.className = "event-body";

    const copy = document.createElement("div");
    const title = document.createElement("div");
    title.className = "event-title";
    title.textContent = event.title || "Untitled event";

    const meta = document.createElement("div");
    meta.className = "event-meta";
    meta.append(
      createMetaLine("🗓", event.date || event.start_time || "Date unavailable"),
      createMetaLine("📍", event.location || "Location unavailable")
    );

    const category = document.createElement("button");
    category.className = "rsvp-btn";
    category.type = "button";
    category.textContent = event.category || "Event";

    copy.append(title, meta);
    body.append(copy, category);
    card.append(image, body);
    eventsGridEl.appendChild(card);
  });
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
