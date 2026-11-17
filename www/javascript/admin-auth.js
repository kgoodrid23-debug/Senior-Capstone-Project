import { waitForAuthenticatedUser } from "./firebase-auth.js";

async function verifyAdmin() {
  try {
    const user = await waitForAuthenticatedUser();

    if (!user) {
      window.location.replace("login.html");
      return false;
    }

    const token = await user.getIdToken();

    const response = await fetch("/api/profiles", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Unable to verify account role");
    }

    const profiles = await response.json();

    if (!Array.isArray(profiles)) {
      throw new Error("Invalid profile response");
    }

    // Find the currently authenticated user's profile
    const profile = profiles.find(
      p => p.user_id === user.uid
    );

    console.log("Current user profile:", profile);
    console.log("Current user role:", profile?.role);

    // Only administrators can access the page
    if (!profile || profile.role !== "admin") {
      window.location.replace("index.html");
      return false;
    }

    return true;

  } catch (error) {
    console.error("Admin verification failed:", error);
    window.location.replace("index.html");
    return false;
  }
}

export { verifyAdmin };
