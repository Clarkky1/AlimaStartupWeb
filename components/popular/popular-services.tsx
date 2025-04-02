"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceCard } from "@/components/ui/service-card"
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore"
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
  isGlobalService?: boolean
  isLocalService?: boolean
  rating?: number
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
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Remote",
      rating: 4.8,
    },
    isGlobalService: true,
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
      avatar: "/person-female-1.svg?height=50&width=50",
      location: "Remote",
      rating: 4.9,
    },
    isGlobalService: true,
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
  
  // Add state for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [location, setLocation] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Get list of unique locations from services
  const locations = useMemo(() => {
    const uniqueLocations = new Set<string>()
    services.forEach(service => {
      if (service.provider?.location) {
        uniqueLocations.add(service.provider.location)
      }
    })
    return Array.from(uniqueLocations)
  }, [services])

  // Get categories based on active tab - extract just the slugs for compatibility
  const categories = useMemo(() => {
    return activeTab === "global" 
      ? globalCategories.map(cat => cat.slug) 
      : localCategories.map(cat => cat.slug)
  }, [activeTab])

  // For category name display, we need a function to get category name from slug
  const getCategoryName = useCallback((slug: string) => {
    const allCategories = [...globalCategories, ...localCategories]
    return allCategories.find(cat => cat.slug === slug)?.name || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [])

  // Add filter application function
  const applyFilters = useCallback(() => {
    if (!services.length) return

    let filtered = [...services]

    // First filter based on active tab
    if (activeTab === "global") {
      filtered = filtered.filter(service => 
        service.isGlobalService || 
        globalCategories.some(cat => cat.slug ===  service.category)
      )
    } else {
      filtered = filtered.filter(service => 
        service.isLocalService || 
        localCategories.some(cat => cat.slug === service.category)
      )
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchLower) || 
        service.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    // Apply price filter (convert string price to number first by removing non-numeric chars)
    filtered = filtered.filter(service => {
      // Convert price to string before using replace method
      const priceStr = String(service.price);
      const numericPrice = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
      return numericPrice >= priceRange[0] && numericPrice <= priceRange[1]
    })

    // Apply location filter
    if (location && location !== "all") {
      filtered = filtered.filter(service => 
        service.provider?.location?.toLowerCase() === location.toLowerCase()
      )
    }

    setFilteredServices(filtered)
  }, [services, activeTab, searchTerm, selectedCategory, priceRange, location])

  // Apply filters whenever services or filter criteria change
  useEffect(() => {
    applyFilters()
  }, [services, activeTab, searchTerm, selectedCategory, priceRange, location, applyFilters])

  const fetchProviderData = useCallback(async (providerId: string, db: any) => {
    // Check cache first
    if (providersCache.current.has(providerId)) {
      return providersCache.current.get(providerId) as Provider
    }

    try {
      const providerDoc = await getDoc(doc(db, "users", providerId))
      const providerData = providerDoc.data()
      
      if (providerDoc.exists() && providerData) {
        const provider: Provider = {
          id: providerId,
          name: providerData.displayName || providerData.name || "Unknown Provider",
          avatar: providerData.photoURL || providerData.profilePicture || "/person-male-1.svg?height=50&width=50",
          location: providerData.location || "Unknown Location",
          rating: providerData.rating || 4.0,
        }
        
        // Cache the result
        providersCache.current.set(providerId, provider)
        return provider
      }
    } catch (error) {
      console.error(`Error fetching provider ${providerId}:`, error)
    }

    // Always return a default Provider if none found
    const defaultProvider: Provider = {
      id: providerId,
      name: "Unknown Provider",
      avatar: "/person-male-1.svg?height=50&width=50",
      location: "Unknown",
      rating: 4.0,
    }
    return defaultProvider
  }, [])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    
    try {
      const { db } = await initializeFirebase()
      if (!db) throw new Error("Failed to initialize Firebase")

      const servicesCollection = collection(db, "services")
      let serviceQuery;

      // Base query conditions
      let queryConditions = [where("active", "==", true)];

      // Add category filter if specified
      if (category) {
        queryConditions.push(where("category", "==", category));
      }

      // Add service type filter based on active tab
      if (activeTab === "global") {
        queryConditions.push(where("isGlobalService", "==", true));
      } else {
        queryConditions.push(where("isLocalService", "==", true));
      }

      serviceQuery = query(
        servicesCollection,
        ...queryConditions,
        orderBy("rating", "desc"),
        limit(serviceLimit)
      );

      const querySnapshot = await getDocs(serviceQuery)
      const servicesData: Service[] = []

      for (const doc of querySnapshot.docs) {
        const data = doc.data()
        const provider = await fetchProviderData(data.providerId, db)

        servicesData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          price: data.price?.toString() || "0",
          category: data.category,
          image: data.image || "https://via.placeholder.com/300",
          providerId: data.providerId,
          provider,
          isGlobalService: data.isGlobalService,
          isLocalService: data.isLocalService,
          rating: data.rating || 4.0,
        })
      }

      if (isMounted.current) {
        setServices(servicesData.length > 0 ? servicesData : mockServices)
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "Failed to load services. Using sample data instead.",
        variant: "destructive",
      })
      if (isMounted.current) {
        setServices(mockServices)
        setLoading(false)
      }
    }
  }, [category, activeTab, toast, fetchProviderData, serviceLimit])

  useEffect(() => {
    isMounted.current = true
    fetchServices()
    return () => {
      isMounted.current = false
      providersCache.current.clear()
    }
  }, [fetchServices])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
    setSelectedCategory("all")
    setPriceRange([0, 60000])
    setLocation("all")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-center mb-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="global">Global Services</TabsTrigger>
              <TabsTrigger value="local">Local Services</TabsTrigger>
            </TabsList>
          </div>

          <div className="mb-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Search className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {showFilters && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSearchTerm("")}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {getCategoryName(cat)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Price Range (₱)</Label>
                    <div className="pt-4 px-1">
                      <Slider
                        value={priceRange}
                        min={0}
                        max={60000}
                        step={500}
                        onValueChange={setPriceRange}
                        className="slider-inverted"
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>₱{priceRange[0]}</span>
                        <span>₱{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active filters */}
                {(searchTerm || selectedCategory !== "all" || location !== "all" || priceRange[0] > 0 || priceRange[1] < 60000) && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Active filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Search: {searchTerm}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setSearchTerm("")}
                          />
                        </Badge>
                      )}
                      {selectedCategory !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Category: {getCategoryName(selectedCategory)}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setSelectedCategory("all")}
                          />
                        </Badge>
                      )}
                      {(priceRange[0] > 0 || priceRange[1] < 60000) && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Price: ₱{priceRange[0]} - ₱{priceRange[1]}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setPriceRange([0, 60000])}
                          />
                        </Badge>
                      )}
                      {location !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Location: {location}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setLocation("all")}
                          />
                        </Badge>
                      )}
                      {(searchTerm || selectedCategory !== "all" || location !== "all" || priceRange[0] > 0 || priceRange[1] < 60000) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSearchTerm("")
                            setSelectedCategory("all")
                            setPriceRange([0, 60000])
                            setLocation("all")
                          }}
                          className="h-6"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <TabsContent value="global">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <div key={service.id} className="transition-transform hover:scale-105">
                    <ServiceCard 
                      id={service.id}
                      title={service.title}
                      description={service.description}
                      price={service.price}
                      category={service.category}
                      image={service.image}
                      provider={service.provider}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-muted-foreground">No services found matching your filters.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setPriceRange([0, 60000])
                    setLocation("all")
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="local">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <div key={service.id} className="transition-transform hover:scale-105">
                    <ServiceCard 
                      id={service.id}
                      title={service.title}
                      description={service.description}
                      price={service.price}
                      category={service.category}
                      image={service.image}
                      provider={service.provider}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-muted-foreground">No services found matching your filters.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setPriceRange([0, 60000])
                    setLocation("all")
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
