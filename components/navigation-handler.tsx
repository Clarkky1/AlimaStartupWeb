"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationHandlerProps {
  children: React.ReactNode;
}

export function NavigationHandler({ children }: NavigationHandlerProps) {
  const pathname = usePathname();
  
  return <>{children}</>;
} 

//export default NavigationHandler;
  //const pathname = use pathname
  //const pathname = use pathname