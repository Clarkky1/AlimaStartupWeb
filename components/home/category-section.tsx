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
                  <div className="flex justify-center items-center py-8">
                    <style jsx>{`
                      /* From Uiverse.io by vinodjangid07 */ 
                      .loader {
                        width: fit-content;
                        height: fit-content;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      }

                      .truckWrapper {
                        width: 200px;
                        height: 100px;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        align-items: center;
                        justify-content: flex-end;
                        overflow-x: hidden;
                      }
                      /* truck upper body */
                      .truckBody {
                        width: 130px;
                        height: fit-content;
                        margin-bottom: 6px;
                        animation: motion 1s linear infinite;
                      }
                      /* truck suspension animation*/
                      @keyframes motion {
                        0% {
                          transform: translateY(0px);
                        }
                        50% {
                          transform: translateY(3px);
                        }
                        100% {
                          transform: translateY(0px);
                        }
                      }
                      /* truck's tires */
                      .truckTires {
                        width: 130px;
                        height: fit-content;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0px 10px 0px 15px;
                        position: absolute;
                        bottom: 0;
                      }
                      .truckTires svg {
                        width: 24px;
                      }

                      .road {
                        width: 100%;
                        height: 1.5px;
                        background-color: #282828;
                        position: relative;
                        bottom: 0;
                        align-self: flex-end;
                        border-radius: 3px;
                      }
                      .road::before {
                        content: "";
                        position: absolute;
                        width: 20px;
                        height: 100%;
                        background-color: #282828;
                        right: -50%;
                        border-radius: 3px;
                        animation: roadAnimation 1.4s linear infinite;
                        border-left: 10px solid white;
                      }
                      .road::after {
                        content: "";
                        position: absolute;
                        width: 10px;
                        height: 100%;
                        background-color: #282828;
                        right: -65%;
                        border-radius: 3px;
                        animation: roadAnimation 1.4s linear infinite;
                        border-left: 4px solid white;
                      }

                      .lampPost {
                        position: absolute;
                        bottom: 0;
                        right: -90%;
                        height: 90px;
                        animation: roadAnimation 1.4s linear infinite;
                      }

                      @keyframes roadAnimation {
                        0% {
                          transform: translateX(0px);
                        }
                        100% {
                          transform: translateX(-350px);
                        }
                      }
                    `}</style>

                    <div className="loader">
                      <div className="truckWrapper">
                        <div className="truckBody">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 198 93"
                            className="trucksvg"
                          >
                            <path
                              strokeWidth="3"
                              stroke="#282828"
                              fill="#F83D3D"
                              d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
                            ></path>
                            <path
                              strokeWidth="3"
                              stroke="#282828"
                              fill="#7D7C7C"
                              d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
                            ></path>
                            <path
                              strokeWidth="2"
                              stroke="#282828"
                              fill="#282828"
                              d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
                            ></path>
                            <rect
                              strokeWidth="2"
                              stroke="#282828"
                              fill="#FFFCAB"
                              rx="1"
                              height="7"
                              width="5"
                              y="63"
                              x="187"
                            ></rect>
                            <rect
                              strokeWidth="2"
                              stroke="#282828"
                              fill="#282828"
                              rx="1"
                              height="11"
                              width="4"
                              y="81"
                              x="193"
                            ></rect>
                            <rect
                              strokeWidth="3"
                              stroke="#282828"
                              fill="#DFDFDF"
                              rx="2.5"
                              height="90"
                              width="121"
                              y="1.5"
                              x="6.5"
                            ></rect>
                            <rect
                              strokeWidth="2"
                              stroke="#282828"
                              fill="#DFDFDF"
                              rx="2"
                              height="4"
                              width="6"
                              y="84"
                              x="1"
                            ></rect>
                          </svg>
                        </div>
                        <div className="truckTires">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 30 30"
                            className="tiresvg"
                          >
                            <circle
                              strokeWidth="3"
                              stroke="#282828"
                              fill="#282828"
                              r="13.5"
                              cy="15"
                              cx="15"
                            ></circle>
                            <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                          </svg>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 30 30"
                            className="tiresvg"
                          >
                            <circle
                              strokeWidth="3"
                              stroke="#282828"
                              fill="#282828"
                              r="13.5"
                              cy="15"
                              cx="15"
                            ></circle>
                            <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                          </svg>
                        </div>
                        <div className="road"></div>

                        <svg
                          xmlSpace="preserve"
                          viewBox="0 0 453.459 453.459"
                          xmlns="http://www.w3.org/2000/svg"
                          id="Capa_1"
                          version="1.1"
                          fill="#000000"
                          className="lampPost"
                        >
                          <path
                            d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993
                            c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514
                            c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16
                            c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914
                            h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75
                            v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795
                            V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z
                            M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017
                            h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
                          ></path>
                        </svg>
                      </div>
                          </div>
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
