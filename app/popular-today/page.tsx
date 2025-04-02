"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PopularCategories } from "@/components/popular/popular-categories"
import { PopularServices } from "@/components/popular/popular-services"
import { TopProviders } from "@/components/popular/top-providers"

export default function PopularTodayPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="space-y-12">
          <section>
            <PopularServices />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

