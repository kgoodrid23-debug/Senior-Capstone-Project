import {
  authenticatedFetch
} from "./firebase-auth.js";

import {
  uploadImage
} from "./image-storage.js";


const form =
  document.getElementById("edit-form");

const firstNameInput =
  document.getElementById("first");

const lastNameInput =
  document.getElementById("last");

const dateOfBirthInput =
  document.getElementById("dateOfBirth");

const locationInput =
  document.getElementById("location");

const bioInput =
  document.getElementById("bio");

const profilePhotoInput =
  document.getElementById("profilePhoto");

const headerLocation =
  document.getElementById("header-location");

const saveButton =
  form?.querySelector('button[type="submit"]');

let currentProfile = null;


document.addEventListener(
  "DOMContentLoaded",
  initializeEditProfilePage
);


async function initializeEditProfilePage() {
  if (!form) {
    console.error(
      "Could not find #edit-form."
    );

    return;
  }

  if (
    !firstNameInput ||
    !lastNameInput ||
    !dateOfBirthInput ||
    !locationInput ||
    !bioInput
  ) {
    showError(
      "The edit-profile form is missing a required field."
    );

    return;
  }

  form.addEventListener(
    "submit",
    saveProfile
  );

  await loadProfile();
}


async function loadProfile() {
  setFormBusy(true, "Loading Profile...");

  try {
    const response = await authenticatedFetch(
      getApiUrl("/api/dashboard"),
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await readJsonResponse(
      response
    );

    if (!response.ok) {
      throw new Error(
        data.error ||
        `Unable to load profile: HTTP ${response.status}`
      );
    }

    if (!data.profile) {
      throw new Error(
        "No profile was found for this account."
      );
    }

    currentProfile = data.profile;

    fillForm(currentProfile);
  } catch (error) {
    console.error(
      "Unable to load profile:",
      error
    );

    showError(
      error.message ||
      "Unable to load your profile."
    );
  } finally {
    setFormBusy(false);
  }
}


function fillForm(profile) {
  const {
    firstName,
    lastName
  } = splitDisplayName(
    profile.display_name
  );

  firstNameInput.value = firstName;
  lastNameInput.value = lastName;

  dateOfBirthInput.value =
    formatDateForInput(
      profile.date_of_birth
    );

  locationInput.value =
    profile.location || "";

  bioInput.value =
    profile.bio || "";

  if (headerLocation) {
    headerLocation.textContent =
      profile.location ||
      "Evansville, IN";
  }

  fillInterests(profile.interests);
}


function splitDisplayName(displayName) {
  const nameParts = String(
    displayName || ""
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName =
    nameParts.shift() || "";

  const lastName =
    nameParts.join(" ");

  return {
    firstName,
    lastName
  };
}


function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  const dateText = String(value);

  /*
   * The API normally returns YYYY-MM-DD.
   * This also handles a longer ISO date.
   */
  if (
    /^\d{4}-\d{2}-\d{2}/.test(
      dateText
    )
  ) {
    return dateText.slice(0, 10);
  }

  const parsedDate = new Date(dateText);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  const year =
    parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function fillInterests(interests) {
  const selectedInterests =
    Array.isArray(interests)
      ? interests.map((interest) => {
          return String(interest)
            .trim()
            .toLowerCase();
        })
      : [];

  document
    .querySelectorAll(
      'input[name="tag"]'
    )
    .forEach((checkbox) => {
      checkbox.checked =
        selectedInterests.includes(
          checkbox.value
            .trim()
            .toLowerCase()
        );
    });
}


async function saveProfile(event) {
  event.preventDefault();

  clearError();

  const firstName =
    firstNameInput.value.trim();

  const lastName =
    lastNameInput.value.trim();

  const dateOfBirth =
    dateOfBirthInput.value;

  const location =
    locationInput.value.trim();

  const bio =
    bioInput.value.trim();

  if (!firstName || !lastName) {
    showError(
      "First name and last name are required."
    );

    return;
  }

  if (!dateOfBirth) {
    showError(
      "Date of birth is required."
    );

    return;
  }

  if (!location) {
    showError(
      "Location is required."
    );

    return;
  }

  const selectedInterests =
    getSelectedInterests();

  const profileData = {
    display_name:
      `${firstName} ${lastName}`
        .trim()
        .slice(0, 100),

    date_of_birth:
      dateOfBirth,

    location:
      location.slice(0, 255),

    bio,

    interests:
      selectedInterests
  };

  setFormBusy(
    true,
    "Saving Changes..."
  );

  try {
    const selectedPhoto =
      profilePhotoInput?.files?.[0];

    /*
     * Only send profile_photo_url when the user
     * selected a replacement photo. Otherwise,
     * the existing URL stays unchanged.
     */
    if (selectedPhoto) {
      setFormBusy(
        true,
        "Uploading Photo..."
      );

      const uploadedPhoto =
        await uploadImage(
          selectedPhoto,
          "profile-images"
        );

      profileData.profile_photo_url =
        uploadedPhoto.url;
    }

    setFormBusy(
      true,
      "Saving Changes..."
    );

    const response =
      await authenticatedFetch(
        getApiUrl("/api/profiles"),
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(
            profileData
          )
        }
      );

    const data = await readJsonResponse(
      response
    );

    if (!response.ok) {
      throw new Error(
        data.error ||
        `Unable to save profile: HTTP ${response.status}`
      );
    }

    window.location.replace(
      "profile.html"
    );
  } catch (error) {
    console.error(
      "Unable to save profile:",
      error
    );

    showError(
      error.message ||
      "Unable to save your profile."
    );
  } finally {
    setFormBusy(false);
  }
}


function getSelectedInterests() {
  const interestNames = {
    fitness: "Fitness",
    volleyball: "Volleyball",
    church: "Church",
    music: "Music"
  };

  return Array.from(
    document.querySelectorAll(
      'input[name="tag"]:checked'
    )
  ).map((checkbox) => {
    const value = String(
      checkbox.value
    )
      .trim()
      .toLowerCase();

    return (
      interestNames[value] ||
      checkbox.value
    );
  });
}


function getApiUrl(endpoint) {
  const config =
    window.APP_CONFIG || {};

  const capacitorReportsNative =
    typeof window.Capacitor
      ?.isNativePlatform ===
      "function" &&
    window.Capacitor.isNativePlatform();

  const looksLikeCapacitor =
    window.location.hostname ===
      "localhost" &&
    !window.location.port &&
    [
      "capacitor:",
      "https:"
    ].includes(
      window.location.protocol
    );

  const isNative =
    capacitorReportsNative ||
    looksLikeCapacitor;

  const configuredBase = isNative
    ? config.NATIVE_API_BASE_URL
    : config.WEB_API_BASE_URL;

  const baseUrl = String(
    configuredBase || ""
  ).replace(/\/+$/, "");

  return `${baseUrl}${endpoint}`;
}


async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}


function setFormBusy(
  isBusy,
  buttonText = "Save Changes"
) {
  form
    ?.querySelectorAll(
      "input, textarea, button"
    )
    .forEach((element) => {
      element.disabled = isBusy;
    });

  if (saveButton) {
    saveButton.textContent =
      isBusy
        ? buttonText
        : "Save Changes";
  }
}


function getErrorElement() {
  let errorElement =
    document.getElementById(
      "editProfileError"
    );

  if (!errorElement && form) {
    errorElement =
      document.createElement("p");

    errorElement.id =
      "editProfileError";

    errorElement.className =
      "form-error";

    errorElement.setAttribute(
      "role",
      "alert"
    );

    errorElement.setAttribute(
      "aria-live",
      "polite"
    );

    const buttonGroup =
      form.querySelector(
        ".button-group"
      );

    if (buttonGroup) {
      form.insertBefore(
        errorElement,
        buttonGroup
      );
    } else {
      form.appendChild(
        errorElement
      );
    }
  }

  return errorElement;
}


function showError(message) {
  const errorElement =
    getErrorElement();

  if (errorElement) {
    errorElement.textContent =
      message;
  }
}


function clearError() {
  const errorElement =
    document.getElementById(
      "editProfileError"
    );

  if (errorElement) {
    errorElement.textContent = "";
  }
}