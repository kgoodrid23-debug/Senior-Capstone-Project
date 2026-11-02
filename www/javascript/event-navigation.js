function openEventDescription(eventId) {
  if (!eventId) {
    console.error("Cannot open event: Event ID is missing.");
    return;
  }

  window.location.href =
    `event-description.html?id=${encodeURIComponent(eventId)}`;
}

// Handle clicks on event cards
document.addEventListener("click", (e) => {
  // Ignore buttons and links inside event cards
  if (e.target.closest("button, a, input, select, textarea")) {
    return;
  }

  const card = e.target.closest("[data-event-id]");

  if (!card) return;

  openEventDescription(card.dataset.eventId);
});

// Handle keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;

  const card = e.target.closest("[data-event-id]");

  if (!card || e.target !== card) return;

  e.preventDefault();
  openEventDescription(card.dataset.eventId);
});