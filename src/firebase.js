// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- Add this

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDYxn4C53REqX3JFYHL2rQ4W6R90IM2m20",
  authDomain: "famchat-d90e4.firebaseapp.com",
  projectId: "famchat-d90e4",
  storageBucket: "famchat-d90e4.appspot.com", // <- notice .appspot.com (correct format)
  messagingSenderId: "966418123250",
  appId: "1:966418123250:web:214332832b26462416036b",
  measurementId: "G-4D4HYSKSJ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app); // <-- Add this

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence is not available in this browser');
  }
});

export default app;
