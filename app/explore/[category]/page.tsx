import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PopularCategories } from "@/components/popular/popular-categories"
import { TopProviders } from "@/components/popular/top-providers"

export default function PopularTodayPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Popular Services</h1>
        <PopularCategories />
        <h2 className="mb-6 mt-12 text-2xl font-semibold">Top Service Providers</h2>
        <TopProviders />
      </main>
      <Footer />
    </div>
  )
}

