"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin } from "lucide-react"
import { initializeFirebase } from "@/app/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { ContactModal } from "@/components/messages/contact-modal"

interface Provider {
  id: string
  name: string
  avatar: string
  rating: number
  reviewCount: number
  category: string
  title: string
  location: string
}

// Mock data for initial render
const mockProviders: Provider[] = [
  {
    id: "1",
    name: "Kin Clark Perez",
    avatar: "/person-male-1.svg?height=50&width=50",
    rating: 4.9,
    reviewCount: 124,
    category: "development",
    title: "Full Stack Developer",
    location: "Quezon City"
  },
  {
    id: "2",
    name: "Kent Veloso",
    avatar: "/person-male-1.svg?height=50&width=50",
    rating: 4.8,
    reviewCount: 98,
    category: "design",
    title: "UI/UX Designer",
    location: "Makati City"
  },
  {
    id: "3",
    name: "Rye Nicholas ",
    avatar: "/person-male-1.svg?height=50&width=50",
    rating: 4.7,
    reviewCount: 87,
    category: "marketing",
    title: "Digital Marketing Specialist",
    location: "Taguig City"
  },
  {
    id: "4",
    name: "Alyssa Alegre",
    avatar: "/person-male-1.svg?height=50&width=50",
    rating: 4.9,
    reviewCount: 112,
    category: "writing",
    title: "Content Writer",
    location: "Mandaluyong City"
  },
  {
    id: "5",
    name: "Paul",
    avatar: "/person-male-1.svg?height=50&width=50",
    rating: 4.6,
    reviewCount: 78,
    category: "pc-smartphone",
    title: "Tech Repair Specialist",
    location: "Pasig City"
  },
  {
    id: "6",
    name: "Ma'am Dean",
    avatar: "/person-male-1.svg?height=50&width=50",
    rating: 4.8,
    reviewCount: 91,
    category: "academic-tutorial",
    title: "Math Tutor",
    location: "Manila"
  }
]

export function TopProviders({ category }: { category?: string }) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const providersContainerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll functionality
  useEffect(() => {
    const container = providersContainerRef.current;
    if (!container || providers.length === 0) return;
    
    let scrollAmount = 0;
    const cardWidth = 316; // Width of card (300px) + gap (16px)
    const totalWidth = cardWidth * providers.length;
    
    const interval = setInterval(() => {
      scrollAmount += 1;
      container.scrollLeft += 1;
      
      // Reset scroll position when reaching the end
      if (scrollAmount >= totalWidth - container.clientWidth) {
        container.scrollLeft = 0;
        scrollAmount = 0;
      }
    }, 30); // Adjust speed by changing this value
    
    return () => clearInterval(interval);
  }, [providers]);

  useEffect(() => {
    async function fetchProviders() {
      try {
        // Use real Firebase data
        const { db } = await initializeFirebase()
        
        if (!db) {
          console.error("Failed to initialize Firebase")
          setLoading(false)
          return
        }
        
        const { collection, query, where, getDocs, orderBy, limit } = await import("firebase/firestore")
        
        let q;
        
        if (category) {
          q = query(
            collection(db, "users"),
            where("role", "==", "provider"),
            where("primaryCategory", "==", category),
            orderBy("rating", "desc"),
            limit(6)
          )
        } else {
          q = query(
            collection(db, "users"),
            where("role", "==", "provider"),
            orderBy("rating", "desc"),
            limit(6)
          )
        }
        
        const querySnapshot = await getDocs(q)
        const providersData: Provider[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          providersData.push({
            id: doc.id,
            name: data.displayName || "Service Provider",
            avatar: data.profilePicture || "/person-male-1.svg?height=50&width=50",
            rating: data.rating || 4.5,
            reviewCount: data.reviewCount || 0,
            category: data.primaryCategory || "development",
            title: data.title || "Service Provider",
            location: data.location || "Philippines"
          })
        })
        
        if (providersData.length > 0) {
          setProviders(providersData)
        } else {
          // Fallback to mock data if no providers found
          if (category) {
            const filtered = mockProviders.filter(provider => provider.category === category)
            setProviders(filtered.length > 0 ? filtered : mockProviders)
          } else {
            setProviders(mockProviders)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching providers:", error)
        setLoading(false)
        
        // Fallback to mock data on error
        if (category) {
          const filtered = mockProviders.filter(provider => provider.category === category)
          setProviders(filtered.length > 0 ? filtered : mockProviders)
        } else {
          setProviders(mockProviders)
        }
      }
    }

    fetchProviders()
  }, [category])

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
          }`}
        />
      ))
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden">
        <div className="flex gap-6 overflow-x-auto pb-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="min-w-[300px]">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="mt-4 h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-center text-muted-foreground">
          No top providers found for this category. Please check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent"></div>

      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent"></div>

      <div
        id="providers-container"
        ref={providersContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className="min-w-[300px]"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <img
                    src={provider.avatar || "/person-male-1.svg"}
                    alt={provider.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">{provider.title}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                <span>{provider.location}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center">
                  {renderStars(provider.rating)}
                  <span className="ml-2 text-sm font-medium">{provider.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
