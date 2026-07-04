import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  messaging = getMessaging(app);
  
  // Safe initialization of Analytics
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized successfully.");
    } else {
      console.warn("Firebase Analytics is not supported in this environment.");
    }
  }).catch((err) => {
    console.error("Error checking Firebase Analytics support:", err);
  });
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Provide mock objects so the app doesn't crash elsewhere
  auth = {
    onAuthStateChanged: (cb) => { cb(null); return () => { }; },
    signOut: async () => { },
  };
  provider = {};
  messaging = null;
  analytics = null;
}

export { auth, provider, signInWithPopup, messaging, analytics };