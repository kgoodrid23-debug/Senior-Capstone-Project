import {
  authenticatedFetch
} from "./firebase-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const eventsGrid = document.getElementById("eventsGrid");
  const profileName = document.getElementById("profileName");
  const profileStatus = document.getElementById("profileStatus");
  const profileLocation = document.getElementById("profileLocation");
  const profileInterests = document.getElementById("profileInterests");

  try {
    const response = await authenticatedFetch("/api/dashboard");
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
      .map((interest) => `<span class="badge">${interest}</span>`)
      .join("");
  }
}

function renderEvents(events, eventsGridEl) {
  if (!eventsGridEl) return;

  if (!Array.isArray(events) || events.length === 0) {
    eventsGridEl.innerHTML =
      "<p>Unable to load event data right now.</p>";
    return;
  }

  eventsGridEl.innerHTML = events
    .map((event) => {
      const eventId = encodeURIComponent(
        String(
          event.document_id ||
          event.event_id ||
          ""
        )
      );

      return `
        <article class="card card--event">
          <div class="event-image placeholder"></div>

          <div class="event-body">
            <div>
              <div class="event-title">
                ${event.title || "Untitled event"}
              </div>

              <div class="event-meta">
                <span>
                  ${event.date || event.start_time || ""}
                </span>

                <span>
                  ${event.location || ""}
                </span>
              </div>
            </div>

            <button
              class="btn btn--primary rsvp-button"
              type="button"
              data-event-id="${eventId}"
            >
              RSVP
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  const rsvpButtons = (
    eventsGridEl.querySelectorAll(".rsvp-button")
  );

  rsvpButtons.forEach((button) => {
    loadRsvpStatus(button);

    button.addEventListener("click", () => {
      toggleRsvp(button);
    });
  });
}

async function loadRsvpStatus(button) {
  const eventId = decodeURIComponent(
    button.dataset.eventId
  );

  try {
    const response = await authenticatedFetch(
      `/api/events/${encodeURIComponent(eventId)}/rsvp`
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
  }
}


async function toggleRsvp(button) {
  const eventId = decodeURIComponent(
    button.dataset.eventId
  );

  const currentStatus = (
    button.dataset.rsvpStatus || ""
  );

  const isCurrentlyGoing = (
    currentStatus === "going"
  );

  button.disabled = true;

  try {
    const options = isCurrentlyGoing
      ? {
          method: "DELETE"
        }
      : {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "going"
          })
        };

    const response = await authenticatedFetch(
      `/api/events/${encodeURIComponent(eventId)}/rsvp`,
      options
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
    console.error("Unable to update RSVP:", error);
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