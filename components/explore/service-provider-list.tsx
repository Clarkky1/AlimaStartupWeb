"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MessageSquare, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Service {
  id: string
  title: string
  description: string
  price: number
  image: string
  category: string
  providerId: string
  providerName: string
  providerAvatar: string
  rating: number
  reviewCount: number
}

const categories = [
  "All",
  "Development",
  "Design",
  "Marketing",
  "Mobile Apps",
  "Writing",
  "Video",
  "Photography",
  "Music",
  "Education",
  "Translation",
  "Business",
  "Lifestyle",
]

export function ServiceProviderList({ category }: { category: string }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedCategory, setSelectedCategory] = useState(category || "All")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchServices() {
      try {
        const { db } = await initializeFirebase()
        if (!db) {
          toast({
            title: "Error",
            description: "Failed to initialize Firebase",
            variant: "destructive",
          })
          return
        }

        let q = query(
          collection(db, "services"),
          where("active", "==", true),
          orderBy(sortBy === "price" ? "price" : "rating", sortBy === "price-asc" ? "asc" : "desc"),
          limit(20)
        )

        if (selectedCategory !== "All") {
          q = query(
            collection(db, "services"),
            where("active", "==", true),
            where("category", "==", selectedCategory),
            orderBy(sortBy === "price" ? "price" : "rating", sortBy === "price-asc" ? "asc" : "desc"),
            limit(20)
          )
        }

        const querySnapshot = await getDocs(q)
        const servicesData: Service[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Service, "id">
          if (data.price >= priceRange[0] && data.price <= priceRange[1]) {
            servicesData.push({
              id: doc.id,
              ...data,
              rating: Number(data.rating),
            })
          }
        })

        // Fetch provider data for each service
        const servicesWithProviders = await Promise.all(
          servicesData.map(async (service) => {
            try {
              const providerDoc = await getDoc(doc(db, "users", service.providerId))
              if (providerDoc.exists()) {
                const providerData = providerDoc.data()
                return {
                  ...service,
                  providerName: providerData.displayName || "Service Provider",
                  providerAvatar: providerData.photoURL || "/person-male-1.svg?height=50&width=50",
                }
              }
            } catch (error) {
              console.error(`Error fetching provider data for service ${service.id}:`, error)
            }
            return {
              ...service,
              providerName: "Service Provider",
              providerAvatar: "/person-male-1.svg?height=50&width=50",
            }
          })
        )

        setServices(servicesWithProviders)
      } catch (error: any) {
        console.error("Error fetching services:", error)
        toast({
          title: "Error",
          description: "Failed to fetch services. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [category, sortBy, selectedCategory, priceRange, toast])

  // Filter services based on search term
  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.providerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading services...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search services or providers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating (High to Low)</SelectItem>
              <SelectItem value="price">Price (High to Low)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Services</SheetTitle>
                <SheetDescription>
                  Set your preferences to find the perfect service
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value), priceRange[1]])
                      }
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value)])
                      }
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border">
          <div className="text-center">
            <p className="text-lg font-medium">No services found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or search term
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium text-white">
                        {service.category}
                      </span>
                    </div>
                    <p className="text-sm text-white/80">{service.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-white">
                            {service.rating} ({service.reviewCount})
                          </span>
                        </div>
                        <span className="text-lg font-bold text-white">₱{service.price}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:text-white/80"
                        onClick={() => router.push(`/chat/${service.providerId}`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
