"use client"

import React, { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HydrationFix } from "@/components/ui/hydration-fix"
import AOS from 'aos'
import { NavigationHandler } from "@/components/navigation-handler"

// This is a client component that wraps children
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState("")
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Set initial path
    setCurrentPath(window.location.pathname)
    setMounted(true)
    
    // Handle route changes
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname)
    }
    
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])
  
  // Check if current path is a dashboard, login, signup, or notifications path
  const shouldHideFooter = currentPath?.startsWith('/dashboard') || 
                          currentPath === '/login' || 
                          currentPath === '/signup' ||
                          currentPath === '/signin' ||
                          currentPath === '/register' ||
                          currentPath === '/notifications' ||
                          currentPath === '/profile' ||
                          currentPath?.startsWith('/message') ||
                          currentPath === '/terms-of-service' ||
                          currentPath === '/privacy-policy' ||
                          currentPath?.startsWith('/services');
                          
  // Hide navbar on dashboard, login, signup, notifications, and all service pages
  const shouldHideNavbar = currentPath?.startsWith('/dashboard') || 
                          currentPath === '/login' || 
                          currentPath === '/signup' ||
                          currentPath === '/signin' ||
                          currentPath === '/register' ||
                          currentPath === '/notifications' ||
                          currentPath?.startsWith('/services');

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

  // If we're on a services page, just render the children without any layout
  if (currentPath?.startsWith('/services')) {
    return <>{children}</>;
  }

  return (
    <NavigationHandler>
      <HydrationFix />
      {!shouldHideNavbar && <Navbar />}
      <main className={`min-h-screen ${currentPath?.startsWith('/dashboard') ? 'dashboard-layout' : ''}`}>
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </NavigationHandler>
  )
} 