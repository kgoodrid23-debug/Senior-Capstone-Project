import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { auth } from "./firebase-config.js"; // This is our secrets that lets the program know which firebase application to use. It is not shared with the public and is not stored in the repository.

export async function loginUser(email, password, rememberUser) {
  const persistence = rememberUser
    ? browserLocalPersistence
    : browserSessionPersistence;

  await setPersistence(auth, persistence);

  const credential = await signInWithEmailAndPassword( // This function actually checks the email and password against Firebase
    auth,
    email,
    password
  );

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function registerUser(email, password) {
  await setPersistence(
    auth,
    browserLocalPersistence
  );

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  return credential.user;
}

export async function getAuthenticationToken() {
  const user = await waitForAuthenticatedUser();

  if (!user) {
    throw new Error("No user is currently signed in.");
  }

  return user.getIdToken();
}
export function waitForAuthenticatedUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();

        if (user) {
          resolve(user);
        } else {
          reject(new Error("User is not authenticated."));
        }
      },
      reject
    );
  });
}

export async function authenticatedFetch(url, options = {}) {
  const user = await waitForAuthenticatedUser();
  const token = await user.getIdToken(); // Gets the users firebase token which is used to verify the user is logged in and has access to the API. This token is sent with every request to the API.

  const headers = new Headers(options.headers || {});

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  return fetch(url, {
    ...options,
    headers
  });
}