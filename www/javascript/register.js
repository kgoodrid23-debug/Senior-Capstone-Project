import {
  authenticatedFetch,
  registerUser
} from "./firebase-auth.js";

import {
  uploadImage
} from "./image-storage.js";


const registerForm =
  document.getElementById("registerForm");

const firstNameInput =
  document.getElementById("firstName");

const lastNameInput =
  document.getElementById("lastName");

const dateOfBirthInput =
  document.getElementById("dateOfBirth");

const locationInput =
  document.getElementById("location");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const confirmPasswordInput =
  document.getElementById("confirmPassword");

const profilePhotoInput =
  document.getElementById("profilePhoto");

const registerError =
  document.getElementById("registerError");

const registerButton =
  document.getElementById("registerButton");


registerForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    registerError.textContent = "";

    const password = passwordInput.value;
    const confirmedPassword =
      confirmPasswordInput.value;

    if (password !== confirmedPassword) {
      registerError.textContent =
        "The passwords do not match.";
      return;
    }

    registerButton.disabled = true;
    registerButton.textContent =
      "Creating Account...";

    try {
      /*
       * Create the Firebase Authentication account.
       * Firebase automatically signs in the new user.
       */
      await registerUser(
        emailInput.value.trim(),
        password
      );

      let profilePhotoUrl = "";

      const selectedPhoto =
        profilePhotoInput.files[0];

      /*
       * Upload the selected photo to Firebase Storage.
       * This step is skipped when no photo was selected.
       */
      if (selectedPhoto) {
        registerButton.textContent =
          "Uploading Photo...";

        const uploadedPhoto = await uploadImage(
          selectedPhoto,
          "profile-images"
        );

        profilePhotoUrl = uploadedPhoto.url;
      }

      registerButton.textContent =
        "Creating Profile...";

      /*
       * Send the profile information and generated Storage
       * URL through the authenticated profile API.
       */
      const response = await authenticatedFetch(
        getProfilesUrl(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            first_name:
              firstNameInput.value.trim(),

            last_name:
              lastNameInput.value.trim(),

            date_of_birth:
              dateOfBirthInput.value,

            location:
              locationInput.value.trim(),

            profile_photo_url:
              profilePhotoUrl
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to create profile."
        );
      }

      window.location.replace("index.html");

    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      registerError.textContent =
        getRegistrationErrorMessage(error);

    } finally {
      registerButton.disabled = false;
      registerButton.textContent =
        "Create Account";
    }
  }
);


function getProfilesUrl() {
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

  const baseUrl = String(
    configuredBase || ""
  ).replace(/\/+$/, "");

  return `${baseUrl}/api/profiles`;
}


function getRegistrationErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already uses this email.";

    case "auth/invalid-email":
      return "Enter a valid email address.";

    case "auth/weak-password":
      return "Choose a stronger password.";

    case "auth/network-request-failed":
      return "Unable to reach Firebase.";

    case "storage/unauthorized":
      return "You do not have permission to upload this image.";

    case "storage/retry-limit-exceeded":
      return "The image upload timed out. Please try again.";

    default:
      return (
        error.message ||
        "Unable to create your account."
      );
  }
}