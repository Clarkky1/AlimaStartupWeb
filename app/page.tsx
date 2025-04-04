"use client"

import { HeroSection } from "@/components/home/hero-section"
import { GlobalServices } from "@/components/home/featured-services"
import { Testimonials } from "@/components/home/testimonials"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TopProviders } from "@/components/popular/top-providers"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="h-[600px] w-full bg-background" />}>
          <HeroSection />
        </Suspense>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Recently Added Services</h2>
            <Link href="/popular-today" className={buttonVariants({ variant: "outline" })}>
              View All Services
            </Link>
          </div>
          <Suspense fallback={<div className="h-[400px] w-full bg-background" />}>
            <GlobalServices category="recent" expandable={true} />
          </Suspense>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">Top Service Providers</h2>
          </div>
          <Suspense fallback={<div className="h-[300px] w-full bg-background" />}>
            <TopProviders />
          </Suspense>
        </div>

        <Suspense fallback={<div className="h-[400px] w-full bg-background" />}>
          <Testimonials />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
