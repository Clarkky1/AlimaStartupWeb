"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, signOut, Auth } from "firebase/auth";
import { doc, getDoc, setDoc, Firestore, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDB, isFirebaseInitialized, initializeFirebase } from "@/app/lib/firebase";
import { useNetworkStatus } from "@/app/context/network-status-context";

// Function to clear Firebase auth state from local storage
export function clearAuthState() {
  if (typeof window !== "undefined") {
    // Clear Firebase auth data from local storage
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('firebase:auth'))
      .forEach(key => {
        window.localStorage.removeItem(key);
      });
  }
}

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
  lastLogin?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  db: Firestore | null;
  auth: Auth | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const { isOnline } = useNetworkStatus();

  // Initialize page load counter on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if this is a manual refresh (F5/browser refresh)
      const isManualRefresh = performance?.navigation?.type === 1 || 
                             (window.performance && 
                              window.performance.getEntriesByType && 
                              window.performance.getEntriesByType("navigation").length > 0 &&
                              window.performance.getEntriesByType("navigation")[0] &&
                              (window.performance.getEntriesByType("navigation")[0] as any).type === "reload");
      
      // Store this information for the auth state handler
      if (isManualRefresh) {
        sessionStorage.setItem('manual_refresh', 'true');
      } else {
        sessionStorage.setItem('manual_refresh', 'false');
      }

      // Initialize or increment the page load counter
      const pageLoadCount = sessionStorage.getItem('page_load_count') || '0';
      const newCount = parseInt(pageLoadCount) + 1;
      sessionStorage.setItem('page_load_count', newCount.toString());
      
      console.log("Page initialized. Load count:", newCount, "Manual refresh:", isManualRefresh);
    }
  }, []);

  // Function to fetch and refresh user data from Firestore
  const refreshUserData = async () => {
    if (!user?.uid || !db || !isOnline) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Add cache busting to avatar/profile picture URLs
        let avatarUrl = userData.profilePicture || userData.avatar || user.avatar;
        if (avatarUrl) {
          // Generate a unique timestamp for this refresh
          const uniqueTimestamp = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
          
          // Add timestamp to prevent browser caching
          avatarUrl = avatarUrl.includes('?') 
            ? `${avatarUrl.split('?')[0]}?t=${uniqueTimestamp}&forceReload=true` 
            : `${avatarUrl}?t=${uniqueTimestamp}&forceReload=true`;
            
          // Try to preload the image to force browser to load the new version
          if (typeof window !== 'undefined' && isOnline) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = avatarUrl;
            document.head.appendChild(preloadLink);
            
            // Also create a hidden img element to force loading
            const hiddenImg = document.createElement('img');
            hiddenImg.src = avatarUrl;
            hiddenImg.style.display = 'none';
            hiddenImg.crossOrigin = 'anonymous';
            document.body.appendChild(hiddenImg);
            
            // Remove after loading
            hiddenImg.onload = () => {
              document.body.removeChild(hiddenImg);
              // Once loaded, update any profile images in the DOM
              const profileImages = document.querySelectorAll('img[alt*="Profile"], img[alt*="profile"], img[alt*="Avatar"], img[alt*="avatar"]');
              profileImages.forEach(img => {
                if (img instanceof HTMLImageElement) {
                  img.src = avatarUrl;
                }
              });
            };
          }
        }
        
        // Update user state with fresh data
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...userData,
            // Explicitly map profile picture fields with cache busting
            avatar: avatarUrl,
            profilePicture: userData.profilePicture, // Original URL in DB
            // Keep required fields
            uid: prev.uid,
            email: prev.email,
          };
        });
        
        // Update localStorage cache if needed
        if (typeof window !== 'undefined') {
          if (avatarUrl) {
            localStorage.setItem(`avatar_${user.uid}`, avatarUrl);
          }
          if (userData.name || userData.displayName) {
            localStorage.setItem(`name_${user.uid}`, userData.name || userData.displayName);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

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

    // Set persistence to LOCAL by default to support "Remember me" functionality
    const setPersistenceOnce = async () => {
      try {
        // Only import and set persistence if we're in a browser environment
        if (typeof window !== "undefined") {
          const { setPersistence, browserLocalPersistence } = await import("firebase/auth");
          
          // Always use LOCAL persistence to prevent logout on refresh
          await setPersistence(authInstance, browserLocalPersistence);
          console.log("Firebase persistence set to LOCAL");
        }
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }
    };

    // Set persistence before listening for auth state changes
    setPersistenceOnce();

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Log auth state for debugging
        console.log("Auth state detected, user:", firebaseUser.uid);
        
        // Get the stored user ID to compare
        const storedUserId = localStorage.getItem('currentLoggedInUser');
        
        // Get session info to determine if this is actually a new login
        // or just a page refresh with the same user
        const sessionPageLoads = sessionStorage.getItem('page_load_count') || '0';
        const isFirstLoadInSession = parseInt(sessionPageLoads) === 0;
        
        // Only consider it a new login if:
        // 1. We have no user in state OR 
        // 2. The user ID changed OR
        // 3. This is the first load in the session AND we have no stored user ID
        const isNewLogin = !user || 
                          (user.uid !== firebaseUser.uid) || 
                          (isFirstLoadInSession && !storedUserId && firebaseUser.uid);
        
        const userRef = doc(dbInstance, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        // Get current timestamp for lastLogin
        const now = new Date().toISOString();

        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Anonymous",
          role: "client",
          createdAt: new Date().toISOString(),
          updatedAt: now,
          lastLogin: now,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Anonymous",
          profilePicture: firebaseUser.photoURL || null,
          bio: "",
          phone: "",
          location: "",
          lastUpdated: now,
          ...userDoc.exists() ? userDoc.data() : {},
        };
        
        // Always update lastLogin field regardless of existing data
        userData.lastLogin = now;

        // Prioritize and ensure profile picture is properly set
        userData.avatar = userData.profilePicture || userData.avatar || null;
        
        // Cache profile picture in localStorage for faster loading
        if (typeof window !== 'undefined' && userData.uid) {
          if (userData.profilePicture || userData.avatar) {
            localStorage.setItem(`avatar_${userData.uid}`, userData.profilePicture || userData.avatar);
          }
          if (userData.name || userData.displayName) {
            localStorage.setItem(`name_${userData.uid}`, userData.name || userData.displayName);
          }
          
          // Store login state to detect new logins
          localStorage.setItem('currentLoggedInUser', userData.uid);
        }

        setUser(userData);
        
        // Instead of always updating Firestore immediately, only update the lastLogin field periodically
        // This prevents excessive writes for users who visit frequently
        const lastLoginUpdate = localStorage.getItem(`lastLoginUpdate_${userData.uid}`);
        const shouldUpdateLogin = !lastLoginUpdate || (Date.now() - Number(lastLoginUpdate)) > 3600000; // Update once per hour max
        
        if (shouldUpdateLogin) {
          await setDoc(userRef, { lastLogin: now }, { merge: true });
          localStorage.setItem(`lastLoginUpdate_${userData.uid}`, Date.now().toString());
        } else {
          // Only do a full update if we haven't seen this user before
          if (!userDoc.exists()) {
            await setDoc(userRef, userData, { merge: true });
          }
        }
        
        // Force page refresh on new login to ensure all components properly rerender
        // Check if this is a login event (not just a page refresh with existing auth)
        if (isNewLogin && typeof window !== 'undefined') {
          // Check if this was a manual refresh
          const wasManualRefresh = sessionStorage.getItem('manual_refresh') === 'true';
          
          // Store the login timestamp to avoid refreshing on navigation
          localStorage.setItem('last_login_refresh', Date.now().toString());
          
          // Log the login but don't force refresh - this can cause issues
          console.log("Auth state change detected, user logged in:", userData.uid);
        }
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
      
      // Clear Firebase auth state from localStorage
      clearAuthState();
      
      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUserData, db, auth }}>
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
