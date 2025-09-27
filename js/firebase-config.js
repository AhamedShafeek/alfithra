// Import the functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOwgxt4wCc05ffuZUGhb7TQ7JUFhDnhp8",
    authDomain: "alfithraschool.firebaseapp.com",
    projectId: "alfithraschool",
    storageBucket: "alfithraschool.firebasestorage.app",
    messagingSenderId: "865093944183",
    appId: "1:865093944183:web:2a2fad7c371811b6d45772"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export the configured instances
export { app, db, auth };