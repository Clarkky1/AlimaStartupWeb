// CSS animation classes for use with Tailwind
// These are defined in tailwind.config.ts

// Classes for page transitions
export const pageTransition = "animate-fade-in";
export const slideUpTransition = "animate-slide-up";
export const slideDownTransition = "animate-slide-down";

// Classes for container/children animation
export const containerAnimation = "opacity-0 animate-fade-in";
export const itemAnimation = "opacity-0 animate-slide-up";

// Utility function to add delay to animations
export function getDelayClass(index: number): string {
  const delays = [
    "delay-0",
    "delay-75", 
    "delay-100",
    "delay-150", 
    "delay-200",
    "delay-300", 
    "delay-500", 
    "delay-700", 
    "delay-1000"
  ];
  
  // Return appropriate delay class based on index (with a maximum)
  return delays[Math.min(index, delays.length - 1)];
}

// Hover animation classes
export const hoverScale = "hover:scale-105 transition-transform duration-200";
export const cardHover = "hover:-translate-y-1 hover:shadow-lg transition-all duration-200";

// Navigation animation classes  
export const navbarScrollClass = {
  top: "bg-transparent shadow-none",
  scrolled: "bg-white/80 shadow-md backdrop-blur-md dark:bg-black/80"
};

// Pulse animation for notifications
export const pulseAnimation = "animate-pulse"; 