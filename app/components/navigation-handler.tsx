"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationHandlerProps {
  children: React.ReactNode;
}

export function NavigationHandler({ children }: NavigationHandlerProps) {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only trigger on popstate (back/forward navigation)
    const handlePopState = () => {
      console.log("Pop state detected, current path:", pathname);
      console.log("Previous path was:", previousPathRef.current);
      
      // Only reload if we're navigating TO home FROM another page
      if (pathname === '/' && previousPathRef.current && previousPathRef.current !== '/') {
        console.log("Navigation to home detected, refreshing page");
        window.location.reload();
      }
    };

    // On mount or path change, update the previous path ref
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
    }
    
    // Only add the popstate listener
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return <>{children}</>;
} 