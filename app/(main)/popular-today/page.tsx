"use client"

import { PopularServices } from "@/components/popular/popular-services"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { TopProviders } from "@/components/popular/top-providers"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function PopularTodayPage() {
  const router = useRouter()
  const [pathname, setPathname] = useState("")
  
  useEffect(() => {
    // Safely get the current pathname on client-side only
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-neutral-100 to-white py-16 dark:from-neutral-900 dark:to-black">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-6 text-5xl font-semibold tracking-tight md:text-6xl">Popular Today</h1>
            <p className="mx-auto text-xl leading-relaxed text-neutral-600 dark:text-neutral-300">
              Discover trending services and top providers that our users love.
            </p>
          </div>
        </div>
        <div className="absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"></div>
      </div>
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mx-auto max-w-5xl lg:max-w-6xl">
            <div className="relative space-y-8">
              <div className="absolute -top-4 left-1/4 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl"></div>
              <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-primary/20 blur-3xl"></div>
              
              <section>
                <Suspense fallback={
                  <div className="space-y-4">
                    <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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

