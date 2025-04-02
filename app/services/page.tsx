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

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "global")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [location, setLocation] = useState("")
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
  }

  interface Provider {
    id: string;
    location: string;
  }

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

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
        const uniqueLocations = new Set<string>()

        for (const doc of querySnapshot.docs) {
          const data = doc.data()
          
          // If provider has a location, add it to locations set
          if (data.location) {
            uniqueLocations.add(data.location)
          }
          
          servicesData.push({
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
            location: data.location
          } as Service)
        }

        setServices(servicesData)
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
    const matchesLocation = !location || service.location === location;
    
    return matchesSearch && matchesPrice && matchesLocation;
  });

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange([0, 10000]);
    setLocation("");
  };

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Browse Services</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-3/4">
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
                        onClick={() => setLocation("")}
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                // Add loading skeletons here
                Array(6).fill(null).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
                  </div>
                ))
              ) : filteredServices.length > 0 ? (
                filteredServices.map(service => (
                  <ServiceCard key={service.id} {...service} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No services found matching your criteria</p>
                  <Button variant="outline" className="mt-4" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </div>
        
        {/* Filters sidebar - hidden on mobile unless showFilters is true */}
        <div className={`w-full md:w-1/4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-4">Filter Services</h2>
              
              {/* Category Filter */}
              <div className="mb-6">
                <Label htmlFor="category" className="block mb-2">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(activeTab === "global" ? globalCategories : localCategories).map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Price Range Filter */}
              <div className="mb-6">
                <Label className="block mb-2">Price Range (₱)</Label>
                <Slider
                  value={priceRange}
                  min={0}
                  max={10000}
                  step={500}
                  onValueChange={setPriceRange}
                  className="my-6"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₱{priceRange[0]}</span>
                  <span>₱{priceRange[1]}</span>
                </div>
              </div>
              
              {/* Location Filter */}
              <div className="mb-6">
                <Label htmlFor="location" className="block mb-2">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location" className="w-full">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Reset Filters Button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
