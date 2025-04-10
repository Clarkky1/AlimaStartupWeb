"use client"

import React from 'react';
import { Poppins, Work_Sans } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import 'aos/dist/aos.css'; // Import AOS styles
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChatButtonWrapper } from "@/components/chat-button-wrapper";
import Script from "next/script";

// Import providers in a specific order to prevent circular dependencies
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/app/context/auth-context";
import { CategoryProvider } from "@/app/context/category-context";
import { ClientLayout } from "@/components/layout/client-layout";
import { NetworkStatusProvider } from "@/app/context/network-status-context";

// Font configurations with improved fallbacks
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  preload: false, // Reduces initial blocking time
});

const workSans = Work_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  preload: false, // Reduces initial blocking time
});

// Client Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
      <head>
        {/* SEO metadata */}
        <title>Alima - Find and Offer Services</title>
        <meta name="description" content="Connect with service providers and clients in your area" />
        <link rel="icon" href="/AlimaLOGO.svg" sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/AlimaLOGO.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Add preload hint for critical JavaScript */}
        <link 
          rel="preload" 
          href="/_next/static/chunks/app/layout.js" 
          as="script" 
          fetchPriority="high" 
        />
        {/* Add preload for critical CSS */}
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
        />
        {/* Add font fallback script */}
        <script src="/fonts.js" defer></script>
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        poppins.variable,
        workSans.variable
      )} suppressHydrationWarning>
        <NetworkStatusProvider>
          <AuthProvider>
            <CategoryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                disableTransitionOnChange
              >
                <ClientLayout>
                  {children}
                </ClientLayout>
                <ChatButtonWrapper />
              </ThemeProvider>
            </CategoryProvider>
            <Toaster />
          </AuthProvider>
        </NetworkStatusProvider>

        {/* Use next/script to properly handle client-side script loading */}
        <Script
          id="scroll-fix-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Fix to ensure navbar links can scroll to top and home page displays correctly
              document.addEventListener('DOMContentLoaded', function() {
                // Save a reference to any link that points to the homepage
                const homeLinks = document.querySelectorAll('a[href="/"]');
                
                // Keep track of whether we're clicking on the avatar dropdown
                let isAvatarClick = false;
                let isTouchScrolling = false;
                let lastTouchY = 0;
                
                // Add a listener to capture avatar dropdown clicks
                document.addEventListener('mousedown', function(e) {
                  // Check if clicking on avatar dropdown (look for the Avatar component or its parent button)
                  if (e.target.closest('.dropdown-trigger') || 
                      e.target.closest('[role="menu"]') ||
                      e.target.closest('[data-state="open"]')) {
                    isAvatarClick = true;
                    // Reset the flag after a short delay
                    setTimeout(() => { isAvatarClick = false }, 300);
                  }
                }, true);
                
                // Handle touch events for mobile devices
                document.addEventListener('touchstart', function(e) {
                  lastTouchY = e.touches[0].clientY;
                  isTouchScrolling = false;
                }, { passive: true });
                
                document.addEventListener('touchmove', function(e) {
                  const touchY = e.touches[0].clientY;
                  const touchDiff = Math.abs(touchY - lastTouchY);
                  // If touch movement is significant, mark as scrolling
                  if (touchDiff > 10) {
                    isTouchScrolling = true;
                  }
                }, { passive: true });
                
                // Check if we navigated back to home from another page
                if (window.location.pathname === '/' && 
                    document.referrer && 
                    !document.referrer.includes(window.location.origin + '/')) {
                  // Force reload to ensure all content renders properly
                  window.location.reload();
                }
                
                // Also handle navigation via navbar links
                homeLinks.forEach(link => {
                  link.addEventListener('click', function(e) {
                    const path = window.location.pathname;
                    // If we're not already on the home page, let the browser navigate normally
                    if (path !== '/') return;
                    
                    // Only scroll to top if on home page AND not clicking avatar
                    if (!isAvatarClick && !isTouchScrolling) {
                      e.preventDefault();
                      
                      // Use smooth scrolling for better mobile experience
                      try {
                        window.scrollTo({
                          top: 0,
                          left: 0,
                          behavior: 'smooth'
                        });
                      } catch (error) {
                        // Fallback for older browsers
                        window.scrollTo(0, 0);
                        document.body.scrollTop = 0;
                        document.documentElement.scrollTop = 0;
                      }
                      
                      // Reload the page if needed to ensure content displays
                      if (!document.querySelector('#home')) {
                        window.location.reload();
                      }
                    }
                  });
                });
                
                // Fix for iOS momentum scrolling issues
                if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                  document.body.style.webkitOverflowScrolling = 'touch';
                }
                
                // Improve scroll performance on mobile
                const viewportMeta = document.querySelector('meta[name="viewport"]');
                if (viewportMeta) {
                  viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
                }
              });
            `
          }}
        />
      </body>
    </html>
  );
}