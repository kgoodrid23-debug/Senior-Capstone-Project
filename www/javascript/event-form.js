import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  auth
} from "./firebase-config.js";

import {
  uploadImage
} from "./image-storage.js";


/* ---------------------------------------------------------
   Page elements and configuration
   --------------------------------------------------------- */

const form =
  document.getElementById("event-form");

const statusElement =
  document.getElementById("event-form-status");

const submitButton =
  document.getElementById("event-submit");

const eventImageInput =
  document.getElementById("event_image");

const eventImagePreview =
  document.getElementById("event-image-preview");

const isEditing =
  document.body.dataset.eventMode === "edit";

const eventId =
  new URLSearchParams(
    window.location.search
  ).get("id");

let currentUser = null;
let currentEvent = null;
let canManageEvent = false;
let isLoading = true;
let previewObjectUrl = null;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const eventFields = [
  "title",
  "description",
  "category",
  "start_time",
  "end_time",
  "location"
];


/* ---------------------------------------------------------
   UI helpers
   --------------------------------------------------------- */

function showStatus(
  message,
  isError = false
) {
  if (!statusElement) return;

  statusElement.textContent = message;

  statusElement.classList.toggle(
    "error",
    isError
  );
}


function updateSubmitButton() {
  if (!submitButton) return;

  submitButton.disabled =
    isLoading || !canManageEvent;

  if (isLoading) {
    submitButton.textContent =
      "Please wait...";
  } else if (isEditing) {
    submitButton.textContent =
      "Save Changes";
  } else {
    submitButton.textContent =
      "Create Event";
  }
}


function setLoading(loading) {
  isLoading = loading;
  updateSubmitButton();
}


function redirectToLogin() {
  const next =
    window.location.pathname +
    window.location.search;

  window.location.replace(
    `login.html?next=${encodeURIComponent(next)}`
  );
}


/* ---------------------------------------------------------
   Image helpers
   --------------------------------------------------------- */

function validateImageFile(file) {
  if (!file) return;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "The event image must be a JPG, PNG, or WebP file."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "The event image must be smaller than 5 MB."
    );
  }
}


function clearTemporaryPreviewUrl() {
  if (!previewObjectUrl) return;

  URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
}


function showImagePreview(imageSource) {
  if (!eventImagePreview) return;

  if (!imageSource) {
    eventImagePreview.removeAttribute("src");
    eventImagePreview.hidden = true;
    return;
  }

  eventImagePreview.src = imageSource;
  eventImagePreview.hidden = false;
}


function handleImageSelection() {
  try {
    const selectedImage =
      eventImageInput?.files?.[0];

    if (!selectedImage) {
      clearTemporaryPreviewUrl();

      showImagePreview(
        currentEvent?.image_url || ""
      );

      return;
    }

    validateImageFile(selectedImage);
    clearTemporaryPreviewUrl();

    previewObjectUrl =
      URL.createObjectURL(selectedImage);

    showImagePreview(previewObjectUrl);
    showStatus("");
  } catch (error) {
    console.error(
      "Event image selection failed:",
      error
    );

    if (eventImageInput) {
      eventImageInput.value = "";
    }

    clearTemporaryPreviewUrl();

    showImagePreview(
      currentEvent?.image_url || ""
    );

    showStatus(error.message, true);
  }
}


eventImageInput?.addEventListener(
  "change",
  handleImageSelection
);


/* ---------------------------------------------------------
   Authenticated API requests
   --------------------------------------------------------- */

async function apiRequest(
  endpoint,
  options = {}
) {
  if (!currentUser) {
    throw new Error(
      "You must be logged in."
    );
  }

  const token =
    await currentUser.getIdToken();

  const response = await fetch(
    endpoint,
    {
      ...options,

      headers: {
        Accept: "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json"
            }
          : {}),

        Authorization:
          `Bearer ${token}`,

        ...options.headers
      }
    }
  );

  const payload =
    await response.json().catch(
      () => null
    );

  if (!response.ok) {
    throw new Error(
      payload?.error ||
      payload?.details ||
      payload?.message ||
      `HTTP ${response.status}`
    );
  }

  return payload;
}


/* ---------------------------------------------------------
   Date helpers
   --------------------------------------------------------- */

function toLocalDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) =>
    String(number).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}


function toISOString(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "Invalid event date or time."
    );
  }

  return date.toISOString();
}


/* ---------------------------------------------------------
   Form helpers
   --------------------------------------------------------- */

function populateForm(event) {
  for (const field of eventFields) {
    const input =
      form.elements.namedItem(field);

    if (!input) continue;

    let value =
      event[field] ?? "";

    if (field === "start_time") {
      value = toLocalDateTimeInput(
        event.start_time || event.date
      );
    }

    if (field === "end_time") {
      value = toLocalDateTimeInput(
        event.end_time
      );
    }

    input.value = value;
  }

  showImagePreview(
    event.image_url || ""
  );
}


function collectFormData() {
  const data = {};

  for (const field of eventFields) {
    const input =
      form.elements.namedItem(field);

    data[field] = input
      ? input.value.trim()
      : "";
  }

  data.start_time =
    toISOString(data.start_time);

  if (data.end_time) {
    data.end_time =
      toISOString(data.end_time);
  }

  data.description =
    data.description || "";

  data.category =
    data.category || "Event";

  data.end_time =
    data.end_time || "";

  // Keep the existing image while editing unless
  // the user selects a replacement.
  data.image_url =
    currentEvent?.image_url || "";

  return data;
}


function validateEvent(data) {
  if (!data.title) {
    throw new Error(
      "Event title is required."
    );
  }

  if (!data.start_time) {
    throw new Error(
      "Event start time is required."
    );
  }

  if (!data.location) {
    throw new Error(
      "Event location is required."
    );
  }

  if (
    data.end_time &&
    new Date(data.end_time) <=
      new Date(data.start_time)
  ) {
    throw new Error(
      "Event end time must be later than start time."
    );
  }
}


/* ---------------------------------------------------------
   Organizer permissions
   --------------------------------------------------------- */

async function verifyOrganizer() {
  const dashboard =
    await apiRequest("/api/dashboard");

  const profile =
    dashboard?.profile;

  if (!profile) {
    throw new Error(
      "Unable to retrieve your profile."
    );
  }

  if (
    String(profile.role || "")
      .toLowerCase() !== "organizer"
  ) {
    throw new Error(
      "Only organizers can create or edit events."
    );
  }

  return profile;
}


function verifyEventOwnership(event) {
  if (!currentUser) {
    throw new Error(
      "You must be logged in."
    );
  }

  if (
    event.created_by_user_id !==
    currentUser.uid
  ) {
    throw new Error(
      "You can only edit events you created."
    );
  }

  if (event.is_active === false) {
    throw new Error(
      "Cancelled events cannot be edited."
    );
  }
}


/* ---------------------------------------------------------
   Load an existing event
   --------------------------------------------------------- */

async function loadEvent() {
  if (!eventId) {
    throw new Error(
      "No event ID was provided in the URL."
    );
  }

  showStatus("Loading event...");

  const payload = await apiRequest(
    `/api/events/${encodeURIComponent(eventId)}`
  );

  const event =
    payload?.event ?? payload;

  if (
    !event ||
    typeof event !== "object" ||
    Array.isArray(event) ||
    !event.event_id
  ) {
    throw new Error(
      "The API did not return a valid event."
    );
  }

  verifyEventOwnership(event);

  currentEvent = event;
  populateForm(event);
}


/* ---------------------------------------------------------
   Initialize page
   --------------------------------------------------------- */

async function initializePage(user) {
  currentUser = user;
  currentEvent = null;
  canManageEvent = false;

  setLoading(true);

  if (!user) {
    redirectToLogin();
    return;
  }

  try {
    showStatus(
      "Checking organizer permissions..."
    );

    await verifyOrganizer();

    if (isEditing) {
      await loadEvent();
    }

    canManageEvent = true;
    showStatus("");
  } catch (error) {
    console.error(
      "Event form initialization failed:",
      error
    );

    canManageEvent = false;
    showStatus(error.message, true);
  } finally {
    setLoading(false);
  }
}


/* ---------------------------------------------------------
   Create or update event
   --------------------------------------------------------- */

form.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (
      !currentUser ||
      !canManageEvent ||
      isLoading
    ) {
      return;
    }

    try {
      const eventData =
        collectFormData();

      validateEvent(eventData);

      const selectedImage =
        eventImageInput?.files?.[0];

      if (selectedImage) {
        validateImageFile(selectedImage);
      }

      setLoading(true);

      if (selectedImage) {
        showStatus(
          "Uploading event image..."
        );

        const uploadedImage =
          await uploadImage(
            selectedImage,
            "event-images"
          );

        eventData.image_url =
          typeof uploadedImage === "string"
            ? uploadedImage
            : uploadedImage.url;

        if (!eventData.image_url) {
          throw new Error(
            "The image uploaded, but no download URL was returned."
          );
        }
      }

      showStatus(
        isEditing
          ? "Saving event changes..."
          : "Creating event..."
      );

      const endpoint = isEditing
        ? `/api/events/${encodeURIComponent(eventId)}`
        : "/api/events";

      const method =
        isEditing ? "PUT" : "POST";

      const payload = await apiRequest(
        endpoint,
        {
          method,
          body: JSON.stringify(eventData)
        }
      );

      const savedEvent =
        payload?.event ?? payload;

      const savedEventId =
        savedEvent?.event_id ||
        savedEvent?.document_id ||
        (isEditing ? eventId : null);

      showStatus(
        isEditing
          ? "Event updated successfully."
          : "Event created successfully."
      );

      clearTemporaryPreviewUrl();

      window.location.href =
        savedEventId
          ? (
              "event-description.html?id=" +
              encodeURIComponent(savedEventId)
            )
          : "organizers.html";
    } catch (error) {
      console.error(
        "Event save failed:",
        error
      );

      showStatus(
        error.message,
        true
      );

      setLoading(false);
    }
  }
);


/* ---------------------------------------------------------
   Firebase authentication listener
   --------------------------------------------------------- */

onAuthStateChanged(
  auth,
  (user) => initializePage(user)
);