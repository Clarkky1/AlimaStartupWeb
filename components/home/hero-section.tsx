"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"

export function HeroSection() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <section className="relative flex justify-center items-start py-4 md:py-8 w-full px-4 sm:px-6 md:px-8">
      <div className="relative w-full max-w-screen-2xl rounded-3xl overflow-hidden">
        <img 
          alt="Background" 
          className="w-full h-auto object-cover" 
          src="/HomeBanner.svg"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 md:px-32">
          <h1 className="text-2xl sm:text-4xl md:text-7xl font-bold text-white leading-tight">
            Empower <br />
            Excel <br />
            Earn
          </h1>
          <p className="mt-2 md:mt-4 text-xs sm:text-sm md:text-lg text-white">
            Discover opportunities and unlock your potential with <span className="font-bold">Alima</span>.
          </p>
        </div>
      </div>
    </section>
  )
}
