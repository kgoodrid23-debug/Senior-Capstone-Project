document.addEventListener("DOMContentLoaded", async () => {
  const eventsGrid = document.getElementById("eventsGrid");
  const profileName = document.getElementById("profileName");
  const profileStatus = document.getElementById("profileStatus");
  const profileLocation = document.getElementById("profileLocation");
  const profileInterests = document.getElementById("profileInterests");

  try {
    const response = await fetch("/api/dashboard");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderProfile(data.profile, profileName, profileStatus, profileLocation, profileInterests);
    renderEvents(data.events, eventsGrid);
  } catch (error) {
    console.error("Dashboard load failed:", error);
    const fallbackData = window.dashboardData || { profile: {}, events: [] };
    renderProfile(fallbackData.profile, profileName, profileStatus, profileLocation, profileInterests);
    renderEvents(fallbackData.events, eventsGrid);
  }
});

function renderProfile(profile, profileNameEl, profileStatusEl, profileLocationEl, profileInterestsEl) {
  if (!profile) return;

  if (profileNameEl) profileNameEl.textContent = profile.name || "Profile unavailable";
  if (profileStatusEl) profileStatusEl.textContent = profile.status || "";
  if (profileLocationEl) profileLocationEl.textContent = profile.location || "";

  if (profileInterestsEl && Array.isArray(profile.interests)) {
    profileInterestsEl.innerHTML = profile.interests
      .map((interest) => `<span class="chip">${interest}</span>`)
      .join("");
  }
}

function renderEvents(events, eventsGridEl) {
  if (!eventsGridEl) return;

  if (!Array.isArray(events) || events.length === 0) {
    eventsGridEl.innerHTML = "<p>Unable to load event data right now.</p>";
    return;
  }

  eventsGridEl.innerHTML = events
    .map(
      (event) => `
        <article class="event-card">
          <div class="event-image event-image-placeholder"></div>
          <div class="event-body">
            <div>
              <div class="event-title">${event.title}</div>
              <div class="event-meta">
                <span>${event.date}</span>
                <span>${event.location}</span>
              </div>
            </div>
            <button class="rsvp-btn">${event.category}</button>
          </div>
        </article>
      `
    )
    .join("");
}
