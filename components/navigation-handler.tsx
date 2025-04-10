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
    
    // Initialize the lastPath in sessionStorage
    if (typeof window !== 'undefined') {
      if (!sessionStorage.getItem('lastPath')) {
        sessionStorage.setItem('lastPath', currentPath);
      }
      
      // Listen for popstate events (browser back/forward)
      window.addEventListener('popstate', handleNavigationEvent);
      
      // Listen for hashchange events
      window.addEventListener('hashchange', handleHashChange);
      
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
      
      // Clean up
      return () => {
        window.removeEventListener('popstate', handleNavigationEvent);
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, [pathname]);

  return <>{children}</>;
} 