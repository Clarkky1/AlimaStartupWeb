"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Code, PenTool, BarChart, Smartphone, FileText, Video, Camera, Music, BookOpen, Globe, 
         BookOpenText, Car, Palette, Briefcase, PlaneTakeoff, Monitor, Brain, Home, Cpu, Star, MapPin, ChevronUp, ChevronDown } from "lucide-react"
import { useState, useEffect, createContext, useContext } from "react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactModal } from "@/components/messages/contact-modal"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/ui/service-card"

// Create a context to track the selected category
export interface CategoryContextType {
  selectedGlobalCategory: string | null;
  setSelectedGlobalCategory: (category: string | null) => void;
  selectedLocalCategory: string | null;
  setSelectedLocalCategory: (category: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CategoryContext = createContext<CategoryContextType>({
  selectedGlobalCategory: null,
  setSelectedGlobalCategory: () => {},
  selectedLocalCategory: null,
  setSelectedLocalCategory: () => {},
  activeTab: "global",
  setActiveTab: () => {}
});

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedGlobalCategory, setSelectedGlobalCategory] = useState<string | null>(null);
  const [selectedLocalCategory, setSelectedLocalCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("global");

  return (
    <CategoryContext.Provider 
      value={{ 
        selectedGlobalCategory, 
        setSelectedGlobalCategory,
        selectedLocalCategory,
        setSelectedLocalCategory,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export function useCategory() {
  return useContext(CategoryContext);
}

interface Service {
  id: string
  title: string
  description: string
  price: string  // Changed from number to string to match ServiceCard props
  image: string
  category: string
  providerId: string
  providerName: string
  providerAvatar: string
  location: string
  rating: number
  reviewCount: number
}

// Global service categories
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
]

// Local service categories
const localCategories = [
  { name: "Academic & Tutorial", icon: BookOpenText, slug: "academic-tutorial" },
  { name: "Automotive & Motorcycle", icon: Car, slug: "automotive-motorcycle" },
  { name: "Digital Marketing", icon: BarChart, slug: "digital-marketing" },
  { name: "Beauty & Business", icon: Palette, slug: "beauty-business" },
  { name: "Event Management", icon: Briefcase, slug: "event-management" },
  { name: "PC & Smartphone", icon: Monitor, slug: "pc-smartphone" },
  { name: "Psychological", icon: Brain, slug: "psychological" },
  { name: "Property & Rental", icon: Home, slug: "property-rental" },
  { name: "Electronics & Electrical", icon: Cpu, slug: "electronics-electrical" },
]

export function CategorySection() {
  const router = useRouter()
  const { 
    activeTab, setActiveTab,
    setSelectedGlobalCategory,
    setSelectedLocalCategory 
  } = useCategory()
  const [categoryServices, setCategoryServices] = useState<Record<string, Service[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [expandedCategoryServices, setExpandedCategoryServices] = useState<Record<string, Service[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandLoading, setExpandLoading] = useState<Record<string, boolean>>({})
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  useEffect(() => {
    async function fetchCategoryServices() {
      try {
        const { db } = await initializeFirebase()
        if (!db) {
          console.error("Failed to initialize Firebase")
          return
        }

        const servicesByCategory: Record<string, Service[]> = {}
        
        // Get the active category list based on the active tab
        const categories = activeTab === "global" ? globalCategories : localCategories

        for (const category of categories) {
          const q = query(
            collection(db, "services"),
            where("category", "==", category.name),
            where("active", "==", true),
            limit(3)
          )

          const querySnapshot = await getDocs(q)
          const services: Service[] = []

          for (const doc of querySnapshot.docs) {
            const serviceData = doc.data() as Omit<Service, "id">
            
            // Ensure we have location information
            let providerLocation = "Philippines"
            
            // If provider information is available, try to fetch their location
            if (serviceData.providerId) {
              try {
                const providerDoc = await getDocs(
                  query(
                    collection(db, "users"),
                    where("uid", "==", serviceData.providerId),
                    limit(1)
                  )
                )
                
                if (!providerDoc.empty) {
                  const providerData = providerDoc.docs[0].data()
                  if (providerData.profile?.location) {
                    providerLocation = providerData.profile.location
                  }
                }
              } catch (err) {
                console.error("Error fetching provider data:", err)
              }
            }
            
            services.push({
              id: doc.id,
              ...serviceData,
              location: providerLocation, // Add the location to service data
            })
          }

          servicesByCategory[category.name] = services
        }

        setCategoryServices(servicesByCategory)
        
        // Reset expanded categories when tab changes
        setExpandedCategories({})
        setExpandedCategoryServices({})
      } catch (error) {
        console.error("Error fetching category services:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryServices()
  }, [activeTab])

  // Function to handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setLoading(true)
  }

  // Function to toggle category expansion
  const toggleCategoryExpansion = async (categoryName: string) => {
    const isCurrentlyExpanded = expandedCategories[categoryName] || false;
    
    // Update UI state first for immediate feedback
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !isCurrentlyExpanded
    }));
    
    // If we're expanding and don't have expanded data yet, fetch it
    if (!isCurrentlyExpanded && !expandedCategoryServices[categoryName]) {
      try {
        setExpandLoading(prev => ({ ...prev, [categoryName]: true }));
        
        const { db } = await initializeFirebase();
        if (!db) {
          throw new Error("Failed to initialize Firebase");
        }
        
        // Fetch more items (9 total)
        const q = query(
          collection(db, "services"),
          where("category", "==", categoryName),
          where("active", "==", true),
          limit(9) // 9 items total (more than the initial 3)
        );
        
        const querySnapshot = await getDocs(q);
        const services: Service[] = [];
        
        for (const doc of querySnapshot.docs) {
          const serviceData = doc.data() as Omit<Service, "id">;
          let providerLocation = "Philippines";
          
          if (serviceData.providerId) {
            try {
              const providerDoc = await getDocs(
                query(
                  collection(db, "users"),
                  where("uid", "==", serviceData.providerId),
                  limit(1)
                )
              );
              
              if (!providerDoc.empty) {
                const providerData = providerDoc.docs[0].data();
                if (providerData.profile?.location) {
                  providerLocation = providerData.profile.location;
                }
              }
            } catch (err) {
              console.error("Error fetching provider data:", err);
            }
          }
          
          services.push({
            id: doc.id,
            ...serviceData,
            location: providerLocation,
          });
        }
        
        setExpandedCategoryServices(prev => ({
          ...prev,
          [categoryName]: services
        }));
      } catch (error) {
        console.error("Error fetching expanded services:", error);
        // If there's an error, revert the expanded state
        setExpandedCategories(prev => ({
          ...prev,
          [categoryName]: false
        }));
      } finally {
        setExpandLoading(prev => ({ ...prev, [categoryName]: false }));
      }
    }
  };

  // Function to handle selecting a category (store in context, but don't navigate)
  const handleSelectCategory = (category: string) => {
    if (activeTab === "global") {
      setSelectedGlobalCategory(category)
    } else {
      setSelectedLocalCategory(category)
    }
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Browse by Category</h2>
          
          <Tabs defaultValue="global" onValueChange={handleTabChange} className="max-w-xs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="global">Global Services</TabsTrigger>
              <TabsTrigger value="local">Local Services</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-8">
          {/* Display categories based on active tab */}
          {(activeTab === "global" ? globalCategories : localCategories).map((category) => {
            const isExpanded = expandedCategories[category.name] || false;
            const displayServices = isExpanded 
              ? (expandedCategoryServices[category.name] || [])
              : (categoryServices[category.name] || []).slice(0, 3); // Show only 3 items when not expanded
            const isLoading = expandLoading[category.name] || false;
            
            return (
              <div key={category.name} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-primary hover:text-primary-dark hover:bg-primary/10"
                    onClick={() => toggleCategoryExpansion(category.name)}
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>View All</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {loading || isLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-40 w-full rounded-lg bg-muted" />
                          <div className="mt-4 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-muted" />
                            <div className="h-4 w-1/2 rounded bg-muted" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : displayServices.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {displayServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        id={service.id}
                        title={service.title}
                        description={service.description}
                        price={service.price}
                        category={service.category}
                        image={service.image}
                        provider={{
                          id: service.providerId,
                          name: service.providerName,
                          avatar: service.providerAvatar,
                          location: service.location,
                          rating: service.rating
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border">
                    <p className="text-muted-foreground">No services available in this category</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Modal */}
        {selectedService && (
          <ContactModal 
            {...selectedService}
            open={isContactModalOpen}
            onOpenChange={setIsContactModalOpen}
            dialogName="category-section-contact-modal"
          />
        )}
      </div>
    </section>
  )
}
