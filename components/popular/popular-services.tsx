"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceCard } from "@/components/ui/service-card"
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, DocumentData } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Code,
  PenTool,
  BarChart,
  Smartphone,
  FileText,
  Video,
  Camera,
  Music,
  BookOpen,
  Globe,
  Briefcase,
  Home,
  GraduationCap,
  Car,
  Lightbulb,
  Scissors,
  CalendarDays,
  Laptop,
  Heart,
  Building2,
  Cpu
} from "lucide-react"
import { usePathname } from "next/navigation"

interface PopularServicesProps {
  category?: string
  limit?: number
}

interface Provider {
  id: string
  name: string
  avatar: string
  rating: number
  location: string
  hasRating?: boolean
}

interface ServiceData {
  title?: string;
  description?: string;
  price?: number | string;
  category?: string;
  image?: string;
  providerId: string;
  isLocalService?: boolean;
  rating?: number;
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
  isGlobalService: boolean
  isLocalService: boolean
  rating: number
}

interface ServiceCardProps {
  id: string
  title: string
  description: string
  price: string
  category: string
  image: string
  provider: Provider
}

const globalCategories = [
  { name: "Development", icon: Code, slug: "development" },
  { name: "Design", icon: PenTool, slug: "design" },
  { name: "Marketing", icon: BarChart, slug: "marketing" },
  { name: "Mobile Apps", icon: Smartphone, slug: "mobile-apps" },
  { name: "Writing", icon: FileText, slug: "writing" },
  { name: "Video", icon: Video, slug: "video" },
  { name: "Photography", icon: Camera, slug: "photography" },
  { name: "Music", icon: Music, slug: "music" },
  { name: "Education", icon: BookOpen, slug: "education" },
  { name: "Translation", icon: Globe, slug: "translation" },
  { name: "Business", icon: Briefcase, slug: "business" },
  { name: "Lifestyle", icon: Home, slug: "lifestyle" },
]

const localCategories = [
  { name: "Academic & Tutorial", icon: GraduationCap, slug: "academic-tutorial" },
  { name: "Automotive & Motorcycle", icon: Car, slug: "automotive-motorcycle" },
  { name: "Digital Marketing", icon: Lightbulb, slug: "digital-marketing" },
  { name: "Beauty & Business", icon: Scissors, slug: "beauty-business" },
  { name: "Event Management", icon: CalendarDays, slug: "event-management" },
  { name: "PC & Smartphone", icon: Laptop, slug: "pc-smartphone" },
  { name: "Psychological", icon: Heart, slug: "psychological" },
  { name: "Property & Rental", icon: Building2, slug: "property-rental" },
  { name: "Electronics & Electrical", icon: Cpu, slug: "electronics-electrical" },
]

// Mock data as fallback
const mockServices: Service[] = [
  {
    id: "s1",
    title: "Professional Web Development",
    description: "Custom websites built using the latest technologies. Responsive design, SEO optimized, and user-friendly interfaces.",
    price: "5,000",
    category: "web-development",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2064&auto=format&fit=crop",
    providerId: "p1",
    provider: {
      id: "p1",
      name: "John Smith",
      avatar: "/person-male-1.svg",
      location: "Remote",
      rating: 4.8,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.8,
  },
  {
    id: "s2",
    title: "Creative Graphic Design",
    description: "Eye-catching logos, branding materials, social media graphics, and print designs tailored to your needs.",
    price: "3,500",
    category: "graphic-design",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop",
    providerId: "p2",
    provider: {
      id: "p2",
      name: "Sarah Lee",
      avatar: "/person-female-1.svg",
      location: "Remote",
      rating: 4.9,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.9,
  },
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
      avatar: "/person-male-1.svg",
      location: "Manila",
      rating: 4.9,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.9,
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
      avatar: "/person-male-1.svg",
      location: "Pasig City",
      rating: 4.7,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.7,
  }
]

export function PopularServices({ category, limit: serviceLimit = 8 }: PopularServicesProps) {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("global")
  const { toast } = useToast()
  const isMounted = useRef(true)
  const providersCache = useRef(new Map<string, Provider>())
  const pathname = usePathname()
  
  // Add state for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [location, setLocation] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange([0, 10000]);
    setLocation("all");
  };

  // Reset only category filter
  const resetCategoryFilter = () => {
    setSelectedCategory("all");
  };

  // Fetch services from Firestore
  const fetchServices = useCallback(async () => {
    if (!isMounted.current) return

    try {
      setLoading(true)
      const firebase = await initializeFirebase()
      if (!firebase.db) {
        console.log("Using mock data - Firebase not initialized")
        setServices(mockServices)
        setFilteredServices(mockServices)
        setLoading(false)
        return
      }

      // Get all services
      const servicesRef = collection(firebase.db, "services")
      const servicesQuery = query(
        servicesRef,
        orderBy("createdAt", "desc"),
        limit(serviceLimit)
      )
      const servicesSnap = await getDocs(servicesQuery)

      if (servicesSnap.empty) {
        console.log("Using mock data - No services found in Firestore")
        setServices(mockServices)
        setFilteredServices(mockServices)
        setLoading(false)
        return
      }

      // Get provider data for each service
      const servicesWithProviders = await Promise.all(
        servicesSnap.docs.map(async (docSnapshot) => {
          const serviceData = docSnapshot.data() as ServiceData
          let provider = providersCache.current.get(serviceData.providerId)

          if (!provider && firebase.db && serviceData.providerId) {
            try {
              const providerQuery = query(
                collection(firebase.db, "users"),
                where("uid", "==", serviceData.providerId),
                limit(1)
              )
              const providerDocs = await getDocs(providerQuery)
              
              if (!providerDocs.empty) {
                const providerData = providerDocs.docs[0].data()
                const hasRating = providerData.rating !== undefined && providerData.rating > 0
                provider = {
                  id: serviceData.providerId,
                  name: providerData.displayName || providerData.name || "Service Provider",
                  avatar: providerData.photoURL || providerData.profilePicture || "/person-male-1.svg",
                  rating: hasRating ? providerData.rating : 0,
                  location: providerData.location || "Unknown",
                  hasRating
                }
                providersCache.current.set(serviceData.providerId, provider)
              }
            } catch (error) {
              console.error("Error fetching provider data:", error)
            }
          }

          const service: Service = {
            id: docSnapshot.id,
            title: serviceData.title || "",
            description: serviceData.description || "",
            price: serviceData.price?.toString() || "0",
            category: serviceData.category || "",
            image: serviceData.image || "https://via.placeholder.com/300",
            providerId: serviceData.providerId,
            provider: provider || {
              id: serviceData.providerId,
              name: "Service Provider",
              avatar: "/person-male-1.svg",
              rating: 0,
              location: "Unknown",
              hasRating: false
            },
            isGlobalService: !serviceData.isLocalService,
            isLocalService: serviceData.isLocalService || false,
            rating: serviceData.rating || 0
          }

          return service
        })
      ).then(services => services.filter((service): service is Service => service !== undefined))

      setServices(servicesWithProviders)
      setFilteredServices(servicesWithProviders)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching services:", error)
      setServices(mockServices)
      setFilteredServices(mockServices)
      setLoading(false)
      toast({
        title: "Error",
        description: "Failed to load services. Using sample data.",
        variant: "destructive"
      })
    }
  }, [serviceLimit, toast, activeTab])

  // Reset category filter when tab changes
  useEffect(() => {
    resetCategoryFilter()
  }, [activeTab])

  // Fetch services on mount and when pathname changes
  useEffect(() => {
    fetchServices()
  }, [fetchServices, pathname])

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Apply filters whenever any filter changes
  useEffect(() => {
    if (!services.length) return

    let filtered = [...services]

    // First filter based on active tab
    if (activeTab === "global") {
      filtered = filtered.filter(service => service.isGlobalService)
    } else {
      filtered = filtered.filter(service => service.isLocalService)
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchLower) || 
        service.description.toLowerCase().includes(searchLower) ||
        service.provider.name.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    // Apply price filter
    filtered = filtered.filter(service => {
      const price = parseFloat(service.price.replace(/[^0-9.-]+/g, ""))
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Apply location filter
    if (location && location !== "all") {
      filtered = filtered.filter(service => service.provider.location === location)
    }

    setFilteredServices(filtered)
  }, [services, activeTab, searchTerm, selectedCategory, priceRange, location])

  // Get list of unique locations from services
  const locations = useMemo(() => {
    const uniqueLocations = new Set<string>()
    services.forEach(service => {
      if (service.provider?.location && service.provider.location !== "Unknown" && service.provider.location !== "Philippines") {
        uniqueLocations.add(service.provider.location)
      }
    })
    return Array.from(uniqueLocations).sort()
  }, [services])

  // Get categories based on active tab
  const categories = useMemo(() => {
    return activeTab === "global" 
      ? globalCategories 
      : localCategories
  }, [activeTab])

  // For category name display, we need a function to get category name from slug
  const getCategoryName = useCallback((slug: string) => {
    const allCategories = [...globalCategories, ...localCategories]
    return allCategories.find(cat => cat.slug === slug)?.name || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="global" className="w-full sm:w-auto" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger value="global">Global Services</TabsTrigger>
            <TabsTrigger value="local">Local Services</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Search className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={10000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₱{priceRange[0]}</span>
                <span>₱{priceRange[1]}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations
                    .filter(loc => loc !== "Philippines")
                    .sort()
                    .map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredServices
            .filter(service => 
              service.title && 
              service.description && 
              service.price && 
              service.category && 
              service.image && 
              service.provider?.name
            )
            .map((service) => (
              <div key={service.id} className="transition-transform hover:scale-105">
                <ServiceCard 
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  price={service.price}
                  category={service.category}
                  image={service.image}
                  provider={service.provider}
                  showRating={service.provider.hasRating}
                />
              </div>
            ))}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border">
          <p className="text-muted-foreground">No services available</p>
        </div>
      )}
    </div>
  )
}
