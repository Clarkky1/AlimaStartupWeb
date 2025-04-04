"use client"

import { useState, useEffect } from "react"
import { ServiceCard } from "@/components/ui/service-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { initializeFirebase } from "@/app/lib/firebase"
import { useCategory } from "./category-section"
import { Button } from "../ui/button"

// Define the service interface
interface ServiceProvider {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  hasRating: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  image: string;
  provider: ServiceProvider;
}

// Global service categories mapping for filtering
const globalCategoryMapping: Record<string, string[]> = {
  "Development": ["development"],
  "Design": ["design"],
  "Marketing": ["marketing"],
  "Mobile Apps": ["mobile-apps"],
  "Writing": ["writing"],
  "Video": ["video"],
  "Photography": ["photography"],
  "Music": ["music"],
  "Education": ["education"],
  "Translation": ["translation"],
};

// Mock data as fallback if Firestore isn't available
const mockGlobalServices: Service[] = [
  {
    id: "fs1",
    title: "Professional Web Development",
    description: "Custom websites built with React, Next.js, and other modern frameworks. Mobile responsive design included.",
    price: "15,000",
    category: "development",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop",
    provider: {
      id: "p1",
      name: "Kin Clark Perez",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Quezon City",
      rating: 4.9,
      hasRating: true,
    },
  },
  {
    id: "fs2",
    title: "Logo & Brand Identity Design",
    description: "Professional logo design and complete brand identity package with unlimited revisions.",
    price: "8,000",
    category: "design",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2064&auto=format&fit=crop",
    provider: {
      id: "p2",
      name: "Kent Veloso",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Makati City",
      rating: 4.8,
      hasRating: true,
    },
  },
  {
    id: "fs3",
    title: "Social Media Marketing",
    description: "Comprehensive social media strategy and management across all platforms to grow your audience.",
    price: "12,000",
    category: "marketing",
    image: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?q=80&w=2070&auto=format&fit=crop",
    provider: {
      id: "p3",
      name: "Kyle Florendo",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Pasig City",
      rating: 4.6,
      hasRating: true,
    },
  },
  {
    id: "fs4",
    title: "Professional Translation",
    description: "Accurate translation services for documents, websites and technical content. Multiple languages available.",
    price: "2,500",
    category: "translation",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop",
    provider: {
      id: "p4",
      name: "Lorenz Gabriel",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Manila",
      rating: 4.7,
      hasRating: true,
    },
  },
]

interface GlobalServicesProps {
  category?: 'global' | 'recent';
  expandable?: boolean;
}

export function GlobalServices({ category = 'recent', expandable = false }: GlobalServicesProps) {
  const { selectedGlobalCategory } = useCategory();
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchGlobalServices() {
      try {
        const { db } = await initializeFirebase()
        if (!db) {
          console.error("Failed to initialize Firebase")
          // Fallback to mock data if Firebase initialization fails
          setTimeout(() => {
            setServices(mockGlobalServices)
            setLoading(false)
          }, 1000)
          return
        }

        const { collection, query, where, getDocs, orderBy, limit, getDoc, doc } = await import("firebase/firestore")
        
        let q;
        try {
          const baseQuery = collection(db, "services");
          
          if (category === 'global') {
            // Query for global services
            q = query(
              baseQuery,
              where("active", "==", true),
              where("isGlobalService", "==", true),
              orderBy("rating", "desc"),
              limit(12)
            );
          } else {
            // Query for recent services
            q = query(
              baseQuery,
              where("active", "==", true),
              orderBy("createdAt", "desc"),
              limit(4)
            );
          }
        } catch (error) {
          console.log("Using fallback sorting by rating:", error);
          // Fallback query if createdAt doesn't exist or isn't indexed
          const baseQuery = collection(db, "services");
          
          if (selectedGlobalCategory && globalCategoryMapping[selectedGlobalCategory]) {
            const categoryFilters = globalCategoryMapping[selectedGlobalCategory];
            q = query(
              baseQuery,
              where("active", "==", true),
              where("category", "in", categoryFilters),
              orderBy("rating", "desc"),
              limit(12)
            );
          } else {
            q = query(
              baseQuery,
              where("active", "==", true),
              orderBy("rating", "desc"),
              limit(12)
            );
          }
        }
        
        const querySnapshot = await getDocs(q)
        const servicesData: Service[] = []
        
        if (querySnapshot.empty) {
          // If no services found in Firestore, use mock data
          setServices(mockGlobalServices)
        } else {
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data()
            let providerData: any = {}
            
            try {
              // Get provider details from users collection
              const providerRef = doc(db, "users", data.providerId)
              const providerDoc = await getDoc(providerRef)
              if (providerDoc.exists()) {
                providerData = providerDoc.data()
              }
            } catch (error) {
              console.error("Error fetching provider:", error)
            }
            
            servicesData.push({
              id: docSnap.id,
              title: data.title || "Service",
              description: data.description || "No description available",
              price: data.price || "0",
              category: data.category || "other",
              image: data.image || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop",
              provider: {
                id: data.providerId || "unknown",
                name: providerData?.displayName || providerData?.name || "Service Provider",
                avatar: providerData?.photoURL || providerData?.profilePicture || "/person-male-1.svg?height=50&width=50",
                location: providerData?.location || "Philippines",
                rating: data.rating || 0,
                hasRating: data.rating > 0
              },
            })
          }
          
          if (servicesData.length > 0) {
            setServices(servicesData)
          } else {
            setServices(mockGlobalServices)
          }
        }
      } catch (error) {
        console.error("Error fetching global services:", error)
        toast({
          title: "Error",
          description: "Failed to load services. Using sample data instead.",
          variant: "destructive",
        })
        // Fallback to mock data on error
        setServices(mockGlobalServices)
      } finally {
        setLoading(false)
      }
    }

    fetchGlobalServices()
  }, [toast, selectedGlobalCategory, category])

  // Filter services based on selected category
  useEffect(() => {
    if (selectedGlobalCategory && globalCategoryMapping[selectedGlobalCategory]) {
      const categoryFilters = globalCategoryMapping[selectedGlobalCategory];
      setFilteredServices(services.filter(service => categoryFilters.includes(service.category)));
    } else {
      setFilteredServices(services);
    }
  }, [selectedGlobalCategory, services]);

  // Modify display logic to handle expansion
  const displayServices = filteredServices.length > 0 ? filteredServices : services;
  const limitedServices = isExpanded ? displayServices : displayServices.slice(0, 4);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(isExpanded ? services : services.slice(0, 4)).map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.description}
                price={service.price}
                category={service.category}
                image={service.image}
                provider={service.provider}
                showRating={true}
              />
            ))}
          </div>
          {expandable && services.length > 4 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show Less" : "Show More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
