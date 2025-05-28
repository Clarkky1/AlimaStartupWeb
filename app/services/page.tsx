"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { globalCategories, localCategories } from "@/lib/categories"
import { ServiceCard } from "@/components/ui/service-card"
import { initializeFirebase } from "@/app/lib/firebase"
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, Grid, MessageSquare, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("available")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [maxPrice, setMaxPrice] = useState(20000)
  const [location, setLocation] = useState("all")
  const [locations, setLocations] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showConnections, setShowConnections] = useState(false)
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false)
  
  interface Service {
    id: string;
    title: string;
    description: string;
    rating: number;
    createdAt: Date;
    isGlobalService?: boolean;
    isLocalService?: boolean;
    active: boolean;
    category: string;
    price: string;
    image: string;
    providerId?: string;
    location?: string;
    hasClient?: boolean;
  }

  interface Provider {
    id: string;
    location: string;
  }

  const [services, setServices] = useState<Service[]>([])
  const [unavailableServices, setUnavailableServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setMaxPrice(20000);
    setLocation("all");
  };

  // Reset only category filter
  const resetCategoryFilter = () => {
    setSelectedCategory("all");
  };

  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      try {
        const { db } = await initializeFirebase()
        if (!db) throw new Error("Failed to initialize Firebase")

        const baseQuery = collection(db, "services")
        let q = query(baseQuery, where("active", "==", true));

        // Add category filter if not "all"
        if (selectedCategory !== "all") {
          q = query(q, where("category", "==", selectedCategory))
        }

        // Add sorting
        // q = query(q, orderBy(sortBy === "rating" ? "rating" : "createdAt", "desc")) // Temporarily commented out to diagnose server error

        const querySnapshot = await getDocs(q)
        const servicesData: Service[] = []
        const unavailableServicesData: Service[] = []
        const uniqueLocations = new Set<string>()

        for (const doc of querySnapshot.docs) {
          const data = doc.data()
          console.log(`Service ID: ${doc.id}, createdAt raw:`, data.createdAt, `(Type: ${typeof data.createdAt})`);
          
          // If provider has a location, add it to locations set
          if (data.location && data.location !== "Philippines") {
            uniqueLocations.add(data.location)
          }
          
          const serviceData = {
            id: doc.id,
            title: data.title,
            description: data.description,
            rating: data.rating,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date()),
            isGlobalService: data.isGlobalService,
            isLocalService: data.isLocalService,
            active: data.active,
            category: data.category,
            price: data.price?.toString() || "0",
            image: data.image,
            providerId: data.providerId,
            location: data.location,
            hasClient: data.hasClient || false
          } as Service
          
          // Separate services with clients from available services
          if (serviceData.hasClient) {
            unavailableServicesData.push(serviceData)
          } else {
            servicesData.push(serviceData)
          }
        }

        setServices(servicesData)
        setUnavailableServices(unavailableServicesData)
        setLocations(Array.from(uniqueLocations))
      } catch (error) {
        console.error("Error fetching services:", error)
        toast({
          title: "Error",
          description: "Failed to load services. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
    // Only reset category filter when tab changes
    resetCategoryFilter()
  }, [activeTab, selectedCategory, sortBy, toast])

  // Apply all filters (search, price, location)
  const filteredServices = services.filter(service => {
    // Search term filter
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Price filter
    const servicePrice = parseInt(service.price?.replace(/[^0-9]/g, '') || "0");
    const matchesPrice = servicePrice <= maxPrice;

    // Location filter
    const matchesLocation = location === "all" || service.location === location;

    // Category filter
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;

    return matchesSearch && matchesPrice && matchesLocation && matchesCategory;
  });

  const filteredUnavailableServices = unavailableServices.filter(service => {
    // Search term filter
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Price filter
    const servicePrice = parseInt(service.price?.replace(/[^0-9]/g, '') || "0");
    const matchesPrice = servicePrice <= maxPrice;

    // Location filter
    const matchesLocation = location === "all" || service.location === location;

    // Category filter
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;

    return matchesSearch && matchesPrice && matchesLocation && matchesCategory;
  });

  // Get the current category name
  const getCurrentCategoryName = () => {
    if (selectedCategory === "all") return "All Categories";
    const category = (activeTab === "global" ? globalCategories : localCategories)
      .find(c => c.slug === selectedCategory);
    return category?.name || selectedCategory;
  };

  // Effect to ensure services are filtered when filter states change
  useEffect(() => {
    // This effect primarily exists to ensure re-renders when filters change,
    // as the filtering logic is already within the component body and should react to state changes.
    // No explicit action needed here other than defining the dependencies.
  }, [searchTerm, selectedCategory, maxPrice, location, services, unavailableServices]);

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Browse Services</h1>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="flex items-center text-foreground bg-background/50 hover:bg-background/80 backdrop-blur-sm rounded-full p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="ml-1">Back</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden py-4 sm:py-6">
        <div className="h-full flex flex-col lg:flex-row gap-4 transition-all duration-300 ease-in-out">
          {/* Left Panel: Service Browsing */}
          <div className={`flex-1 overflow-y-auto ${isRightPanelExpanded ? 'lg:flex-grow' : ''}`}>
            {/* Container for Search/Sort and Active Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
              {/* Active filters display */}
              {(searchTerm || selectedCategory !== "all" || location || maxPrice < 20000) && (
                <div className="mb-0 flex-1 w-full">
                  <div className="text-sm text-muted-foreground mb-2">Active filters:</div>
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
                        Category: { (activeTab === "global" ? globalCategories : localCategories).find(c => c.slug === selectedCategory)?.name || selectedCategory }
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSelectedCategory("all")}
                        />
                      </Badge>
                    )}
                    {maxPrice < 20000 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Price: Up to ₱{maxPrice.toLocaleString()}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setMaxPrice(20000)}
                        />
                      </Badge>
                    )}
                    {location && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Location: {location}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setLocation("all")}
                        />
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetFilters}
                      className="h-6"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Adjusted Search/Sort/Mobile Filter Bar */}
              <div className="flex gap-2 w-full sm:w-fit">
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 sm:max-w-[200px] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[120px] focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-4">
              {selectedCategory === "all" ? "Available Services" : `Services in ${getCurrentCategoryName()}`}
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden h-full flex flex-col">
                    <Skeleton className="aspect-video w-full rounded-t-lg" />
                    <div className="p-3 space-y-2 flex-1 flex flex-col">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex items-center mt-auto gap-2">
                         <Skeleton className="h-6 w-6 rounded-full"/>
                         <Skeleton className="h-3 w-2/3"/>
                      </div>
                      <Skeleton className="h-8 w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredServices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {filteredServices.map((service) => (
                      <ServiceCard 
                        key={service.id}
                        id={service.id}
                        title={service.title}
                        description={service.description}
                        price={service.price}
                        category={service.category}
                        image={service.image}
                        provider={{
                          id: service.providerId || "unknown",
                          name: "Service Provider",
                          avatar: "/default-avatar.png",
                          location: service.location || "Philippines",
                          rating: service.rating,
                          hasRating: service.rating > 0
                        }}
                        showRating={true}
                        createdAt={service.createdAt}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg text-muted-foreground">
                      {selectedCategory === "all" 
                        ? "No services found matching your criteria."
                        : `No services available in ${getCurrentCategoryName()}.`
                      }
                    </p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={resetFilters}
                    >
                      Reset filters
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {/* Display services with clients */}
            {filteredUnavailableServices.length > 0 && (
              <div className="mt-8 sm:mt-12">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Services Currently Unavailable (With Active Clients)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {filteredUnavailableServices.map((service) => (
                    <ServiceCard 
                      key={service.id}
                      id={service.id}
                      title={service.title}
                      description={service.description}
                      price={service.price}
                      category={service.category}
                      image={service.image}
                      provider={{
                        id: service.providerId || "unknown",
                        name: "Service Provider",
                        avatar: "/default-avatar.png",
                        location: service.location || "Philippines",
                        rating: service.rating,
                        hasRating: service.rating > 0
                      }}
                      showRating={true}
                      createdAt={service.createdAt}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel: Icon-based Navigation */}
          <div className={`w-full ${isRightPanelExpanded ? 'lg:w-80' : 'lg:w-16'} h-full overflow-y-auto lg:border-l space-y-4 sm:space-y-6 bg-background transition-all duration-300 ease-in-out z-10 shadow-lg lg:shadow-none lg:flex-shrink-0`}>
            <div className={`flex flex-col h-full ${isRightPanelExpanded ? 'lg:flex-row' : ''}`}>
              {/* Icons Column */}
              <div className={`flex flex-col ${isRightPanelExpanded ? 'w-16 border-r pr-2' : 'w-full'} space-y-4 sm:space-y-6 p-3`}>
                {/* Categories Icon Button */}
                <div className="w-full">
                  <Button
                    variant="ghost"
                    className={`w-full h-12 flex items-center justify-center lg:flex-col lg:justify-center gap-1 hover:bg-accent ${showCategories ? 'bg-accent text-accent-foreground' : ''}`}
                    onClick={() => {
                      const willShow = !showCategories;
                      setShowCategories(willShow);
                      setShowConnections(false);
                      setIsRightPanelExpanded(willShow);
                    }}
                  >
                    <Grid className="h-5 w-5" />
                  </Button>
                </div>

                {/* Connections Icon Button */}
                <div className="w-full">
                  <Button
                    variant="ghost"
                    className={`w-full h-12 flex items-center justify-center lg:flex-col lg:justify-center gap-1 hover:bg-accent ${showConnections ? 'bg-accent text-accent-foreground' : ''}`}
                    onClick={() => {
                      const willShow = !showConnections;
                      setShowConnections(willShow);
                      setShowCategories(false);
                      setIsRightPanelExpanded(willShow);
                    }}
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Content Panel (Categories, Connections, Filters) */}
              {isRightPanelExpanded && (
                <div className="flex-1 overflow-y-auto py-3 space-y-4 sm:space-y-6 lg:px-4">
                  {/* Categories Panel */}
                  {showCategories && (
                    <div className="rounded-lg border bg-card">
                      <div className="space-y-1">
                        <Button 
                          variant={selectedCategory === "all" ? "default" : "outline"} 
                          className="w-full justify-start h-8 text-sm" 
                          onClick={() => {
                            setSelectedCategory("all");
                            setIsRightPanelExpanded(false);
                            setShowCategories(false);
                          }}
                        >
                          All Categories
                        </Button>
                        {(activeTab === "global" ? globalCategories : localCategories).map((category) => (
                          <Button 
                            key={category.slug}
                            variant={selectedCategory === category.slug ? "default" : "outline"} 
                            className={`w-full justify-start h-8 text-sm ${selectedCategory === category.slug ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground"}`}
                            onClick={() => {
                              setSelectedCategory(category.slug);
                              setIsRightPanelExpanded(false);
                              setShowCategories(false);
                            }}
                          >
                            {category.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connections Panel */}
                  {isRightPanelExpanded && showConnections && (
                    <div className="rounded-lg border bg-card p-3 space-y-3">
                      <h3 className="text-sm font-semibold">Connections</h3>
                      <p className="text-sm text-muted-foreground">No pending connections.</p>
                      <p className="text-sm text-muted-foreground">No connection history.</p>
                      <p className="text-sm text-muted-foreground">Select a connection to message.</p>
                    </div>
                  )}

                  {/* Price Filter */}
                  {showCategories && (
                    <div className="rounded-lg border bg-card p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="price" className="text-sm">Max Price</Label>
                          <span className="text-sm text-muted-foreground">₱{maxPrice.toLocaleString()}</span>
                        </div>
                        <Slider
                          id="price"
                          value={[maxPrice]} 
                          min={0} 
                          max={20000} 
                          step={500} 
                          onValueChange={(value) => setMaxPrice(value[0])}
                          className="py-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Location Filter */}
                  {locations.length > 0 && (
                    <div className="rounded-lg border bg-card p-3">
                      <Label htmlFor="location" className="text-sm mb-2 block">Location</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>{/* End of h-full flex gap-4 */}
      </div>{/* End of flex-1 container mx-auto ... */}
    </div>
  )
}
