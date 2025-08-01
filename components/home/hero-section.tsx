"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { Plus, Circle } from "lucide-react"
import { useStatistics } from "@/app/hooks/useStatistics"
import { useEffect, useState } from "react"
import { useNetworkStatus } from "@/app/context/network-status-context"
import Link from "next/link"

// Format numbers with K suffix (e.g., 15300 -> 15.3K)
function formatStatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function HeroSection() {
  const router = useRouter()
  const { user } = useAuth()
  const { userCount, serviceCount, isLoading } = useStatistics()
  const { isOnline } = useNetworkStatus()
  
  // Directly use guaranteed working images
  const images = {
    topLeft: isOnline ? "/testimonial-1.jpg" : "/placeholder.jpg",
    topRight: isOnline ? "/testimonial-2.jpg" : "/placeholder.jpg",
    bottomRight: isOnline ? "/testimonial-3.jpg" : "/placeholder.jpg"
  }
  
  return (
    <section className="relative overflow-hidden pt-6 pb-16 md:pt-4 md:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-white dark:bg-black"></div>
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 h-4 w-4 rounded-full bg-purple-300"></div>
        <div className="absolute bottom-1/4 right-1/3 h-6 w-6 rounded-full bg-blue-200"></div>
        <div className="absolute top-1/3 right-1/4 h-10 w-10 text-green-300">
          <Plus className="h-full w-full" strokeWidth={1} />
        </div>
        <div className="absolute bottom-1/3 left-1/3 h-8 w-8 text-blue-200">
          <Plus className="h-full w-full" strokeWidth={1} />
        </div>
      </div>
      
      <div className="container mx-auto px-4 pt-0 sm:pt-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-6 md:gap-8 md:grid-cols-2">
            <div className="order-1 text-left" data-aos="fade-right">
              {/* Premium subtle decorative elements */}
              <div className="absolute -left-12 -top-12 w-48 h-48 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
              <div className="absolute right-0 bottom-12 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl relative" data-aos="fade-up" data-aos-delay="100">
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300 drop-shadow-sm">Empower</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 drop-shadow-sm">Excel</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 drop-shadow-sm">Earn</span>
              </h1>
              
              <p className="mt-4 md:mt-6 text-lg text-neutral-600 dark:text-neutral-300 md:text-xl max-w-md backdrop-blur-sm relative" data-aos="fade-up" data-aos-delay="200">
                Discover opportunities and unlock your potential with <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-900 dark:from-white dark:to-gray-200">Alima</span>.
              </p>
              
              <div className="mt-6 md:mt-10 flex flex-col sm:flex-row w-full gap-3">
                <Button asChild size="lg" className="rounded-full px-8 w-full sm:w-auto min-w-[180px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-[0_8px_30px_rgba(59,130,246,0.2)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                  <Link href="/services">Browse Services</Link>
                </Button>
                <a 
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/40 backdrop-blur-sm text-gray-800 dark:text-gray-200 hover:bg-white hover:text-blue-600 dark:hover:bg-black/60 dark:hover:text-blue-400 h-12 rounded-full px-8 shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.03)] dark:hover:shadow-[0_8px_20px_rgba(255,255,255,0.05)] transition-all duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("how-it-works");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  How It Works
                </a>
              </div>
            </div>
            
            <div className="relative order-2 lg:order-2" data-aos="fade-left" data-aos-delay="300">
              {/* Stats panel - moved to top */}
              <div className="flex items-center justify-between mb-4 md:mb-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-xl p-4 shadow-lg" data-aos="fade-up" data-aos-delay="100">
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-primary">{isLoading ? (
                    <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></span>
                  ) : (
                    formatStatNumber(userCount)
                  )}</p>
                  <p className="text-sm text-neutral-500">Users</p>
                </div>
                <div className="text-center px-4 border-x border-gray-200 dark:border-gray-800">
                  <p className="text-2xl font-bold text-primary">{isLoading ? (
                    <span className="inline-block h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></span>
                  ) : (
                    formatStatNumber(serviceCount)
                  )}</p>
                  <p className="text-sm text-neutral-500">Services</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-primary">2</p>
                  <p className="text-sm text-neutral-500">Providers</p>
                </div>
              </div>
              
              {/* Modern colorful panels with people - updated to match reference image */}
              <div className="relative h-[400px] sm:h-[500px] flex items-center justify-center">
                <div className="relative grid grid-cols-2 grid-rows-2 gap-4 sm:gap-6 max-w-md mx-auto">
                  {/* Top-left person - orange shirt */}
                  <div className="relative bg-[#ffd280] rounded-2xl overflow-hidden shadow-lg transform rotate-2 z-10" data-aos="fade-right" data-aos-delay="150">
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full"></div>
                    <img 
                      alt="Person in orange shirt" 
                      className="w-full h-48 object-cover object-top"
                      src={images.topLeft}
                    />
                  </div>
                  
                  {/* Top-right person - person with glasses */}
                  <div className="relative bg-[#c4a7ff] rounded-2xl overflow-hidden shadow-lg transform -rotate-1 translate-y-4 z-20" data-aos="fade-down" data-aos-delay="200">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-white/30 rounded-full"></div>
                    <img 
                      alt="Person with glasses" 
                      className="w-full h-52 object-cover object-top"
                      src={images.topRight}
                    />
                  </div>
                  
                  {/* Bottom-left - decorative element */}
                  <div className="relative bg-[#a0e4ff] rounded-2xl overflow-hidden shadow-lg transform -rotate-3 z-20 flex items-center justify-center h-32" data-aos="fade-up" data-aos-delay="250">
                    <div className="absolute w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                        <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                        <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                        <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom-right person - person in pink */}
                  <div className="relative bg-[#b7e5a2] rounded-2xl overflow-hidden shadow-lg transform rotate-1 -translate-y-2 z-10" data-aos="fade-left" data-aos-delay="300">
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-white/30 rounded-full"></div>
                    <img 
                      alt="Person in pink" 
                      className="w-full h-48 object-cover object-top"
                      src={images.bottomRight}
                    />
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-1/3 right-1/3 text-[#10b981]">
                  <Plus className="h-6 w-6" strokeWidth={1.5} />
                </div>
                
                <div className="absolute bottom-1/4 left-1/3 text-[#3b82f6]">
                  <Circle className="h-4 w-4" fill="#3b82f6" strokeWidth={0} />
                </div>
                
                <div className="absolute top-1/2 right-1/4 h-3 w-3 rounded-full bg-[#f9a8d4]"></div>
                <div className="absolute bottom-1/3 left-1/4 h-3 w-3 rounded-full bg-[#fcd34d]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 