const samplePeople = [
  { name: "Jaden Brooks", role: "Business student", location: "Evansville, IN", interests: ["Music", "Fitness", "Events"], photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80" },
  { name: "Sophie Nguyen", role: "Art student", location: "Evansville, IN", interests: ["Art", "Volunteering", "Music"], photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80" },
  { name: "Marcus Davis", role: "Computer science student", location: "Evansville, IN", interests: ["Tech", "Gaming", "Hiking"], photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80" },
  { name: "Emma Wilson", role: "Nursing student", location: "Evansville, IN", interests: ["Volunteering", "Fitness", "Outdoors"], photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80" }
];

const grid = document.getElementById("directoryGrid");
const search = document.getElementById("directorySearch");
const count = document.getElementById("resultCount");
const empty = document.getElementById("emptyMessage");
const isEvents = location.pathname.endsWith("events.html");
let items = [];

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function renderEvent(event) {
  const card = makeElement("article", "directory-event-card");
  const cover = makeElement("div", "directory-event-cover");
  cover.setAttribute("aria-hidden", "true");
  cover.append(makeElement("span", "directory-event-category", event.category || "Campus event"));
  const content = makeElement("div", "directory-event-content");
  content.append(makeElement("h3", "", event.title || "Untitled event"));
  content.append(makeElement("p", "", `📅 ${event.date || "Date to be announced"}`));
  content.append(makeElement("p", "", `📍 ${event.location || "Location to be announced"}`));
  card.append(cover, content);
  return card;
}

function renderPerson(person) {
  const card = makeElement("article", "directory-person-card");
  const image = makeElement("img", "directory-person-photo");
  image.src = person.photo;
  image.alt = `${person.name} portrait`;
  const details = makeElement("div", "directory-person-details");
  details.append(makeElement("h3", "", person.name));
  details.append(makeElement("p", "", person.role));
  details.append(makeElement("p", "directory-person-location", `📍 ${person.location}`));
  const tags = makeElement("div", "chips");
  person.interests.forEach(interest => tags.append(makeElement("span", "chip", interest)));
  details.append(tags);
  card.append(image, details);
  return card;
}

function render() {
  const term = search.value.trim().toLowerCase();
  const visible = items.filter(item => Object.values(item).flat().some(value =>
    typeof value === "string" && value.toLowerCase().includes(term)
  ));
  grid.replaceChildren(...visible.map(isEvents ? renderEvent : renderPerson));
  count.textContent = `${visible.length} ${isEvents ? "events" : "people"}`;
  empty.hidden = visible.length !== 0;
}

search.addEventListener("input", render);

if (isEvents) {
  fetch("/api/dashboard")
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => { items = Array.isArray(data.events) ? data.events : []; render(); })
    .catch(() => { items = window.dashboardData?.events || []; render(); });
} else {
  items = samplePeople;
  render();
}
