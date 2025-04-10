"use client"

import React, { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HydrationFix } from "@/components/ui/hydration-fix"
import { usePathname } from "next/navigation"
import AOS from 'aos'
import { NavigationHandler } from "@/components/navigation-handler"

// This is a client component that wraps children
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false);
  
  // Check if current path is a dashboard, login, signup, or notifications path
  const shouldHideFooter = pathname?.startsWith('/dashboard') || 
                          pathname === '/login' || 
                          pathname === '/signup' ||
                          pathname === '/signin' ||
                          pathname === '/register' ||
                          pathname === '/notifications' ||
                          pathname === '/profile' ||
                          pathname?.startsWith('/message');
                          
  // Hide navbar only on dashboard, login, signup, and notifications pages
  const shouldHideNavbar = shouldHideFooter;

  // Initialize AOS with custom settings
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Wait a bit for hydration to complete
    setTimeout(() => {
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
        startEvent: 'DOMContentLoaded'
      });
  
      // Refresh AOS when the window is resized for responsiveness
      window.addEventListener('resize', () => {
        AOS.refresh();
      });
  
      // Refresh AOS on route change
      window.addEventListener('load', () => {
        AOS.refresh();
      });
    }, 100); // Short delay to ensure hydration completes

    return () => {
      window.removeEventListener('resize', () => {
        AOS.refresh();
      });
      window.removeEventListener('load', () => {
        AOS.refresh();
      });
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NavigationHandler>
      <HydrationFix />
      {!shouldHideNavbar && <Navbar />}
      <main className={`min-h-screen ${pathname?.startsWith('/dashboard') ? 'dashboard-layout' : ''}`}>
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </NavigationHandler>
  )
} 