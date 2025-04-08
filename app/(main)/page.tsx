"use client"

import { HeroSection } from "@/components/home/hero-section"
import { GlobalServices } from "@/components/home/featured-services"
import { TopProviders } from "@/components/popular/top-providers"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { CheckCircle, Search, MessageSquare, CreditCard } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white">
      <main className="flex-1">
        <Suspense fallback={<div className="h-[600px] w-full bg-neutral-100 dark:bg-neutral-900" />}>
          <HeroSection />
        </Suspense>
        
        {/* How It Works Section */}
        <div className="py-20 bg-neutral-50 dark:bg-neutral-950">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl lg:max-w-6xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-3">How Alima Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-16">
                Our platform makes it easy to connect with the right service providers or find clients for your services
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Step 1 */}
                <div className="flex flex-col items-center p-6">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Discover</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Browse through verified service providers or post your service offering
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center p-6">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Select</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Choose the perfect match based on reviews, portfolio, and pricing
                  </p>
                </div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center p-6">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Communicate directly to discuss requirements and expectations
                  </p>
                </div>
                
                {/* Step 4 */}
                <div className="flex flex-col items-center p-6">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Transact</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Secure payment and delivery system with satisfaction guarantee
                  </p>
                </div>
              </div>
              
              <div className="mt-12">
                <Link href="/signup" className={buttonVariants({ className: "rounded-full px-8" })}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Top Service Providers</h2>
                <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
                  Discover the most trusted and highly-rated service providers on our platform.
                </p>
              </div>
              
              <div className="relative">
                <Suspense fallback={<div className="h-[300px] w-full bg-neutral-100 dark:bg-neutral-900 rounded-3xl" />}>
                  <TopProviders />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <div className="relative py-16 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-blue-300/20 to-primary/20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-primary/20 to-blue-300/20 blur-3xl"></div>
          
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join Alima today and connect with skilled professionals or find new clients for your services.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup" className={buttonVariants({ size: "lg", className: "rounded-full px-8" })}>
                  Sign up now
                </Link>
                <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full px-8" })}>
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
