"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { initializeFirebase } from "@/app/lib/firebase"
import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore"

// Define types
interface ServiceProvider {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: string | number;
  category: string;
  image: string;
  provider: ServiceProvider;
  type: "global" | "local";
}

// Global service categories
const globalCategories = [
  "all-global",
  "development",
  "design", 
  "marketing",
  "mobile-apps",
  "writing",
  "video",
  "photography",
  "music",
  "education",
  "translation",
] as const;

// Local service categories
const localCategories = [
  "all-local",
  "academic-tutorial",
  "automotive-motorcycle", 
  "digital-marketing",
  "beauty-business",
  "event-management",
  "pc-smartphone",
  "psychological",
  "property-rental",
  "electronics-electrical",
] as const;

type GlobalCategory = typeof globalCategories[number];
type LocalCategory = typeof localCategories[number];
type ServiceCategory = GlobalCategory | LocalCategory;

// Global categories label mapping
const globalCategoryLabels: Record<GlobalCategory, string> = {
  "all-global": "All Global Services",
  "development": "Development",
  "design": "Design",
  "marketing": "Marketing",
  "mobile-apps": "Mobile Apps",
  "writing": "Writing",
  "video": "Video",
  "photography": "Photography",
  "music": "Music",
  "education": "Education",
  "translation": "Translation",
};

// Local categories label mapping
const localCategoryLabels: Record<LocalCategory, string> = {
  "all-local": "All Local Services",
  "academic-tutorial": "Academic & Tutorial",
  "automotive-motorcycle": "Automotive & Motorcycle",
  "digital-marketing": "Digital Marketing",
  "beauty-business": "Beauty & Business",
  "event-management": "Event Management",
  "pc-smartphone": "PC & Smartphone",
  "psychological": "Psychological",
  "property-rental": "Property & Rental",
  "electronics-electrical": "Electronics & Electrical",
};

interface ProviderData {
  profile?: {
    displayName?: string;
    profilePicture?: string;
    location?: string;
  };
  [key: string]: any;
}

export function ServiceCarousel() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("all-global")
  const [serviceType, setServiceType] = useState<"global" | "local">("global")

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      try {
        const firebase = await initializeFirebase()
        if (!firebase.db) return

        const servicesRef = collection(firebase.db, "services")
        let q = query(servicesRef)

        // Filter by category if not "all"
        if (selectedCategory !== "all-global" && selectedCategory !== "all-local") {
          q = query(q, where("category", "==", selectedCategory))
        }

        // Filter by service type
        q = query(q, where("type", "==", serviceType))

        const querySnapshot = await getDocs(q)
        const servicesData: Service[] = []

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data()
          const providerId = data.providerId

          // Fetch provider details from users collection
          const providerDoc = await getDoc(doc(firebase.db, "users", providerId))
          const providerData = providerDoc.data()

          servicesData.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            image: data.image,
            type: data.type,
            provider: {
              id: providerId,
              name: providerData?.displayName || "Unknown Provider",
              avatar: providerData?.photoURL || "/person-male-1.svg",
              location: providerData?.location || "Unknown Location",
              rating: data.rating || 0,
            }
          })
        }

        setServices(servicesData)
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [selectedCategory, serviceType])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Featured Services</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {loading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          services.map((service) => (
            <Link href={`/service/${service.id}`} key={service.id}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {service.image && (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">₱{service.price}</span>
                    <div className="flex items-center gap-2">
                      <img
                        src={service.provider.avatar}
                        alt={service.provider.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-600">{service.provider.name}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {service.provider.location}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
