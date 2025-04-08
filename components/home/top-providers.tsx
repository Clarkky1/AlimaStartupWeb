"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarIcon, MapPinIcon, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { initializeFirebase } from "@/app/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Provider {
  id: string
  name: string
  avatar: string
  rating: number
  location: string
  primaryCategory: string
  totalServices: number
  totalReviews: number
}

export function TopProviders() {
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const providersContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = providersContainerRef.current
    if (!container || providers.length === 0) return
    
    let scrollAmount = 0
    const cardWidth = 316
    const totalWidth = cardWidth * providers.length
    
    const interval = setInterval(() => {
      scrollAmount += 1
      container.scrollLeft += 1
      
      if (scrollAmount >= totalWidth - container.clientWidth) {
        container.scrollLeft = 0
        scrollAmount = 0
      }
    }, 30)
    
    return () => clearInterval(interval)
  }, [providers])

  useEffect(() => {
    async function fetchTopProviders() {
      try {
        const { db } = await initializeFirebase()
        if (!db) {
          throw new Error("Firebase DB not initialized")
        }

        // First, get a list of provider users
        const q = query(
          collection(db, "users"),
          where("role", "==", "provider"),
          where("isActive", "==", true),
          orderBy("rating", "desc"),
          limit(10) // Fetch more to ensure we have enough after filtering
        )

        const querySnapshot = await getDocs(q)
        const providersData: Provider[] = []
        
        // Additional validation to ensure providers are legitimate
        for (const doc of querySnapshot.docs) {
          try {
            const data = doc.data()
            
            // Additional validation to check for required fields and data
            // Only include providers that have all required profile information
            // This helps filter out incomplete or fake provider accounts
            if (!data.email || !data.profile || !data.profile.displayName) {
              console.log(`Provider ${doc.id} has incomplete profile information, skipping`)
              continue
            }
            
            // Check if the provider has at least one service
            const { collection, query, where, getDocs } = await import("firebase/firestore")
            const serviceQuery = query(
              collection(db, "services"),
              where("providerId", "==", doc.id),
              limit(1)
            )
            const serviceSnapshot = await getDocs(serviceQuery)
            
            // Skip providers with no services
            if (serviceSnapshot.empty) {
              console.log(`Provider ${doc.id} has no services, skipping`)
              continue
            }
            
            providersData.push({
              id: doc.id,
              name: data.profile?.displayName || "Service Provider",
              avatar: data.profile?.profilePicture || "/person-male-1.svg?height=50&width=50",
              rating: data.rating || 4.0,
              location: data.profile?.location || "Philippines",
              primaryCategory: data.primaryCategory || "General Services",
              totalServices: data.stats?.totalServices || 0,
              totalReviews: data.stats?.totalReviews || 0
            })
            
            // Limit to 6 valid providers
            if (providersData.length >= 6) break
          } catch (error) {
            console.error(`Error processing provider ${doc.id}:`, error)
          }
        }

        setProviders(providersData)
      } catch (error) {
        console.error("Error fetching top providers:", error)
        toast({
          title: "Error",
          description: "Failed to load top service providers",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTopProviders()
  }, [toast])

  const handleMessage = (providerId: string) => {
    router.push(`/message/${providerId}`)
  }

  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Top Service Providers</h2>
        
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent"></div>
          <div className="absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent"></div>

          <div
            id="providers-container"
            ref={providersContainerRef} 
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {providers.map((provider) => (
                  <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <img 
                          src={provider.avatar} 
                          alt={provider.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">{provider.primaryCategory}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {provider.rating.toFixed(1)} ({provider.totalReviews} reviews)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{provider.location}</span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {provider.totalServices} services offered
                        </div>
                      </div>
                      
                      <Button
                        className="w-full mt-4"
                        onClick={() => handleMessage(provider.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
