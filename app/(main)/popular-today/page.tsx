"use client"

import { PopularServices } from "@/components/popular/popular-services"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { TopProviders } from "@/components/popular/top-providers"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// Client component for animations
const AnimationStyles = () => {
  useEffect(() => {
    // Only run on client-side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Use style jsx directly in the component rather than returning it
  return (
    <style jsx global>{`
      @keyframes float-slow {
        0% { transform: translate(0, 0); }
        50% { transform: translate(30px, 30px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes float-medium {
        0% { transform: translate(0, 0); }
        50% { transform: translate(-30px, -30px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes float-fast {
        0% { transform: translate(0, 0); }
        50% { transform: translate(25px, -25px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes float-reverse {
        0% { transform: translate(0, 0); }
        50% { transform: translate(-25px, 15px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes float-slow-reverse {
        0% { transform: translate(0, 0); }
        50% { transform: translate(-30px, 20px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes float-medium-alt {
        0% { transform: translate(0, 0); }
        50% { transform: translate(25px, 15px); }
        100% { transform: translate(0, 0); }
      }
      .animate-float-slow {
        animation: float-slow 18s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
      .animate-float-medium {
        animation: float-medium 16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
      .animate-float-fast {
        animation: float-fast 14s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
      .animate-float-reverse {
        animation: float-reverse 15s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
      .animate-float-slow-reverse {
        animation: float-slow-reverse 17s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
      .animate-float-medium-alt {
        animation: float-medium-alt 19s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
    `}</style>
  )
}

export default function PopularTodayPage() {
  const router = useRouter()
  const [pathname, setPathname] = useState("")
  
  useEffect(() => {
    // Safely get the current pathname on client-side only
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
      // Scroll to top on page load
      window.scrollTo(0, 0)
    }
    
    // Force a refresh when the component mounts
    router.refresh()
  }, [router])
  
  // Update pathname when needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRouteChange = () => {
        setPathname(window.location.pathname)
        router.refresh()
      }
      
      window.addEventListener('popstate', handleRouteChange)
      return () => window.removeEventListener('popstate', handleRouteChange)
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white">
      {/* Add animation styles */}
      <AnimationStyles />
      
      {/* Minimal spacing for fixed navbar */}
      <div className="pt-4 md:pt-6"></div>
      
      {/* Hero Section with premium Apple-inspired glassmorphism */}
      <div className="relative overflow-hidden min-h-[65vh] isolate flex items-center justify-center"
           style={{ 
             background: "linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.8) 100%)",
             backgroundSize: "cover",
             backgroundPosition: "center"
           }}>
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white dark:from-black to-transparent z-10 pointer-events-none"></div>
          
        {/* Premium gradient background base */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white/80 to-teal-50/70 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-blue-900/90"></div>
        
        {/* Animated background gradient circles - Apple-style blue and green */}
        <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-gradient-to-r from-blue-400/50 to-blue-300/40 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-gradient-to-r from-teal-400/50 to-green-300/40 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-[30%] right-[10%] w-[60%] h-[60%] bg-gradient-to-r from-sky-400/45 to-cyan-300/35 rounded-full blur-2xl animate-float-fast"></div>
        
        {/* Additional accent gradients */}
        <div className="absolute bottom-[20%] left-[25%] w-[50%] h-[50%] bg-gradient-to-tr from-green-300/40 to-cyan-400/30 rounded-full blur-2xl animate-float-slow-reverse"></div>
        <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-gradient-to-br from-indigo-300/40 to-blue-400/30 rounded-full blur-xl animate-float-medium-alt"></div>
        
        {/* Premium glassmorphism overlay */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10 dark:bg-black/5 z-0"></div>
        
        {/* Content with premium styling */}
        <div className="container relative mx-auto px-6 z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="mb-6 text-6xl font-semibold tracking-tight text-slate-800 dark:text-white md:text-7xl bg-clip-text"
                style={{ 
                  textShadow: '0 2px 10px rgba(0,0,0,0.04), 0 0 30px rgba(59, 130, 246, 0.3)',
                  WebkitTextStroke: '1px rgba(59, 130, 246, 0.2)'
                }}>
              Discover Services Near & Far
            </h1>
            <p className="mx-auto text-xl md:text-2xl leading-relaxed text-slate-600 dark:text-slate-200 max-w-2xl font-light"
               style={{ textShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              From skilled local handymen to top digital professionals — find the perfect talent for any job.
            </p>
          </div>
        </div>
        
        {/* Glowing accent at bottom */}
        <div className="absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/40 to-green-400/40 blur-3xl"></div>
        <div className="absolute -bottom-12 left-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-orange-400/30 to-yellow-400/30 blur-3xl"></div>
        <div className="absolute -bottom-16 right-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
        
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
      </div>
      
      {/* Main content with premium styling */}
      <main className="flex-1 py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl lg:max-w-6xl">
            <div className="relative space-y-12">
              <div className="absolute -top-4 left-1/4 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl"></div>
              <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-primary/20 blur-3xl"></div>
              
              <section>
                <Suspense fallback={
                  <div className="space-y-6">
                    <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-[300px] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  </div>
                }>
                  <PopularServices key={pathname} />
                </Suspense>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

