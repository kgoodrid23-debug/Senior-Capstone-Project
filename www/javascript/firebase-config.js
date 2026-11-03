  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCS7x-v5DU4NW18U_KECav_ynDS16nYXyM",
    authDomain: "buddiez-and-bandz.firebaseapp.com",
    databaseURL: "https://buddiez-and-bandz-default-rtdb.firebaseio.com",
    projectId: "buddiez-and-bandz",
    storageBucket: "buddiez-and-bandz.firebasestorage.app",
    messagingSenderId: "935980744341",
    appId: "1:935980744341:web:614236d3a0bdb9a39aa59c",
    measurementId: "G-NTJNFP82RK"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig); // This spins up our firebase application
  const analytics = getAnalytics(app);
  const auth = getAuth(app);

  export { app, auth };