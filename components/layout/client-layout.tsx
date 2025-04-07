"use client"

import { useRouter } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [pathname, setPathname] = useState<string>('')

  useEffect(() => {
    // Set isClient to true when component mounts
    setIsClient(true)
    
    // Immediately set the pathname from window location
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
    }
  }, [])

  useEffect(() => {
    // Only attempt to use Next.js hooks when on the client side
    if (isClient) {
      try {
        // Dynamically import usePathname to avoid SSR issues
        const { usePathname } = require("next/navigation")
        const pathFromHook = usePathname()
        if (pathFromHook) {
          setPathname(pathFromHook)
        }
      } catch (e) {
        console.error("Error using navigation hooks:", e)
      }
    }
  }, [isClient])

  useEffect(() => {
    // Force a soft navigation when the pathname changes
    if (pathname) {
      router.refresh()
    }
  }, [pathname, router])

  return (
    <div key={pathname}>
      {children}
    </div>
  )
} 