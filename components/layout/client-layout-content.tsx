"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { usePathname } from "next/navigation"

export function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const pathname = usePathname()
  
  // Check if current path is login, signup, or dashboard
  const hideNavAndFooter = pathname?.includes('/login') || 
                          pathname?.includes('/signup') || 
                          pathname?.includes('/dashboard')
  
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <>
      {!hideNavAndFooter && <Navbar />}
      {isLoaded && (
        <main className={`flex-1 ${!hideNavAndFooter ? 'animate-slide-up' : ''}`}>
          {children}
        </main>
      )}
      {!hideNavAndFooter && <Footer />}
    </>
  )
} 