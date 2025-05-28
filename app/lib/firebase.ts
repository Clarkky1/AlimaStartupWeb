"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

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
let storage: FirebaseStorage | null = null;

const initializeFirebase = () => {
  if (typeof window === "undefined") return { db: null, auth: null, storage: null }; // Server-side guard

  try {
    if (!app) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }

  return { app, auth, db, storage }; // Return all initialized instances
}

export const isFirebaseInitialized = () => {
  return !!app && !!auth && !!db && !!storage;
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

export const getFirebaseStorage = (): FirebaseStorage => {
  const { storage } = initializeFirebase();
  if (!storage) throw new Error("Firebase Storage not initialized");
  return storage;
}
