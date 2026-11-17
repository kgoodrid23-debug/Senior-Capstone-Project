import { verifyAdmin } from "./admin-auth.js";
import { authenticatedFetch } from "./firebase-auth.js";

const table = document.getElementById("users-table");
const search = document.getElementById("user-search");
const count = document.getElementById("user-count");
const message = document.getElementById("admin-message");

let users = [];

async function initializeAdmin() {
  try {
    // Verify administrator permissions before loading anything
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    // Retrieve registered accounts
    const response = await authenticatedFetch("/api/profiles");

    if (response.status === 401 || response.status === 403) {
      window.location.replace("index.html");
      return;
    }

    if (!response.ok) throw new Error("Unable to load users.");

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid user data.");

    users = data;

    // Display admin page after successful verification
    document.querySelector(".admin-page").hidden = false;
    renderUsers(users);

  } catch (error) {
    console.error("Admin initialization failed:", error);
    message.textContent = error.message;
    document.querySelector(".admin-page").hidden = false;
  }
}

function renderUsers(list) {
  table.replaceChildren();
  count.textContent = `${list.length} accounts`;

  if (!list.length) {
    const row = table.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.textContent = "No accounts found.";
    return;
  }

  list.forEach(user => {
    const row = table.insertRow();
    const role = user.role || "user";

    row.insertCell().textContent = user.display_name || "Unknown";
    row.insertCell().textContent = role;

    // Role selection
    const select = document.createElement("select");

    ["user", "organizer", "admin"].forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    const isAdmin = role === "admin";
    select.value = isAdmin ? "user" : role;
    select.disabled = isAdmin;

    row.insertCell().appendChild(select);

    // Save role changes
    const button = document.createElement("button");
    button.textContent = "Save";
    button.disabled = isAdmin;

    button.addEventListener("click", async () => {
      if (select.value === role) return;

      button.disabled = true;
      message.textContent = "";

      try {
        const response = await authenticatedFetch(
          `/api/admin/users/${encodeURIComponent(user.user_id)}/role`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: select.value })
          }
        );

        if (response.status === 401 || response.status === 403) {
          window.location.replace("index.html");
          return;
        }

        if (!response.ok) throw new Error("Role update failed.");

        user.role = select.value;
        message.textContent = "Role updated successfully.";
        renderUsers(users.filter(matchesSearch));

      } catch (error) {
        console.error("Role update failed:", error);
        message.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });

    row.insertCell().appendChild(button);
  });
}

function matchesSearch(user) {
  const query = search.value.toLowerCase();

  return [
    user.display_name,
    user.role
  ].some(value =>
    String(value || "").toLowerCase().includes(query)
  );
}

// Search registered accounts
search.addEventListener("input", () => {
  renderUsers(users.filter(matchesSearch));
});

// Initialize admin page
initializeAdmin();