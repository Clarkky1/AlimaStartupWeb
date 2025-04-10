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
                          pathname?.startsWith('/message') ||
                          pathname === '/terms-of-service' ||
                          pathname === '/privacy-policy';
                          
  // Hide navbar only on dashboard, login, signup, and notifications pages
  const shouldHideNavbar = shouldHideFooter;

  // Initialize AOS with custom settings
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Refresh AOS when needed
    const refreshHandler = () => {
      AOS.refresh();
    };
    
    // Add debounced resize handler to avoid performance issues
    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedRefresh = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshHandler, 150);
    };
    
    // Wait a bit for hydration to complete
    setTimeout(() => {
      // Check if mobile device for optimized animations
      const isMobile = window.innerWidth < 768;
      
      AOS.init({
        duration: isMobile ? 600 : 800, // Faster animations on mobile
        easing: 'ease-out-cubic',
        once: false,
        mirror: true,
        offset: isMobile ? 30 : 50, // Smaller offset on mobile
        delay: isMobile ? 50 : 100, // Shorter delay on mobile
        debounceDelay: 50,
        throttleDelay: isMobile ? 150 : 99, // More throttling on mobile for performance
        anchorPlacement: 'top-bottom',
        startEvent: 'DOMContentLoaded'
      });
      
      window.addEventListener('resize', debouncedRefresh);
      window.addEventListener('orientationchange', refreshHandler);
      window.addEventListener('load', refreshHandler);
    }, 100); // Short delay to ensure hydration completes

    return () => {
      window.removeEventListener('resize', debouncedRefresh);
      window.removeEventListener('orientationchange', refreshHandler);
      window.removeEventListener('load', refreshHandler);
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