"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceCard } from "@/components/ui/service-card"
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { useCategory } from "@/app/context/category-context"
import Link from "next/link"

interface LocalServicesProps {
  category?: string
  expandable?: boolean
}

interface Provider {
  id: string
  name: string
  avatar: string
  rating: number
  location: string
}

interface Service {
  id: string
  title: string
  description: string
  price: string
  category: string
  image: string
  providerId: string
  provider: Provider
  isLocalService?: boolean
  rating?: number
}

// Local service categories mapping for filtering
const localCategoryMapping: Record<string, string[]> = {
  "Academic & Tutorial": ["academic-tutorial"],
  "Automotive & Motorcycle": ["automotive-motorcycle"],
  "Digital Marketing": ["digital-marketing"],
  "Beauty & Business": ["beauty-business"],
  "Event Management": ["event-management"],
  "PC & Smartphone": ["pc-smartphone"],
  "Psychological": ["psychological"],
  "Property & Rental": ["property-rental"],
  "Electronics & Electrical": ["electronics-electrical"]
};

// Mock data as fallback if Firestore isn't available
const mockLocalServices: Service[] = [
  {
    id: "ls1",
    title: "Academic Tutoring - Mathematics",
    description: "Expert tutoring in algebra, calculus, statistics, and more for high school and college students.",
    price: "500",
    category: "academic-tutorial",
    image: "https://images.unsplash.com/photo-1560785496-3c9d27877182?q=80&w=2067&auto=format&fit=crop",
    providerId: "p3",
    provider: {
      id: "p3",
      name: "Jerry",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Manila",
      rating: 4.9,
    },
    isLocalService: true,
  },
  {
    id: "ls2",
    title: "Smartphone & PC Repair",
    description: "Fast and reliable repairs for all smartphone and computer models. Screen replacements, battery upgrades, and more.",
    price: "1,200",
    category: "pc-smartphone",
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=2074&auto=format&fit=crop",
    providerId: "p4",
    provider: {
      id: "p4",
      name: "Paul",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Pasig City",
      rating: 4.7,
    },
    isLocalService: true,
  },
  {
    id: "ls3",
    title: "Car Servicing & Repairs",
    description: "Complete automotive care for all makes and models. Oil changes, tune-ups, brake service, and major repairs.",
    price: "2,500",
    category: "automotive-motorcycle",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=2071&auto=format&fit=crop",
    providerId: "p5",
    provider: {
      id: "p5",
      name: "Mike",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Quezon City",
      rating: 4.6,
    },
    isLocalService: true,
  },
  {
    id: "ls4",
    title: "Event Planning & Management",
    description: "Professional event planning services for weddings, parties, corporate events, and more.",
    price: "15,000",
    category: "event-management",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2062&auto=format&fit=crop",
    providerId: "p6",
    provider: {
      id: "p6",
      name: "Emily",
      avatar: "/person-female-1.svg?height=50&width=50",
      location: "Makati",
      rating: 4.9,
    },
    isLocalService: true,
  }
];

export function LocalServices({ category = 'recent', expandable = false }: LocalServicesProps) {
  const { selectedLocalCategory } = useCategory();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const providersCache = useRef(new Map<string, Provider>());

  const fetchProviderData = useCallback(async (providerId: string, db: any) => {
    // Check cache first
    if (providersCache.current.has(providerId)) {
      return providersCache.current.get(providerId);
    }

    try {
      const providerDoc = await getDoc(doc(db, "users", providerId));
      
      if (providerDoc.exists()) {
        const providerData = providerDoc.data();
        const provider = {
          id: providerId,
          name: providerData.displayName || providerData.name || "Unknown Provider",
          avatar: providerData.photoURL || providerData.profilePicture || "/person-male-1.svg?height=50&width=50",
          location: providerData.location || "Unknown Location",
          rating: providerData.rating || 4.0,
        };
        
        // Cache the result
        providersCache.current.set(providerId, provider);
        return provider;
      }
    } catch (error) {
      console.error(`Error fetching provider ${providerId}:`, error);
    }

    // Fallback provider data
    return {
      id: providerId,
      name: "Unknown Provider",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Unknown",
      rating: 4.0,
    };
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    
    try {
      const { db } = await initializeFirebase();
      if (!db) {
        throw new Error("Failed to initialize Firebase");
      }

      // Query for local services
      const serviceQuery = query(
        collection(db, "services"),
        where("isLocalService", "==", true),
        where("active", "==", true),
        orderBy("rating", "desc"),
        limit(12)
      );

      const querySnapshot = await getDocs(serviceQuery);
      const servicesData: Service[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const provider = await fetchProviderData(data.providerId, db);

        servicesData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          price: data.price?.toString() || "0",
          category: data.category,
          image: data.image || "https://via.placeholder.com/300",
          providerId: data.providerId,
          provider: provider as Provider, // Type assertion to fix type error
          isLocalService: true,
          rating: data.rating || 4.0,
        });
      }

      if (isMounted.current) {
        // Use mock data if no services returned from Firebase
        const finalServices = servicesData.length > 0 ? servicesData : mockLocalServices;
        setServices(finalServices);
        setFilteredServices(finalServices);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching local services:", error);
      toast({
        title: "Error",
        description: "Failed to load local services. Using sample data instead.",
        variant: "destructive",
      });
      
      if (isMounted.current) {
        setServices(mockLocalServices);
        setFilteredServices(mockLocalServices);
        setLoading(false);
      }
    }
  }, [fetchProviderData, toast]);

  useEffect(() => {
    isMounted.current = true;
    fetchServices();
    return () => {
      isMounted.current = false;
      providersCache.current.clear();
    };
  }, [fetchServices]);

  // Filter services when selectedLocalCategory changes
  useEffect(() => {
    if (selectedLocalCategory && localCategoryMapping[selectedLocalCategory]) {
      const categoryFilters = localCategoryMapping[selectedLocalCategory];
      const filtered = services.filter(service => 
        categoryFilters.includes(service.category.toLowerCase())
      );
      setFilteredServices(filtered.length > 0 ? filtered : services);
    } else {
      setFilteredServices(services);
    }
  }, [selectedLocalCategory, services]);

  const displayServices = filteredServices.length > 0 ? filteredServices : services;
  const limitedServices = isExpanded ? displayServices : displayServices.slice(0, 4);

  return (
    <div className="flex flex-col w-full justify-center items-center gap-20 md:px-10">
      <div className="w-full max-w-[1400px] mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gray-900 dark:text-white">Services Near You</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">Find quality services available in your local area.</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-[320px] w-full rounded-xl" />
            ))}
          </div>
        ) : displayServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {limitedServices.map((service) => (
              <div key={service.id} className="transition-transform hover:scale-105 p-1">
                <ServiceCard
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  price={service.price}
                  category={service.category}
                  image={service.image}
                  provider={{
                    name: service.provider.name,
                    avatar: service.provider.avatar || "/person-male-1.svg",
                    rating: service.provider.rating,
                    ratingCount: service.provider.ratingCount,
                    location: service.provider.location,
                    id: service.provider.id
                  }}
                  showRating={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500 dark:text-gray-400">No local services available at this time.</p>
            <Button className="mt-4" asChild>
              <Link href="/services">Browse All Services</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
