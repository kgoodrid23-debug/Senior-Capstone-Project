import {
  logoutUser,
  waitForAuthenticatedUser
} from "./firebase-auth.js";


async function initializeProtectedPage() {
  try {
    await waitForAuthenticatedUser();
  } catch (error) {
    window.location.replace("login.html");
    return;
  }

  const logoutButtons = document.querySelectorAll(
    "[data-logout]"
  );

  logoutButtons.forEach((button) => {
    button.addEventListener("click", handleLogout);
  });
}


async function handleLogout() {
  try {
    await logoutUser();
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout failed:", error);
  }
}


initializeProtectedPage();