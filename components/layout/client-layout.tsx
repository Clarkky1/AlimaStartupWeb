"use client"

import React, { useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HydrationFix } from "@/components/ui/hydration-fix"
import { usePathname } from "next/navigation"
import AOS from 'aos'

// This is a server component that wraps the client component
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if current path is a dashboard, login, or signup path
  const shouldHideNavAndFooter = pathname?.startsWith('/dashboard') || 
                                pathname === '/login' || 
                                pathname === '/signup' ||
                                pathname === '/signin' ||
                                pathname === '/register'

  // Initialize AOS with custom settings
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
      offset: 50,
      delay: 100,
      debounceDelay: 50,
      throttleDelay: 99,
      anchorPlacement: 'top-bottom',
      disable: 'mobile',
    });

    // Refresh AOS when the window is resized for responsiveness
    window.addEventListener('resize', () => {
      AOS.refresh();
    });

    // Refresh AOS on route change
    window.addEventListener('load', () => {
      AOS.refresh();
    });

    return () => {
      window.removeEventListener('resize', () => {
        AOS.refresh();
      });
      window.removeEventListener('load', () => {
        AOS.refresh();
      });
    };
  }, []);

  return (
    <>
      <HydrationFix />
      {!shouldHideNavAndFooter && <Navbar />}
      <main className={`min-h-screen ${pathname?.startsWith('/dashboard') ? 'dashboard-layout' : ''}`}>
        {children}
      </main>
      {!shouldHideNavAndFooter && <Footer />}
    </>
  )
} 