import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA35QIZWyTakO65DPnZjxZKOvYz3BppGHI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fusion-forge-28cae.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fusion-forge-28cae",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fusion-forge-28cae.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "410308832496",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:410308832496:web:91bb68c90c2b3ab0c40035",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D4FZSZLJ63"
};

// Only log in development
if (import.meta.env.DEV) {
  console.log('Firebase config loaded:', {
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId,
    authDomain: firebaseConfig.authDomain
  });
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

if (import.meta.env.DEV) {
  console.log('Firebase initialized successfully');
}

export default app;