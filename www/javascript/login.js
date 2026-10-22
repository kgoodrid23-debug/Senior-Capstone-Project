import { loginUser } from "./firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginError.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberUser = rememberInput.checked;

  try {
    await loginUser(
      email,
      password,
      rememberUser
    );

    window.location.href = "index.html";
  } catch (error) {
    console.error("Login failed:", error);

    loginError.textContent = getLoginErrorMessage(
      error.code
    );
  }
});

function getLoginErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Enter a valid email address.";

    case "auth/missing-password":
      return "Enter your password.";

    case "auth/invalid-credential":
      return "The email or password is incorrect.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Unable to reach Firebase. Check your internet connection.";

    default:
      return "Unable to sign in. Please try again.";
  }
}