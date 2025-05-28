"use client"

import { useState, useEffect } from 'react'

export function useCurrentPath() {
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    // Set initial path
    setCurrentPath(window.location.pathname)

    // Handle route changes
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname)
    }

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange)

    // Listen for pushState events (programmatic navigation)
    const originalPushState = window.history.pushState
    window.history.pushState = function() {
      originalPushState.apply(this, arguments as any)
      handleRouteChange()
    }

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.history.pushState = originalPushState
    }
  }, [])

  return currentPath
} 