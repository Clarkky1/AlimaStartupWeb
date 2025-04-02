"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, signOut, Auth } from "firebase/auth";
import { doc, getDoc, setDoc, Firestore } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDB, isFirebaseInitialized, initializeFirebase } from "@/app/lib/firebase";

interface User {
  uid: string;
  email: string | null;
  name?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  db: Firestore | null;
  auth: Auth | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // Check if Firebase is initialized and initialize it if not
    if (!isFirebaseInitialized()) {
      const { auth: authInstance, db: dbInstance } = initializeFirebase(); // Initialize and get values
      setAuth(authInstance);
      setDb(dbInstance);
    }

    const authInstance = getFirebaseAuth();
    const dbInstance = getFirestoreDB();
    setAuth(authInstance);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(dbInstance, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Anonymous",
          role: "client",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Anonymous",
          profilePicture: firebaseUser.photoURL || null,
          bio: "",
          phone: "",
          location: "",
          lastUpdated: new Date().toISOString(),
          ...userDoc.exists() ? userDoc.data() : {},
        };

        setUser(userData);
        await setDoc(userRef, userData, { merge: true });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect only runs once when the component mounts

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, db, auth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
