"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db, isFirebaseInitialized } from "@/app/lib/firebase"

interface User {
  uid: string
  email: string | null
  name?: string
  role?: string
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    if (!isFirebaseInitialized()) {
      console.error("Firebase is not initialized")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
            })
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    if (!isFirebaseInitialized()) {
      console.error("Firebase is not initialized")
      return
    }

    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    setUser,
    logout,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


