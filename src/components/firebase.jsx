// firebase.jsx
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_REACT_APP_FIREBASE_APP_ID
};

// Debug log in development
if (import.meta.env.DEV) {
  console.log('🔥 Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? 'Present ✅' : 'Missing ❌',
    authDomain: firebaseConfig.authDomain ? 'Present ✅' : 'Missing ❌',
    projectId: firebaseConfig.projectId ? 'Present ✅' : 'Missing ❌',
    storageBucket: firebaseConfig.storageBucket ? 'Present ✅' : 'Missing ❌',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Present ✅' : 'Missing ❌',
    appId: firebaseConfig.appId ? 'Present ✅' : 'Missing ❌'
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set language
auth.languageCode = 'vi'; // Vietnamese or 'en' for English

export default app;