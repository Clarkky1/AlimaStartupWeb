"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationHandlerProps {
  children: React.ReactNode;
}

export function NavigationHandler({ children }: NavigationHandlerProps) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Store the current path when the component mounts
    const currentPath = window.location.pathname;
    
    // Function to handle navigation events
    const handleNavigationEvent = () => {
      // When we navigate back to home from another page
      if (window.location.pathname === '/' && sessionStorage.getItem('lastPath') 
          && sessionStorage.getItem('lastPath') !== '/') {
        console.log('Back to home, refreshing...');
        
        // Set a flag to prevent infinite refreshes
        const refreshFlag = sessionStorage.getItem('homeRefreshed');
        const refreshTime = parseInt(sessionStorage.getItem('homeRefreshTime') || '0');
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        // Only refresh if we haven't recently refreshed
        if (!refreshFlag || refreshTime < fiveMinutesAgo) {
          sessionStorage.setItem('homeRefreshed', 'true');
          sessionStorage.setItem('homeRefreshTime', Date.now().toString());
          window.location.reload();
        }
      }
      
      // Store the current path for next comparison
      sessionStorage.setItem('lastPath', window.location.pathname);
    };
    
    // Function to handle hash changes
    const handleHashChange = () => {
      // Check if we're on the home page
      if (window.location.pathname === '/') {
        // If there's no home section visible, it might indicate a rendering issue
        if (!document.querySelector('#home')) {
          console.log('Home section not found, refreshing...');
          window.location.reload();
        }
      }
    };
    
    // Handle smooth scrolling for anchor links
    const handleAnchorLinks = () => {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        // Define click handler with proper types
        const clickHandler = function(this: HTMLElement, e: Event) {
          const targetId = (this as HTMLAnchorElement).getAttribute('href');
          if (targetId === '#' || !targetId) return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();
            
            // Use native smooth scrolling where supported
            try {
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            } catch (error) {
              // Fallback for older browsers
              window.scrollTo(0, (targetElement as HTMLElement).offsetTop - 100);
            }
          }
        };
        
        // Add event listener with properly typed handler
        anchor.addEventListener('click', clickHandler);
      });
    };
    
    // Initialize the lastPath in sessionStorage
    if (typeof window !== 'undefined') {
      if (!sessionStorage.getItem('lastPath')) {
        sessionStorage.setItem('lastPath', currentPath);
      }
      
      // Setup smooth scrolling for anchor links
      handleAnchorLinks();
      
      // Listen for popstate events (browser back/forward)
      window.addEventListener('popstate', handleNavigationEvent);
      
      // Listen for hashchange events
      window.addEventListener('hashchange', handleHashChange);
      
      // Fix for mobile vh issues (iOS Safari)
      const fixMobileVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      // Run the mobile vh fix
      fixMobileVh();
      window.addEventListener('resize', fixMobileVh);
      window.addEventListener('orientationchange', fixMobileVh);
      
      // If we're on the home page and the page doesn't have content
      if (pathname === '/' && document.readyState === 'complete') {
        // Check if we need to reload
        setTimeout(() => {
          if (!document.querySelector('#home')) {
            console.log('Home section not found after navigation, refreshing...');
            window.location.reload();
          }
        }, 500);
      }
      
      // Handle touch scrolling on mobile devices
      let touchStartY = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        const touchY = e.touches[0].clientY;
        const diff = touchStartY - touchY;
        
        // If we're at the top and pulling down, prevent default to avoid overscroll
        if (window.scrollY === 0 && diff < 0) {
          e.preventDefault();
        }
      };
      
      // Add touch event listeners for mobile
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      // Clean up
      return () => {
        window.removeEventListener('popstate', handleNavigationEvent);
        window.removeEventListener('hashchange', handleHashChange);
        window.removeEventListener('resize', fixMobileVh);
        window.removeEventListener('orientationchange', fixMobileVh);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [pathname]);

  return <>{children}</>;
} 