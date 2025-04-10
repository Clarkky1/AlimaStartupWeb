"use client"

import { useCookies } from "@/context/cookie-context"

export function useCookieConsent() {
  const { cookiesAccepted, cookieOptions, acceptAllCookies, saveCookieOptions } = useCookies()

  // Check if specific cookie type is enabled
  const isEnabled = (type: 'functional' | 'analytics' | 'advertising') => {
    return cookiesAccepted && cookieOptions[type]
  }

  // Convenience methods for common cookie types
  const isFunctionalEnabled = () => isEnabled('functional')
  const isAnalyticsEnabled = () => isEnabled('analytics')
  const isAdvertisingEnabled = () => isEnabled('advertising')

  // Helper to load scripts conditionally based on cookie consent
  const loadScript = (
    type: 'functional' | 'analytics' | 'advertising',
    scriptId: string,
    src: string,
    onLoad?: () => void
  ) => {
    if (!isEnabled(type)) return false

    // Check if the script already exists
    if (document.getElementById(scriptId)) {
      onLoad?.()
      return true
    }

    // Create and add the script
    const script = document.createElement('script')
    script.id = scriptId
    script.src = src
    script.async = true
    script.onload = () => onLoad?.()

    document.head.appendChild(script)
    return true
  }

  return {
    cookiesAccepted,
    cookieOptions,
    acceptAllCookies,
    saveCookieOptions,
    isEnabled,
    isFunctionalEnabled,
    isAnalyticsEnabled,
    isAdvertisingEnabled,
    loadScript
  }
} 