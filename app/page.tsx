"use client"

import { HeroSection } from "@/components/home/hero-section"
import { GlobalServices } from "@/components/home/featured-services"
import { TopProviders } from "@/components/popular/top-providers"
import { buttonVariants } from "@/components/ui/button"
import { AnimatedCard } from "@/app/components/home/animated-card"
import Link from "next/link"
import { Suspense, useEffect, useState, useCallback } from "react"
import { CheckCircle, Search, MessageSquare, CreditCard, Plus, Circle, UserRoundSearch, MessagesSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStatistics } from "@/app/hooks/useStatistics"
import { useNetworkStatus } from "@/app/context/network-status-context";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from "firebase/firestore"
import { RatingModal } from "@/components/messages/rating-modal"
import { useToast } from "@/components/ui/use-toast"
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FAQSection } from "@/components/home/faq-section"
import { ScrollToTop } from "@/components/ui/scroll-to-top"

// Dynamically import the QuoteCard component to avoid styled-components SSR issues
const QuoteCard = dynamic(() => import("@/components/home/quote-card"), { ssr: false });

// Client component for animations
const AnimationStyles = () => {
  useEffect(() => {
    // Only run on client-side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    // Initialize AOS
    AOS.init({
      duration: 800, // Animation duration
      once: false, // Whether animation should happen only once - while scrolling down
    });
    
    // Add custom animation keyframes to the document
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-slow {
        0%, 100% { transform: translate(-50%, -50%); }
        50% { transform: translate(-50%, -52%); }
      }
      @keyframes float-medium {
        0%, 100% { transform: rotate(-8deg); }
        50% { transform: rotate(-6deg) translateY(-4px); }
      }
      @keyframes float-slow-reverse {
        0%, 100% { transform: rotate(8deg); }
        50% { transform: rotate(10deg) translateY(4px); }
      }
      @keyframes subtle-zoom {
        0%, 100% { transform: scale(1.05); }
        50% { transform: scale(1.07); }
      }
      @keyframes subtle-zoom-reverse {
        0%, 100% { transform: scale(1.05); }
        50% { transform: scale(1.08); }
      }
      @keyframes subtle-rotate {
        0%, 100% { transform: scale(1.05) rotate(0deg); }
        50% { transform: scale(1.07) rotate(1deg); }
      }
      @keyframes pulse-very-slow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.6; }
      }
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.7; }
      }
      @keyframes pulse-medium {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.65; }
      }
      
      @keyframes moving-gradient {
        0% { 
          background-position: 0% 50%;
          transform: rotate(0deg) scale(1);
        }
        50% { 
          background-position: 100% 50%;
          transform: rotate(5deg) scale(1.1);
        }
        100% { 
          background-position: 0% 50%;
          transform: rotate(0deg) scale(1);
        }
      }
      
      @keyframes roaming-blob {
        0% {
          transform: translateY(0) translateX(0) scale(1);
        }
        20% {
          transform: translateY(-20px) translateX(15px) scale(1.05);
        }
        40% {
          transform: translateY(-10px) translateX(30px) scale(0.95);
        }
        60% {
          transform: translateY(15px) translateX(20px) scale(1.02);
        }
        80% {
          transform: translateY(25px) translateX(-10px) scale(0.98);
        }
        100% {
          transform: translateY(0) translateX(0) scale(1);
        }
      }
      
      @keyframes circle-roam {
        0% {
          transform: translateY(0) translateX(0) scale(1);
        }
        20% {
          transform: translateY(-150px) translateX(200px) scale(1.2);
        }
        40% {
          transform: translateY(100px) translateX(300px) scale(0.9);
        }
        60% {
          transform: translateY(200px) translateX(100px) scale(1.1);
        }
        80% {
          transform: translateY(150px) translateX(-250px) scale(0.95);
        }
        100% {
          transform: translateY(0) translateX(0) scale(1);
        }
      }
      
      @keyframes bounce-movement {
        0% {
          transform: translateX(-150px) scale(1);
        }
        25% {
          transform: translateX(150px) scale(1.1);
        }
        50% {
          transform: translateX(400px) scale(0.9);
        }
        75% {
          transform: translateX(150px) scale(1.05);
        }
        100% {
          transform: translateX(-150px) scale(1);
        }
      }
      
      @keyframes bounce-movement-1 {
        0% {
          transform: translateX(-200px) translateY(0px) scale(1);
        }
        25% {
          transform: translateX(100px) translateY(-80px) scale(1.1);
        }
        50% {
          transform: translateX(400px) translateY(50px) scale(0.9);
        }
        75% {
          transform: translateX(100px) translateY(120px) scale(1.05);
        }
        100% {
          transform: translateX(-200px) translateY(0px) scale(1);
        }
      }
      
      @keyframes bounce-movement-2 {
        0% {
          transform: translateX(300px) translateY(30px) scale(0.95);
        }
        25% {
          transform: translateX(100px) translateY(150px) scale(1.1);
        }
        50% {
          transform: translateX(-250px) translateY(60px) scale(0.9);
        }
        75% {
          transform: translateX(100px) translateY(-50px) scale(1.05);
        }
        100% {
          transform: translateX(300px) translateY(30px) scale(0.95);
        }
      }
      
      @keyframes bounce-movement-3 {
        0% {
          transform: translateX(0px) translateY(-100px) scale(1);
        }
        25% {
          transform: translateX(250px) translateY(50px) scale(1.05);
        }
        50% {
          transform: translateX(100px) translateY(150px) scale(0.95);
        }
        75% {
          transform: translateX(-200px) translateY(20px) scale(1.1);
        }
        100% {
          transform: translateX(0px) translateY(-100px) scale(1);
        }
      }
      
      @keyframes bounce-left-right {
        0% { transform: translateX(-150%) translateY(0); }
        50% { transform: translateX(150%) translateY(0); }
        100% { transform: translateX(-150%) translateY(0); }
      }
      
      @keyframes bounce-right-left {
        0% { transform: translateX(150%) translateY(0); }
        50% { transform: translateX(-150%) translateY(0); }
        100% { transform: translateX(150%) translateY(0); }
      }
      
      @keyframes bounce-top-bottom {
        0% { transform: translateX(0) translateY(-100%); }
        50% { transform: translateX(0) translateY(100%); }
        100% { transform: translateX(0) translateY(-100%); }
      }
      
      @keyframes bounce-bottom-top {
        0% { transform: translateX(0) translateY(70%); }
        50% { transform: translateX(0) translateY(-70%); }
        100% { transform: translateX(0) translateY(70%); }
      }
      
      @keyframes bounce-diagonal-1 {
        0% { transform: translateX(-120%) translateY(-120%); }
        50% { transform: translateX(120%) translateY(120%); }
        100% { transform: translateX(-120%) translateY(-120%); }
      }
      
      @keyframes bounce-diagonal-2 {
        0% { transform: translateX(120%) translateY(-120%); }
        50% { transform: translateX(-120%) translateY(120%); }
        100% { transform: translateX(120%) translateY(-120%); }
      }
      
      @keyframes random-path-1 {
        0% { transform: translate(0, 0) scale(1); }
        20% { transform: translate(120%, -70%) scale(1.1); }
        40% { transform: translate(50%, 100%) scale(0.9); }
        60% { transform: translate(-80%, 80%) scale(1.05); }
        80% { transform: translate(-120%, -40%) scale(0.95); }
        100% { transform: translate(0, 0) scale(1); }
      }
      
      @keyframes random-path-2 {
        0% { transform: translate(0, 0) scale(0.95); }
        25% { transform: translate(-90%, -60%) scale(1.1); }
        50% { transform: translate(70%, -90%) scale(0.9); }
        75% { transform: translate(100%, 70%) scale(1.05); }
        100% { transform: translate(0, 0) scale(0.95); }
      }
      
      @keyframes random-path-3 {
        0% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(80%, 60%) scale(0.9); }
        66% { transform: translate(-100%, 40%) scale(1.1); }
        100% { transform: translate(0, 0) scale(1); }
      }
      
      @keyframes random-path-4 {
        0% { transform: translate(0, 0) scale(1.05); }
        20% { transform: translate(-60%, 90%) scale(0.9); }
        40% { transform: translate(50%, 50%) scale(1.1); }
        60% { transform: translate(90%, -70%) scale(0.95); }
        80% { transform: translate(-40%, -80%) scale(1); }
        100% { transform: translate(0, 0) scale(1.05); }
      }
      
      @keyframes random-path-5 {
        0% { transform: translate(0, 0) scale(0.9); }
        25% { transform: translate(70%, 50%) scale(1.1); }
        50% { transform: translate(-50%, -90%) scale(1); }
        75% { transform: translate(-80%, 20%) scale(0.95); }
        100% { transform: translate(0, 0) scale(0.9); }
      }
      
      .animate-float-slow {
        animation: float-slow 6s ease-in-out infinite;
      }
      .animate-float-medium {
        animation: float-medium 5s ease-in-out infinite;
      }
      .animate-float-slow-reverse {
        animation: float-slow-reverse 7s ease-in-out infinite;
      }
      .animate-subtle-zoom {
        animation: subtle-zoom 10s ease-in-out infinite;
      }
      .animate-subtle-zoom-reverse {
        animation: subtle-zoom-reverse 8s ease-in-out infinite;
      }
      .animate-subtle-rotate {
        animation: subtle-rotate 12s ease-in-out infinite;
      }
      .animate-pulse-very-slow {
        animation: pulse-very-slow 8s ease-in-out infinite;
      }
      .animate-pulse-slow {
        animation: pulse-slow 6s ease-in-out infinite;
      }
      .animate-pulse-medium {
        animation: pulse-medium 7s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default function Home() {
  const { isOnline } = useNetworkStatus();
  const placeholderImg = "/placeholder.jpg";
  const [loadKey, setLoadKey] = useState(Date.now());
  const pathname = usePathname();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isServerComponent, setIsServerComponent] = useState(true);
  const { user } = useAuth();
  
  // Images for the Get In Touch section carousel
  const getInTouchImages = [
    "/Get in touch 2.png",
    "/Get in touch 3.png", 
    "/Get in touch 4.png",
    "/Get in touch 5.png"
  ];
  
  // Handle image slideshow for Get In Touch section
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === getInTouchImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Reset the component on each visit by forcing a complete remount
  useEffect(() => {
    // Scroll to top on each mount of this component
    window.scrollTo(0, 0);
    
    // Check if this is a navigation back to the home page
    if (typeof window !== 'undefined') {
      // Get the navigation state from sessionStorage
      const hasBeenLoaded = sessionStorage.getItem('homeLoaded');
      
      // If the page hasn't been loaded before in this session,
      // or it's been more than 5 minutes, trigger a refresh
      const lastLoadTime = parseInt(sessionStorage.getItem('homeLoadTime') || '0');
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      if (!hasBeenLoaded || lastLoadTime < fiveMinutesAgo) {
        // Set home as loaded and update the load time
        sessionStorage.setItem('homeLoaded', 'true');
        sessionStorage.setItem('homeLoadTime', Date.now().toString());
        
        // Set a new key to force remount
        setLoadKey(Date.now());
      }
    }
  }, []); // Only run on initial mount
  
  // Fetch statistics with the loadKey to force refresh
  const { userCount, serviceCount, providerCount, isLoading } = useStatistics();
  
  // Format numbers with K suffix (e.g., 15300 -> 15.3K)
  const formatStatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Add the cursor follower script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const cursorFollower = document.getElementById('cursor-follower');
    const targetElement = cursorFollower?.parentElement;
    
    if (!cursorFollower || !targetElement) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = targetElement.getBoundingClientRect();
      const x = e.clientX - rect.left - 64; // Centering the 128px cursor follower
      const y = e.clientY - rect.top - 64;
      
      // Add a subtle delay for smoother following
      cursorFollower.style.transition = 'transform 0.2s ease-out, background 0.3s ease';
      cursorFollower.style.transform = `translate(${x}px, ${y}px)`;
      
      // Change gradient color based on position
      const normalizedX = (e.clientX - rect.left) / rect.width;
      if (normalizedX < 0.5) {
        cursorFollower.style.background = 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.2) 70%)';
      } else {
        cursorFollower.style.background = 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(5,150,105,0.2) 70%)';
      }
    };
    
    const handleMouseEnter = () => {
      cursorFollower.style.opacity = '1';
      targetElement.style.cursor = 'none';
    };
    
    const handleMouseLeave = () => {
      cursorFollower.style.opacity = '0';
      targetElement.style.cursor = 'auto';
    };
    
    targetElement.addEventListener('mousemove', handleMouseMove);
    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      targetElement.removeEventListener('mousemove', handleMouseMove);
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Force scroll to top when home page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Add these states to manage rating notifications
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingData, setRatingData] = useState({
    providerId: '',
    providerName: '',
    serviceId: '',
    serviceTitle: '',
    transactionId: ''
  });
  const { toast } = useToast();

  // Add this effect to check for rating notifications
  useEffect(() => {
    if (!user) return;
    
    async function checkForRatingNotifications() {
      try {
        const { db } = await initializeFirebase();
        if (!db) return;
        
        // Query for unread payment confirmation notifications that need rating
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user?.uid),
          where("type", "==", "payment_confirmed_rating"),
          where("read", "==", false),
          limit(1)
        );
        
        const snapshot = await getDocs(notificationsQuery);
        
        if (!snapshot.empty) {
          const notification = snapshot.docs[0];
          const data = notification.data();
          
          // Show rating dialog if we have the necessary data
          if (data.data && data.data.requiresRating) {
            setRatingData({
              providerId: data.data.providerId || "",
              providerName: data.data.providerName || "Provider",
              serviceId: data.data.serviceId || "",
              serviceTitle: data.data.serviceTitle || "Service",
              transactionId: data.data.transactionId || ""
            });
            setShowRatingDialog(true);
            
            // Mark the notification as read
            await updateDoc(doc(db, "notifications", notification.id), {
              read: true
            });
          }
        }
      } catch (error) {
        console.error("Error checking for rating notifications:", error);
        toast({
          title: "Error",
          description: "Failed to check for notifications",
          variant: "destructive"
        });
      }
    }
    
    // Check when component loads
    checkForRatingNotifications();
    
    // Set up interval to periodically check (every 30 seconds)
    const intervalId = setInterval(checkForRatingNotifications, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user, toast]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white relative overflow-hidden" key={loadKey}>
      {/* Add animation styles */}
      <AnimationStyles />
      
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Flowing curved lines background */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-50 dark:opacity-30">
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c5c5c5" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b9b9b9" />
              <stop offset="100%" stopColor="#d9d9d9" />
            </linearGradient>
          </defs>
          <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 C1150,200 1350,0 1500,100 C1650,200 1850,0 2000,100" 
            stroke="url(#lineGradient1)" 
            fill="none" 
            strokeWidth="1.5" 
          />
          <path d="M0,300 C150,400 350,200 500,300 C650,400 850,200 1000,300 C1150,400 1350,200 1500,300 C1650,400 1850,200 2000,300" 
            stroke="url(#lineGradient2)" 
            fill="none" 
            strokeWidth="2" 
          />
          <path d="M0,500 C150,600 350,400 500,500 C650,600 850,400 1000,500 C1150,600 1350,400 1500,500 C1650,600 1850,400 2000,500" 
            stroke="url(#lineGradient1)" 
            fill="none" 
            strokeWidth="1.5" 
          />
          <path d="M0,700 C150,800 350,600 500,700 C650,800 850,600 1000,700 C1150,800 1350,600 1500,700 C1650,800 1850,600 2000,700" 
            stroke="url(#lineGradient2)" 
            fill="none" 
            strokeWidth="2" 
          />
          <path d="M0,900 C150,1000 350,800 500,900 C650,1000 850,800 1000,900 C1150,1000 1350,800 1500,900 C1650,1000 1850,800 2000,900" 
            stroke="url(#lineGradient1)" 
            fill="none" 
            strokeWidth="1.5" 
          />
          <path d="M0,1100 C150,1200 350,1000 500,1100 C650,1200 850,1000 1000,1100 C1150,1200 1350,1000 1500,1100 C1650,1200 1850,1000 2000,1100" 
            stroke="url(#lineGradient2)" 
            fill="none" 
            strokeWidth="2" 
          />
        </svg>
      </div>
      
      <main className="flex-1 relative z-10">
        {/* 1. HEADLINE - Hero Section (acts as main headline/tagline) */}
        <Suspense fallback={<div className="h-[600px] w-full bg-neutral-100 dark:bg-neutral-900" />}>
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
            <section className="pt-5 md:pt-10 pb-10 md:pb-24 bg-transparent" id="home">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20 items-center">
                <div className="order-2 lg:order-1" data-aos="fade-right" data-aos-delay="200">
                  <div className="relative">
                    {/* Subtle accent elements */}
                    <div className="absolute -left-6 -top-6 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
                    <div className="absolute -right-4 bottom-12 w-32 h-32 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
                    
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl mb-8 relative">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
                        Your Trusted Filipino Service Marketplace
                      </span>
                    </h1>
                    
                    <p className="mb-10 max-w-lg text-base sm:text-lg text-gray-600 dark:text-gray-300 backdrop-blur-sm relative">
                      Find skilled professionals for any service you need.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 relative">
                      <Button asChild size="lg" className="rounded-full px-8 w-full sm:w-auto min-w-[180px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-[0_8px_30px_rgba(59,130,246,0.2)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                        <Link href="/services">Browse Services</Link>
                      </Button>
                      <Button asChild size="lg" variant="secondary" className="rounded-full px-8 w-full sm:w-auto min-w-[180px] bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0 shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:from-emerald-600 hover:to-blue-600 transition-all duration-300">
                        <Link href="/services/apply">Apply for Services</Link>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2" data-aos="fade-left" data-aos-delay="300">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    <div className="relative h-[500px] flex items-center justify-center">
                      {/* Background decorative gradient blobs */}
                      <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-200/40 to-blue-200/40 rounded-full blur-3xl top-10 left-10 animate-pulse-slow"></div>
                      <div className="absolute w-72 h-72 bg-gradient-to-r from-amber-200/40 to-rose-200/40 rounded-full blur-3xl bottom-10 right-10 animate-pulse-slower"></div>
                      
                      {/* Aesthetic image gallery with modern design */}
                      <div className="relative mx-auto w-full max-w-2xl">
                        {/* Center person in black - Main image */}
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 w-60 h-72 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] hover:shadow-[0_15px_30px_rgba(8,_112,_184,_0.4)] transition-all duration-500 group animate-float-slow">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#c4a7ff]/70 z-10 opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-pulse-very-slow"></div>
                          <img 
                            alt="Person with glasses" 
                            className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-700 animate-subtle-zoom"
                            src="/person in black.png"
                            onError={(e) => {
                              if (!isOnline) {
                                e.currentTarget.src = "/placeholder.jpg";
                              }
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 p-4 z-20 translate-y-5 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="h-1 w-10 bg-white/80 rounded-full mb-2"></div>
                            <h3 className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Creative Designer</h3>
                          </div>
                        </div>
                        
                        {/* Person in red - Angled position */}
                        <div className="absolute top-5 -left-10 w-48 h-44 rounded-2xl overflow-hidden transform rotate-[-8deg] z-30 border-2 border-white/20 shadow-[0_10px_30px_rgba(249,_115,_22,_0.2)] hover:shadow-[0_15px_30px_rgba(249,_115,_22,_0.4)] transition-all duration-500 hover:rotate-[-4deg] hover:scale-105 group animate-float-medium">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ffd280]/70 z-10 opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-pulse-slow"></div>
                          <img 
                            alt="Person in orange shirt" 
                            className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-700 animate-subtle-zoom-reverse"
                            src="/Person in red.png"
                            onError={(e) => {
                              if (!isOnline) {
                                e.currentTarget.src = "/placeholder.jpg";
                              }
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 p-4 z-20 translate-y-6 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="h-1 w-10 bg-white/80 rounded-full mb-2"></div>
                            <h3 className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Marketing Lead</h3>
                          </div>
                        </div>
                        
                        {/* Person in gray - Angled position */}
                        <div className="absolute -bottom-5 -right-10 w-48 h-44 rounded-2xl overflow-hidden transform rotate-[8deg] z-30 border-2 border-white/20 shadow-[0_10px_30px_rgba(34,_197,_94,_0.2)] hover:shadow-[0_15px_30px_rgba(34,_197,_94,_0.4)] transition-all duration-500 hover:rotate-[4deg] hover:scale-105 group animate-float-slow-reverse">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#b7e5a2]/70 z-10 opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-pulse-medium"></div>
                          <img 
                            alt="Person in pink" 
                            className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-700 animate-subtle-rotate"
                            src="/person in gray.png"
                            onError={(e) => {
                              if (!isOnline) {
                                e.currentTarget.src = "/placeholder.jpg";
                              }
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 p-4 z-20 translate-y-6 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="h-1 w-10 bg-white/80 rounded-full mb-2"></div>
                            <h3 className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Product Manager</h3>
                        </div>
                      </div>
                      
                        {/* Decorative blue card with circles */}
                        <div className="absolute left-1/2 bottom-10 -translate-x-1/2 w-40 h-40 rounded-2xl bg-gradient-to-br from-[#a0e4ff]/90 to-[#90d4ff]/90 transform rotate-[-12deg] z-20 shadow-lg flex items-center justify-center group hover:rotate-[-6deg] transition-all duration-500 hover:scale-105 border border-white/30 overflow-hidden backdrop-blur-sm">
                          <div className="relative flex items-center justify-center w-full h-full">
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full"></div>
                            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/20 rounded-full"></div>
                            <div className="flex space-x-2">
                              <div className="h-3 w-3 rounded-full bg-white animate-pulse"></div>
                              <div className="h-3 w-3 rounded-full bg-white animate-pulse delay-75"></div>
                              <div className="h-3 w-3 rounded-full bg-white animate-pulse delay-150"></div>
                              <div className="h-3 w-3 rounded-full bg-white animate-pulse delay-300"></div>
                      </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-16 left-10 text-[#10b981]">
                        <Plus className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="absolute top-32 right-10 text-[#f97316]">
                        <Circle className="h-4 w-4" fill="none" strokeWidth={2} />
                      </div>
                      <div className="absolute bottom-16 left-16 text-[#3b82f6]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="absolute bottom-36 right-20 h-2 w-2 rounded-full bg-[#f9a8d4]"></div>
                      <div className="absolute top-40 left-24 h-2 w-2 rounded-full bg-[#fcd34d]"></div>
                    </div>
                    
                    {/* User Statistics - Premium Apple 2025 Style */}
                    <div className="flex justify-center w-full mt-8">
                      <div className="flex gap-x-8 max-w-xs w-full backdrop-blur-xl bg-white/15 dark:bg-black/15 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-15px_rgba(255,255,255,0.05)] overflow-hidden relative group transition-all duration-300 hover:shadow-[0_15px_60px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_15px_60px_-15px_rgba(255,255,255,0.07)]">
                      {/* Premium glass background effects */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/10 to-white/5 dark:from-white/5 dark:via-white/2 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                      
                      {/* Active Users */}
                      <div className="text-center px-5 relative z-10 flex flex-col items-center">
                        <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 inline-block text-transparent bg-clip-text">
                          {isLoading ? (
                            <span className="inline-block h-8 w-16 bg-gray-200/50 dark:bg-gray-700/50 animate-pulse rounded-md"></span>
                          ) : (
                            formatStatNumber(userCount)
                          )}
                        </p>
                        <div className="h-1 w-8 bg-blue-500/50 rounded-full mt-2 mb-1"></div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Active Users</p>
                      </div>
                      
                      {/* Services */}
                      <div className="text-center px-5 relative z-10 flex flex-col items-center">
                        <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 inline-block text-transparent bg-clip-text">
                          {isLoading ? (
                            <span className="inline-block h-8 w-16 bg-gray-200/50 dark:bg-gray-700/50 animate-pulse rounded-md"></span>
                          ) : (
                            formatStatNumber(serviceCount)
                          )}
                        </p>
                        <div className="h-1 w-8 bg-purple-500/50 rounded-full mt-2 mb-1"></div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Services</p>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Suspense>
        
        {/* 4. PROBLEM WE SOLVE */}
        <div id="problem" className="py-12 relative scroll-mt-40 bg-white dark:bg-neutral-900 overflow-hidden">
          {/* Decorative elements */}
          
          <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1" data-aos="fade-right">
                  <h2 className="text-3xl font-semibold md:text-4xl mb-6 text-gray-900 dark:text-gray-100">The Problems Alima Solves</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                    Finding trustworthy professionals and ensuring safe transactions is challenging. Alima verifies users, vets providers, and handles payments securely.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">Untrustworthy Providers & Lack of Verification</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Traditional methods offer little verification of service provider credentials or reliability. Alima addresses this with a strict provider application and verification process.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">Limited Options for Niche Services</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Finding the right service provider often relies on word-of-mouth, limiting your choices. Alima solves this by allowing service providers to list multiple services under different categories, showcasing their diverse skill set and attracting a wider range of clients.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">Inconsistent Quality</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Without reliable reviews and ratings, service quality is unpredictable. Alima solves this by allowing clients to leave reviews and ratings for completed services, providing valuable feedback for both providers and clients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 flex justify-center" data-aos="fade-left">
                  <div className="relative">
                    <div className="w-[350px] h-[350px] md:w-[400px] md:h-[400px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-gray-200/30 dark:ring-white/10">
                      <img 
                        src="/problem we solve.png" 
                        alt="The problem we solve" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 rounded-2xl blur-2xl opacity-70"></div>
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/20 rounded-2xl blur-2xl opacity-70"></div>
                    
                    {/* Add the animated card below the main image */}
                    {/* <div className="absolute -bottom-12 right-0 transform rotate-6">
                      <AnimatedCard />
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 3. HOW IT WORKS */}
        <div id="how-it-works" className="py-24 relative scroll-mt-40 bg-white dark:bg-neutral-900 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-[0.02] pointer-events-none"></div>
          <div className="absolute -top-[20%] -right-[10%] w-[40%] h-[40%] bg-gradient-to-br from-blue-100/20 via-indigo-100/15 to-purple-100/10 dark:from-blue-900/10 dark:via-indigo-900/8 dark:to-purple-900/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto" data-aos="fade-up">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl mb-6 text-gray-900 dark:text-gray-100">How Alima Works</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Connect clients with verified service providers safely and efficiently.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {/* Step 1 */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-black/40 border border-gray-200/50 dark:border-white/5 p-8 rounded-2xl shadow-sm group" data-aos="fade-up" data-aos-delay="100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                    <UserRoundSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">Sign Up or Apply to be a Provider</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sign up as a client or apply to be a verified provider.
                  </p>
                </div>
                </div>
                
                {/* Step 2 */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-black/40 border border-gray-200/50 dark:border-white/5 p-8 rounded-2xl shadow-sm group" data-aos="fade-up" data-aos-delay="200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500/10 to-teal-500/10 dark:from-green-500/20 dark:to-teal-500/20">
                    <MessagesSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">Browse Services & Connect</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Explore services by category or location and connect with providers.
                  </p>
                </div>
                </div>
                
                {/* Step 3 */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-black/40 border border-gray-200/50 dark:border-white/5 p-8 rounded-2xl shadow-sm group" data-aos="fade-up" data-aos-delay="300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
                    <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">Secure Payment & Review</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Secure payments and leave reviews after service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 4. PROOF/PORTFOLIO - Top Service Providers Section */}
        

        {/* 5. PROOF/TESTIMONIALS */}
        <div id="testimonials" className="py-24 bg-gradient-to-b from-transparent via-neutral-50 to-transparent dark:from-transparent dark:via-neutral-950 dark:to-transparent relative scroll-mt-40">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-8 text-center" data-aos="fade-up">What Our Users Say</h2>
              
              <p className="text-gray-600 dark:text-gray-300 text-lg text-center mb-8 max-w-2xl mx-auto">
                Hear directly from clients and providers about their positive experiences with Alima.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <div className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 p-8 rounded-2xl shadow-lg relative overflow-hidden group" data-aos="fade-up" data-aos-delay="100">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-primary/20 to-green-400/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-white/20 dark:bg-white/10 mr-4 overflow-hidden">
                      <PlaceholderImage
                        src="/Wavy Buddies - Avatar.png"
                        alt="User" 
                          width={56}
                          height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">Desiree</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Business Owner</p>
                    </div>
                  </div>
                    <p className="text-base text-neutral-700 dark:text-neutral-200">"I found the perfect web developer for my e-commerce store. The entire process was smooth and the communication tools made the project easy to manage."</p>
                    <div className="flex mt-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    </div>
                  </div>
                </div>
                
                {/* Testimonial 2 */}
                <div className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 p-8 rounded-2xl shadow-lg relative overflow-hidden group" data-aos="fade-up" data-aos-delay="200">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-white/20 dark:bg-white/10 mr-4 overflow-hidden">
                      <PlaceholderImage
                        src="/Wavy Buddies - Avatar.png 1.png"
                        alt="User"
                          width={56}
                          height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">Torres</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Freelance Designer</p>
                    </div>
                  </div>
                    <p className="text-base text-neutral-700 dark:text-neutral-200">"Alima has transformed my freelance business. I've connected with clients I never would have found otherwise, and the platform handles all the payment processing."</p>
                    <div className="flex mt-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    </div>
                  </div>
                </div>
                
                {/* Testimonial 3 */}
                <div className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 p-8 rounded-2xl shadow-lg relative overflow-hidden group" data-aos="fade-up" data-aos-delay="300">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-white/20 dark:bg-white/10 mr-4 overflow-hidden">
                      <PlaceholderImage
                        src="/Wavy Buddies - Avatar.png 2.png"
                        alt="User"
                          width={56}
                          height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">Amado</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Small Business Owner</p>
                    </div>
                  </div>
                    <p className="text-base text-neutral-700 dark:text-neutral-200">"The verification system gave me confidence in hiring service providers. I've found amazing talent for multiple projects and the quality has been consistently excellent."</p>
                    <div className="flex mt-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Mission Section - Moved after testimonials */}
        <div id="mission" className="py-12 relative scroll-mt-40 bg-white dark:bg-neutral-900">
          {/* Decorative elements */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/0 dark:from-black/0 to-transparent"></div>
          <div className="absolute w-[600px] h-[600px] left-[10%] top-[20%] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
            <div className="mx-auto max-w-3xl text-center mb-20">
              <h2 className="text-3xl font-semibold md:text-5xl mb-6 text-neutral-950 dark:text-gray-100">Our Mission</h2>
              
              <p className="text-xl text-gray-600 dark:text-gray-300" data-aos="fade-up" data-aos-delay="100">
                Building a trusted platform for finding services and growing businesses securely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl p-8 shadow-lg ring-1 ring-gray-200/50 dark:ring-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-aos="fade-up" data-aos-delay="150">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-600 dark:text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-4">For Clients: Find Verified Services</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Effortlessly find and connect with trustworthy, skilled professionals through our comprehensive service listings and secure messaging.
                  </p>
                </div>

              <div className="bg-white dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl p-8 shadow-lg ring-1 ring-gray-200/50 dark:ring-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-aos="fade-up" data-aos-delay="200">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-purple-600 dark:text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                  </div>
                <h3 className="text-xl font-medium mb-4">For Providers: Grow Your Business Securely</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Apply to showcase your verified skills, connect with serious clients, and manage secure transactions all in one place.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl p-8 shadow-lg ring-1 ring-gray-200/50 dark:ring-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-aos="fade-up" data-aos-delay="250">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600 dark:text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-4">For Communities</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Foster local economies where skilled professionals thrive and communities benefit from high-quality, accessible services.
                </p>
                </div>
              </div>
              
            {/* Comment out the "Join Our Community" button */}
            {/* <div className="mt-16 text-center">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 text-white font-medium py-6 px-8 rounded-full transition-all shadow-lg hover:shadow-xl" data-aos="fade-up" data-aos-delay="300">
                <Link href="/auth/register">Join Our Community</Link>
              </Button>
            </div> */}
          </div>
        </div>
        
        {/* 6. ABOUT US */}
        <div id="about" className="py-12 bg-gradient-to-b from-transparent via-white to-transparent dark:from-transparent dark:via-black dark:to-transparent relative scroll-mt-40">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              {/* Team Section */}
              <div className="mb-24">
                <div className="mb-16 text-center" data-aos="fade-up">
                  <h2 className="mb-4 text-4xl font-medium tracking-tight md:text-5xl text-neutral-950 dark:text-gray-100">Meet Our Team</h2>
                  <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-300 px-4 font-light">
                    The passionate individuals behind Alima.
                  </p>
                </div>

                {/* Lead Founder - Featured at the top */}
                <div className="mx-auto mb-16 max-w-2xl px-4" data-aos="zoom-in" data-aos-delay="100">
                  <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200/50 dark:border-neutral-800/50 w-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                    <div className="text-center mb-8">
                      <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <PlaceholderImage
                          src="/team/Eduardo Empelis Jr..jpg"
                          alt="Eduardo Empelis Jr."
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">Eduardo Empelis Jr.</h3>
                      <p className="text-primary text-sm md:text-base font-medium">Founder</p>
                    </div>
                    <p className="text-center text-sm md:text-base text-neutral-600 dark:text-neutral-300 mb-8">
                      Founded Alima with a vision to revolutionize how people connect with service providers globally and locally.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <a href="https://www.facebook.com/eduardo.empelisjr" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Team Grid - 4 members */}
                <div className="grid gap-8 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-4">
                  {/* Team Member 1 - Kin Clark */}
                  <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200/50 dark:border-neutral-800/50 w-full h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300" 
                       data-aos="fade-up" data-aos-delay="150">
                    <div className="text-center mb-8">
                      <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <PlaceholderImage
                          src="/team/Kin Clark Perez.jpg"
                          alt="Kin Clark Perez"
                          width={144}
                          height={144}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold">Kin Clark Perez</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Co-founder & CTO</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Leads Alima's technological vision and development, driving innovation and ensuring the platform's scalability, security, and efficiency. Manages the technical team to execute the product roadmap and integrates cutting-edge technologies to align with Alima's core mission.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <a href="https://github.com/Clarkky1" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="https://www.linkedin.com/in/kin-clark-perez-164a17294/" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="https://www.facebook.com/jsbdhxhvskaixb/" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Team Member 2 - Kent */}
                  <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200/50 dark:border-neutral-800/50 w-full h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                       data-aos="fade-up" data-aos-delay="200">
                    <div className="text-center mb-8">
                      <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <PlaceholderImage
                          src="/team/Kent B. Veloso.png"
                          alt="Kent Veloso"
                          width={144}
                          height={144}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold">Kent Veloso</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Co-founder & Product Architect</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Shapes Alima's product vision from the ground up—leading the original system design while crafting a cohesive and impactful brand identity. Drives innovative product and branding strategies that align technology, design, and user experience with Alima's core mission.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <a href="https://github.com/kentveloso" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="https://www.linkedin.com/in/kent-veloso" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="https://www.facebook.com/kentbveloso" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Team Member 3 */}
                  <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200/50 dark:border-neutral-800/50 w-full h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                       data-aos="fade-up" data-aos-delay="250">
                    <div className="text-center mb-8">
                      <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <PlaceholderImage
                          src="/team/Kyle Florendo.jpg"
                          alt="Kyle Florendo"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold">Kyle Florendo</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Operations Assistant</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Coordinates Alima's projects and ensures smooth execution of operations. Also contributes to the design of the landing page and manages documentation to support the company's goals and enhance operational efficiency.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <a href="#" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="#" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="#" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Team Member 4 */}
                  <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200/50 dark:border-neutral-800/50 w-full h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                       data-aos="fade-up" data-aos-delay="300">
                    <div className="text-center mb-8">
                      <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <PlaceholderImage
                          src="/team/Lorenz Aguirre.jpg"
                          alt="Lorenz  Aguirre"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold">Lorenz  Aguirre</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Software Developer</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Develops and implements functional front-end solutions to build and enhance Alima's user interface, ensuring seamless interactions and a smooth user experience across the platform.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <a href="#" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="#" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="#" className="rounded-xl bg-neutral-100/50 p-3 text-neutral-600 hover:bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-700/50 backdrop-blur-xl transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 7. FAQ */}
        <FAQSection />
        
        {/* 8. CALL TO ACTION with Contact Section */}
        <div id="contact" className="relative py-20 overflow-hidden bg-white dark:bg-neutral-900 scroll-mt-40">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
            
            {/* Ready to Get Started Section with glass morphism */}
            <div className="max-w-5xl mx-auto p-[1px] rounded-[32px] shadow-xl bg-gradient-to-b from-white/30 to-white/10 dark:from-white/10 dark:to-white/5 backdrop-blur-xl relative overflow-hidden" 
                 data-aos="fade-up" 
                 data-aos-delay="200">
              {/* Background pattern */}
              <div className="absolute inset-0 z-0"
                   style={{
                     backgroundColor: 'transparent',
                     backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.5) 2.5px, transparent 0)',
                     backgroundSize: '30px 30px',
                     backgroundPosition: '0 0'
                   }}
              ></div>
              {/* Cursor follower */}
              <div className="opacity-0 group-hover:opacity-100 absolute -inset-2 blur-xl bg-gradient-to-r from-blue-500 to-green-400 rounded-full w-32 h-32 transition-all duration-500 cursor-none pointer-events-none" 
                   id="cursor-follower"></div>
              <div className="rounded-[28px] backdrop-blur-xl bg-white/20 dark:bg-black/20 py-16 px-8 md:py-20 md:px-12 text-center relative z-10 border-2 border-gray-200/30 shadow-lg"
                   style={{
                     boxShadow: '0 0 20px rgba(200,200,200,0.15)'
                   }}>
                <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-neutral-950 dark:text-gray-100">Ready to Get Started?</h2>
                <p className="text-xl leading-relaxed text-neutral-800 dark:text-white/90 mb-12 max-w-2xl mx-auto font-light">
                Join Alima today as a user or provider.
              </p>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0 hover:from-emerald-600 hover:to-blue-600 transition-all duration-300">
                    <Link href="/(auth)/signup">Sign Up Now</Link>
                  </Button>
                  <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0 hover:from-emerald-600 hover:to-blue-600 transition-all duration-300">
                    <Link href="/services/apply">Apply for Services</Link>
                  </Button>
                  <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0 hover:from-emerald-600 hover:to-blue-600 transition-all duration-300">
                    <Link href="/services">Browse Services</Link>
                  </Button>
              </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Why Choose Us Section - Restyled with Apple Aesthetic */}
        <section 
          id="why-choose-us" 
          className="py-24 md:py-32 lg:py-40 min-h-[90vh] flex items-center relative"
          style={{
            backgroundImage: 'url(/Why%20choose%20alima.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            filter: 'contrast(1.05) brightness(1.02)'
          }}
          data-aos="fade-up"
          data-aos-duration="800"
        > 
          {/* Overlay with reduced opacity to let more of the background show through */}
          <div className="absolute inset-0 bg-gray-50/10 dark:bg-neutral-950/20 backdrop-blur-[2px]"></div>
          
          {/* Top fade effect */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white dark:from-black to-transparent z-[1]"></div>
          
          {/* Bottom fade effect */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-black to-transparent z-[1]"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-[15%] left-[10%] w-24 h-24 bg-blue-500/15 rounded-full blur-xl animate-pulse-slow"></div>
          <div className="absolute bottom-[20%] right-[15%] w-32 h-32 bg-indigo-500/15 rounded-full blur-xl animate-pulse-medium"></div>
          <div className="absolute top-[30%] right-[10%] w-16 h-16 bg-blue-600/15 rounded-full blur-xl animate-pulse-very-slow"></div>
          
          {/* Standard container padding */}
          <div className="container px-6 md:px-8 relative z-10">
            {/* Modified grid - removed gap and added justify-end to move content to the right */}
            <div className="grid max-w-6xl mx-auto lg:grid-cols-2 items-center">
              {/* Text Content Area - Added justify-end to move content to the right */}
              <div className="flex flex-col justify-center space-y-8 lg:ml-auto lg:max-w-2xl" data-aos="fade-left" data-aos-delay="100">
                <div className="space-y-6">
                  <span className="text-sm font-medium tracking-wider uppercase text-gray-700 dark:text-gray-400">Why Join Alima?</span>
                  <h2 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-200 sm:text-5xl md:text-6xl drop-shadow-sm leading-tight">Your Filipino Service <br className="md:block hidden" /> Marketplace</h2>
                
                  <p className="max-w-2xl text-lg text-gray-700 dark:text-gray-300 md:text-xl font-light leading-relaxed">
                    Alima is your trusted Filipino service marketplace for secure connections and transactions.
                  </p>
                </div>
                {/* Features Grid */}
                <div className="grid gap-8 sm:grid-cols-2 mt-6">
                  {/* Feature 1: Verified Providers */}
                  <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/50 dark:hover:bg-black/20 p-4 rounded-xl" data-aos="fade-up" data-aos-delay="200">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-md">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verified Excellence</h3>
                      <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                        Every provider undergoes thorough verification, ensuring uncompromising quality in every interaction.
                      </p>
                    </div>
                  </div>
                  {/* Feature 2: Direct Communication */}
                  <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/50 dark:hover:bg-black/20 p-4 rounded-xl" data-aos="fade-up" data-aos-delay="300">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-md">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seamless Communication</h3>
                      <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                        Connect effortlessly through our intuitive, secure messaging system designed for clarity and privacy.
                      </p>
                    </div>
                  </div>
                  {/* Feature 3: Secure Payments */}
                  <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/50 dark:hover:bg-black/20 p-4 rounded-xl" data-aos="fade-up" data-aos-delay="400">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-md">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transparent Transactions</h3>
                      <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                        Experience worry-free payments with our secure, transparent processing system built on trust.
                      </p>
                    </div>
                  </div>
                  {/* Feature 4: Find Exactly What You Need */}
                  <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/50 dark:hover:bg-black/20 p-4 rounded-xl" data-aos="fade-up" data-aos-delay="500">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-md">
                      <UserRoundSearch className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Precision Matching</h3>
                      <p className="text-base text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                        Find exactly what you need with intelligent search tools that connect you to your perfect service match.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quote Card on the left side */}
              <div className="hidden lg:flex items-center justify-center" data-aos="fade-right" data-aos-delay="200">
                <div className="transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <QuoteCard />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Services Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">Explore Featured Services</h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Discover top services or find providers. Use filters on the Services page.
              </p>
            </div>
            <GlobalServices category="global" /> {/* Ensure this component fetches a broader range or popular services */}
          </div>
        </section>

        {/* How it Works Section */}
        {/* Assuming there is a 'How it Works' or similar section, update its content */}
        {/* I will look for a section that describes the user journey and update it */}
      </main>
      {/* Rating Dialog */}
      <RatingModal 
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        providerId={ratingData.providerId}
        providerName={ratingData.providerName}
        serviceId={ratingData.serviceId}
        serviceTitle={ratingData.serviceTitle}
        transactionId={ratingData.transactionId}
      />
      <ScrollToTop />
    </div>
  )
}
