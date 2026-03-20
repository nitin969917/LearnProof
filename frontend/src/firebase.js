// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: "learnproof.firebaseapp.com",
  projectId: "learnproof",
  storageBucket: "learnproof.firebasestorage.app",
  messagingSenderId: "74980993962",
  appId: "1:74980993962:web:6982678c8b00970b08d9d3"
};


// Initialize Firebase
let app;
let auth;
let provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Provide mock objects so the app doesn't crash elsewhere
  auth = {
    onAuthStateChanged: (cb) => { cb(null); return () => { }; },
    signOut: async () => { },
  };
  provider = {};
}

export { auth, provider, signInWithPopup };