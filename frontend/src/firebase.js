import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: "learnproof-b24c7.firebaseapp.com",
  projectId: "learnproof-b24c7",
  storageBucket: "learnproof-b24c7.firebasestorage.app",
  messagingSenderId: "549492309059",
  appId: "1:549492309059:web:168f96fc2164fdaef668f6"
};


// Initialize Firebase
let app;
let auth;
let provider;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  messaging = getMessaging(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Provide mock objects so the app doesn't crash elsewhere
  auth = {
    onAuthStateChanged: (cb) => { cb(null); return () => { }; },
    signOut: async () => { },
  };
  provider = {};
  messaging = null;
}

export { auth, provider, signInWithPopup, messaging };