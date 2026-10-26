import {
  authenticatedFetch,
  registerUser
} from "./firebase-auth.js";


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
      await registerUser(
        emailInput.value.trim(),
        password
      );

      const response = await authenticatedFetch(
        getProfilesUrl(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            first_name: firstNameInput.value.trim(),
            last_name: lastNameInput.value.trim(),
            date_of_birth: dateOfBirthInput.value,
            location: locationInput.value.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create profile."
        );
      }

      window.location.replace("index.html");
    } catch (error) {
      console.error("Registration failed:", error);

      registerError.textContent =
        getRegistrationErrorMessage(error);
    } finally {
      registerButton.disabled = false;
      registerButton.textContent = "Create Account";
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
    capacitorReportsNative || looksLikeCapacitor;

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

    default:
      return error.message ||
        "Unable to create your account.";
  }
}