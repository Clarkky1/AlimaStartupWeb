"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  // Default to false for SSR
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    // Check if the screen is mobile sized
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIsMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)

    // Clean up event listener
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return isMobile
}

