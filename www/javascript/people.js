import {
  authenticatedFetch,
  waitForAuthenticatedUser
} from "./firebase-auth.js";


let currentUserId = "";
let allProfiles = [];
let allConnections = [];


document.addEventListener(
  "DOMContentLoaded",
  initializePeoplePage
);


async function initializePeoplePage() {
  const searchInput =
    document.getElementById("directorySearch");

  try {
    const authenticatedUser =
      await waitForAuthenticatedUser();

    currentUserId = authenticatedUser.uid;

    await loadPeopleData();

    searchInput?.addEventListener(
      "input",
      renderFilteredProfiles
    );
  } catch (error) {
    console.error(
      "Unable to load People page:",
      error
    );

    showPageError(
      "Unable to load people right now."
    );
  }
}


async function loadPeopleData() {
  const profilesUrl = getApiUrl(
    "/api/profiles"
  );

  const connectionsUrl = getApiUrl(
    `/api/users/${encodeURIComponent(
      currentUserId
    )}/connections`
  );

  const [
    profilesResponse,
    connectionsResponse
  ] = await Promise.all([
    authenticatedFetch(profilesUrl, {
      headers: {
        Accept: "application/json"
      }
    }),

    authenticatedFetch(connectionsUrl, {
      headers: {
        Accept: "application/json"
      }
    })
  ]);

  if (!profilesResponse.ok) {
    throw new Error(
      `Profiles request failed: HTTP ${
        profilesResponse.status
      }`
    );
  }

  if (!connectionsResponse.ok) {
    throw new Error(
      `Connections request failed: HTTP ${
        connectionsResponse.status
      }`
    );
  }

  const profiles = await profilesResponse.json();
  const connections =
    await connectionsResponse.json();

  allProfiles = Array.isArray(profiles)
    ? profiles.filter((profile) => {
        return (
          profile.user_id !== currentUserId &&
          profile.is_active !== false
        );
      })
    : [];

  allConnections = Array.isArray(connections)
    ? connections
    : [];

  renderFilteredProfiles();
}


function renderFilteredProfiles() {
  const searchInput =
    document.getElementById("directorySearch");

  const searchText = String(
    searchInput?.value || ""
  )
    .trim()
    .toLowerCase();

  const filteredProfiles = allProfiles.filter(
    (profile) => {
      if (!searchText) {
        return true;
      }

      const searchableValues = [
        profile.display_name,
        profile.location,
        profile.bio,
        ...(Array.isArray(profile.interests)
          ? profile.interests
          : [])
      ];

      return searchableValues.some((value) => {
        return String(value || "")
          .toLowerCase()
          .includes(searchText);
      });
    }
  );

  renderProfiles(filteredProfiles);
}


function renderProfiles(profiles) {
  const grid =
    document.getElementById("directoryGrid");

  const resultCount =
    document.getElementById("resultCount");

  const emptyMessage =
    document.getElementById("emptyMessage");

  if (!grid) {
    return;
  }

  grid.replaceChildren();

  if (resultCount) {
    resultCount.textContent =
      `${profiles.length} ${
        profiles.length === 1
          ? "person"
          : "people"
      }`;
  }

  if (emptyMessage) {
    emptyMessage.hidden =
      profiles.length !== 0;
  }

  profiles.forEach((profile) => {
    grid.appendChild(
      createProfileCard(profile)
    );
  });
}


function createProfileCard(profile) {
  const card = document.createElement("article");

  card.className =
    "card person-card directory-person-card";

  card.dataset.userId = String(
    profile.user_id || ""
  );

  const photoContainer =
    document.createElement("div");

  photoContainer.className =
    "person-photo-container";

  if (profile.profile_photo_url) {
    const photo = document.createElement("img");

    photo.className =
      "person-photo person-avatar";

    photo.src = profile.profile_photo_url;
    photo.alt =
      `${profile.display_name || "User"} profile`;

    photoContainer.appendChild(photo);
  } else {
    const placeholder =
      document.createElement("div");

    placeholder.className =
      "person-photo person-avatar person-avatar-placeholder";

    placeholder.textContent = getInitial(
      profile.display_name
    );

    photoContainer.appendChild(placeholder);
  }

  const content =
    document.createElement("div");

  content.className =
    "person-content person-card-body";

  const name = document.createElement("h3");

  name.textContent =
    profile.display_name || "Unnamed user";

  const location = document.createElement("p");

  location.className = "person-location";

  location.textContent = profile.location
    ? `📍 ${profile.location}`
    : "Location unavailable";

  const bio = document.createElement("p");

  bio.className = "person-bio";
  bio.textContent =
    profile.bio || "No bio provided.";

  const interests =
    document.createElement("div");

  interests.className =
    "person-interests chips";

  const interestList = Array.isArray(
    profile.interests
  )
    ? profile.interests
    : [];

  interestList.forEach((interest) => {
    const badge =
      document.createElement("span");

    badge.className = "badge chip";
    badge.textContent = String(interest);

    interests.appendChild(badge);
  });

  const connectionButton =
    createConnectionButton(profile);

  content.append(
    name,
    location,
    bio,
    interests,
    connectionButton
  );

  card.append(
    photoContainer,
    content
  );

  return card;
}


function createConnectionButton(profile) {
  const button = document.createElement("button");

  button.className =
    "btn btn--primary connection-button";

  button.type = "button";

  const connection = findConnection(
    profile.user_id
  );

  updateConnectionButton(
    button,
    connection
  );

  if (canSendConnectionRequest(connection)) {
    button.addEventListener(
      "click",
      async () => {
        await sendConnectionRequest(
          profile.user_id,
          button
        );
      }
    );
  }

  return button;
}


function findConnection(otherUserId) {
  return allConnections.find((connection) => {
    const requesterId =
      connection.requester_user_id;

    const recipientId =
      connection.recipient_user_id;

    return (
      (
        requesterId === currentUserId &&
        recipientId === otherUserId
      ) ||
      (
        requesterId === otherUserId &&
        recipientId === currentUserId
      )
    );
  });
}


function updateConnectionButton(
  button,
  connection
) {
  button.disabled = false;

  if (!connection) {
    button.textContent = "Connect";
    return;
  }

  if (connection.status === "accepted") {
    button.textContent = "Connected ✓";
    button.disabled = true;
    return;
  }

  if (connection.status === "pending") {
    const wasSentByCurrentUser =
      connection.requester_user_id ===
      currentUserId;

    button.textContent = wasSentByCurrentUser
      ? "Pending"
      : "Request Received";

    button.disabled = true;
    return;
  }

  if (connection.status === "declined") {
    button.textContent = "Connect";
    return;
  }

  button.textContent = "Connect";
}


function canSendConnectionRequest(connection) {
  return (
    !connection ||
    connection.status === "declined"
  );
}


async function sendConnectionRequest(
  recipientUserId,
  button
) {
  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const response = await authenticatedFetch(
      getApiUrl("/api/connections"),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_user_id: recipientUserId
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        `HTTP ${response.status}`
      );
    }

    replaceOrAddConnection(result);

    updateConnectionButton(
      button,
      result
    );
  } catch (error) {
    console.error(
      "Unable to send connection request:",
      error
    );

    button.disabled = false;
    button.textContent = "Connect";

    alert(
      "Unable to send the connection request."
    );
  }
}


function replaceOrAddConnection(newConnection) {
  const existingIndex =
    allConnections.findIndex((connection) => {
      return (
        connection.document_id ===
          newConnection.document_id ||
        connection.connection_id ===
          newConnection.connection_id
      );
    });

  if (existingIndex >= 0) {
    allConnections[existingIndex] =
      newConnection;
  } else {
    allConnections.push(newConnection);
  }
}


function getInitial(displayName) {
  const name = String(
    displayName || ""
  ).trim();

  return name
    ? name.charAt(0).toUpperCase()
    : "?";
}


function showPageError(messageText) {
  const grid =
    document.getElementById("directoryGrid");

  const emptyMessage =
    document.getElementById("emptyMessage");

  const resultCount =
    document.getElementById("resultCount");

  if (grid) {
    grid.replaceChildren();
  }

  if (resultCount) {
    resultCount.textContent = "";
  }

  if (emptyMessage) {
    emptyMessage.textContent = messageText;
    emptyMessage.hidden = false;
  }
}


function getApiBaseUrl() {
  const config = window.APP_CONFIG || {};

  const capacitorReportsNative =
    typeof window.Capacitor?.isNativePlatform ===
      "function" &&
    window.Capacitor.isNativePlatform();

  const looksLikeCapacitor =
    window.location.hostname === "localhost" &&
    !window.location.port &&
    ["capacitor:", "https:"].includes(
      window.location.protocol
    );

  const isNative =
    capacitorReportsNative ||
    looksLikeCapacitor;

  const configuredBase = isNative
    ? config.NATIVE_API_BASE_URL
    : config.WEB_API_BASE_URL;

  return String(
    configuredBase || ""
  ).replace(/\/+$/, "");
}


function getApiUrl(path) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${getApiBaseUrl()}${normalizedPath}`;
}