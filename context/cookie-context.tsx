"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { CookieConsent } from "@/components/cookie-consent"
import { CookieOptionsModal, CookieOptions } from "@/components/cookie-options-modal"

interface CookieContextType {
  cookiesAccepted: boolean
  cookieOptions: CookieOptions
  acceptAllCookies: () => void
  saveCookieOptions: (options: CookieOptions) => void
}

const defaultCookieOptions: CookieOptions = {
  necessary: true,
  functional: false,
  analytics: false,
  advertising: false,
}

const CookieContext = createContext<CookieContextType>({
  cookiesAccepted: false,
  cookieOptions: defaultCookieOptions,
  acceptAllCookies: () => {},
  saveCookieOptions: () => {},
})

export function useCookies() {
  return useContext(CookieContext)
}

export function CookieProvider({ children }: { children: ReactNode }) {
  const [cookiesAccepted, setCookiesAccepted] = useState(false)
  const [cookieOptions, setCookieOptions] = useState<CookieOptions>(defaultCookieOptions)
  const [optionsModalOpen, setOptionsModalOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Load cookie preferences from localStorage on app initialization
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const storedConsent = localStorage.getItem("cookie-consent")
      const storedOptions = localStorage.getItem("cookie-options")

      if (storedConsent === "accepted") {
        setCookiesAccepted(true)
      }

      if (storedOptions) {
        try {
          const parsedOptions = JSON.parse(storedOptions)
          setCookieOptions(parsedOptions)
        } catch (e) {
          console.error("Failed to parse cookie options", e)
        }
      }

      setInitialized(true)
    }
  }, [])

  const acceptAllCookies = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true,
    }
    localStorage.setItem("cookie-consent", "accepted")
    localStorage.setItem("cookie-options", JSON.stringify(allAccepted))
    setCookiesAccepted(true)
    setCookieOptions(allAccepted)
  }

  const saveCookieOptions = (options: CookieOptions) => {
    localStorage.setItem("cookie-consent", "accepted")
    localStorage.setItem("cookie-options", JSON.stringify(options))
    setCookiesAccepted(true)
    setCookieOptions(options)
  }

  // Only render if initialized to prevent hydration errors
  if (!initialized) {
    return <>{children}</>
  }

  return (
    <CookieContext.Provider
      value={{
        cookiesAccepted,
        cookieOptions,
        acceptAllCookies,
        saveCookieOptions,
      }}
    >
      {children}
      
      {/* Only show the cookie banner if cookies haven't been accepted */}
      <CookieConsent
        onAccept={acceptAllCookies}
        onShowOptions={() => setOptionsModalOpen(true)}
      />
      
      {/* Cookie options modal */}
      <CookieOptionsModal
        open={optionsModalOpen}
        onOpenChange={setOptionsModalOpen}
        onSave={saveCookieOptions}
      />
    </CookieContext.Provider>
  )
} 