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
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
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

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "global")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [location, setLocation] = useState("all")
  const [locations, setLocations] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
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

  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      try {
        const { db } = await initializeFirebase()
        if (!db) throw new Error("Failed to initialize Firebase")

        const baseQuery = collection(db, "services")
        let q = query(baseQuery, where("active", "==", true))

        // Add filters based on tab
        if (activeTab === "global") {
          q = query(q, where("isGlobalService", "==", true))
        } else {
          q = query(q, where("isLocalService", "==", true))
        }

        // Add category filter if not "all"
        if (selectedCategory !== "all") {
          q = query(q, where("category", "==", selectedCategory))
        }

        // Add sorting
        q = query(q, orderBy(sortBy === "rating" ? "rating" : "createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        const servicesData: Service[] = []
        const unavailableServicesData: Service[] = []
        const uniqueLocations = new Set<string>()

        for (const doc of querySnapshot.docs) {
          const data = doc.data()
          
          // If provider has a location, add it to locations set
          if (data.location && data.location !== "Philippines") {
            uniqueLocations.add(data.location)
          }
          
          const serviceData = {
            id: doc.id,
            title: data.title,
            description: data.description,
            rating: data.rating,
            createdAt: data.createdAt,
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
    const matchesPrice = servicePrice >= priceRange[0] && servicePrice <= priceRange[1];
    
    // Location filter
    const matchesLocation = location === "all" || service.location === location;
    
    return matchesSearch && matchesPrice && matchesLocation;
  });

  const filteredUnavailableServices = unavailableServices.filter(service => {
    // Search term filter
    const matchesSearch = 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Price filter
    const servicePrice = parseInt(service.price?.replace(/[^0-9]/g, '') || "0");
    const matchesPrice = servicePrice >= priceRange[0] && servicePrice <= priceRange[1];
    
    // Location filter
    const matchesLocation = location === "all" || service.location === location;
    
    return matchesSearch && matchesPrice && matchesLocation;
  });

  return (
    <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8">
      <h1 className="text-4xl font-bold mb-2">Browse Services</h1>
      {/* Filters and Sort By */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative flex-grow w-full md:w-auto">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="global">Global Services</TabsTrigger>
              <TabsTrigger value="local">Local Services</TabsTrigger>
            </TabsList>

            <div className="flex gap-4 mb-8">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="latest">Latest</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </div>

            {/* Active filters display */}
            {(searchTerm || selectedCategory !== "all" || location || priceRange[0] > 0 || priceRange[1] < 10000) && (
              <div className="mb-4">
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
                      Category: {
                        (activeTab === "global" 
                          ? globalCategories 
                          : localCategories).find(c => c.slug === selectedCategory)?.name || selectedCategory
                      }
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedCategory("all")}
                      />
                    </Badge>
                  )}
                  {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Price: ₱{priceRange[0]} - ₱{priceRange[1]}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setPriceRange([0, 10000])}
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

            <TabsContent value="global" className="pt-2">
              {/* Display available services */}
              <h2 className="text-2xl font-semibold mb-4">Available Services</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-2">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-lg text-muted-foreground">No services found matching your criteria.</p>
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
                <div className="mt-12">
                  <h2 className="text-2xl font-semibold mb-4">Services Currently Unavailable (With Active Clients)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="local" className="pt-2">
              {/* Same structure for local services */}
              <h2 className="text-2xl font-semibold mb-4">Available Services</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-2">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-lg text-muted-foreground">No services found matching your criteria.</p>
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
                <div className="mt-12">
                  <h2 className="text-2xl font-semibold mb-4">Services Currently Unavailable (With Active Clients)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Desktop Filter Sidebar */}
        <div className={`md:w-1/4 hidden md:block sticky top-16 h-fit max-h-[calc(100vh-120px)] overflow-y-auto pb-8 space-y-8`}>
          <div className="rounded-lg border p-4 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-1.5">
                <Button 
                  variant={selectedCategory === "all" ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Categories
                </Button>
                {(activeTab === "global" ? globalCategories : localCategories).map((category) => (
                  <Button 
                    key={category.slug}
                    variant={selectedCategory === category.slug ? "default" : "outline"} 
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Price Range</h3>
              <div className="space-y-3">
                <Slider 
                  value={priceRange} 
                  min={0} 
                  max={10000} 
                  step={500} 
                  onValueChange={setPriceRange}
                />
                <div className="flex justify-between">
                  <span>₱{priceRange[0]}</span>
                  <span>₱{priceRange[1]}</span>
                </div>
              </div>
            </div>
            
            {locations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Location</h3>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
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
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
        
        {/* Mobile Filter Dialog */}
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-1.5">
                  <Button 
                    variant={selectedCategory === "all" ? "default" : "outline"} 
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Categories
                  </Button>
                  {(activeTab === "global" ? globalCategories : localCategories).map((category) => (
                    <Button 
                      key={category.slug}
                      variant={selectedCategory === category.slug ? "default" : "outline"} 
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.slug)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="space-y-3">
                  <Slider 
                    value={priceRange} 
                    min={0} 
                    max={10000} 
                    step={500} 
                    onValueChange={setPriceRange}
                  />
                  <div className="flex justify-between">
                    <span>₱{priceRange[0]}</span>
                    <span>₱{priceRange[1]}</span>
                  </div>
                </div>
              </div>
              
              {locations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Location</h3>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
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
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  resetFilters()
                  setShowFilters(false)
                }}
              >
                Reset Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
