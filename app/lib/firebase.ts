// "use client"

// import { initializeApp, getApps, getApp } from "firebase/app"
// import { getAuth } from "firebase/auth"
// import { getFirestore } from "firebase/firestore"

// // Your Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// }

// // Initialize Firebase
// let app
// let auth
// let db

// if (typeof window !== "undefined") {
//   try {
//     app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
//     auth = getAuth(app)
//     db = getFirestore(app)
//   } catch (error) {
//     console.error("Error initializing Firebase:", error)
//   }
// }

// // Helper function to check if Firebase is initialized
// export const isFirebaseInitialized = () => {
//   return typeof window !== "undefined" && getApps().length > 0
// }

// // Export initialized instances
// export { auth, db }

// // Initialize Firebase function that can be called on demand
// export async function initializeFirebase() {
//   try {
//     // Check if Firebase app is already initialized
//     let app
//     if (getApps().length === 0) {
//       app = initializeApp(firebaseConfig)
//     } else {
//       app = getApp()
//     }

//     const auth = getAuth(app)
//     const db = getFirestore(app)

//     return { app, auth, db }
//   } catch (error) {
//     console.error("Error initializing Firebase:", error)
//     return { app: null, auth: null, db: null }
//   }
// }


"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize with explicit types and null checks
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const initializeFirebase = () => {
  if (typeof window === "undefined") return { db: null, auth: null }; // Server-side guard

  try {
    if (!app) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }

  return { auth, db }; // Return both auth and db
}

export const isFirebaseInitialized = () => {
  return !!app && !!auth && !!db;
}

// Export getters with type assertions
export const getFirebaseAuth = (): Auth => {
  const { auth } = initializeFirebase();
  if (!auth) throw new Error("Firebase Auth not initialized");
  return auth;
}

export const getFirestoreDB = (): Firestore => {
  const { db } = initializeFirebase();
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export { initializeFirebase };
