"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PopularServices } from "@/components/popular/popular-services"
import { Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PopularTodayPage() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Force a refresh when the component mounts or pathname changes
    router.refresh()
  }, [pathname, router])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="space-y-12">
          <section>
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[300px] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            }>
              <PopularServices key={pathname} />
            </Suspense>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

