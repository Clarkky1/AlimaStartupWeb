"use client"

import { useState, useEffect, ReactNode } from 'react';

interface AnimatedElementProps {
  children: ReactNode;
  animation: string;
  delay?: number | string;
  className?: string;
}

/**
 * AnimatedElement Component
 * 
 * A safer way to use AOS animations that prevents hydration mismatches.
 * This component only applies data-aos attributes on the client-side
 * after initial hydration is complete.
 * 
 * Usage:
 * <AnimatedElement animation="fade-up" delay={200} className="your-class">
 *   <div>Your content</div>
 * </AnimatedElement>
 */
export function AnimatedElement({ 
  children, 
  animation, 
  delay, 
  className = "" 
}: AnimatedElementProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // During SSR and initial hydration, render without animation attributes
    return <div className={className}>{children}</div>;
  }

  // After hydration, apply animation attributes
  return (
    <div 
      className={className}
      data-aos={animation} 
      data-aos-delay={delay}
    >
      {children}
    </div>
  );
} 