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
import { LucideIcon, Search, X } from "lucide-react"
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

interface Category {
  name: string;
  value: string;
  icon?: LucideIcon;
}

const globalCategories: Category[] = [
  { name: "All Categories", value: "all" },
  { name: "Development", icon: Code, value: "development" },
  { name: "Design", icon: PenTool, value: "design" },
  { name: "Marketing", icon: BarChart, value: "marketing" },
  { name: "Mobile Apps", icon: Smartphone, value: "mobile-apps" },
  { name: "Writing", icon: FileText, value: "writing" },
  { name: "Video", icon: Video, value: "video" },
  { name: "Photography", icon: Camera, value: "photography" },
  { name: "Music", icon: Music, value: "music" },
  { name: "Education", icon: BookOpen, value: "education" },
  { name: "Translation", icon: Globe, value: "translation" },
  { name: "Business", icon: Briefcase, value: "business" },
  { name: "Lifestyle", icon: Home, value: "lifestyle" },
]

const localCategories: Category[] = [
  { name: "All Categories", value: "all" },
  { name: "Property & Rental", value: "property-rental" },
  { name: "Academic & Tutorial", value: "academic-tutorial" },
  { name: "Automotive & Motorcycle", value: "automotive-motorcycle" },
  { name: "Digital Marketing", value: "digital-marketing" },
  { name: "Beauty & Business", value: "beauty-business" },
  { name: "Event Management", value: "event-management" },
  { name: "PC & Smartphone", value: "pc-smartphone" },
  { name: "Psychological", value: "psychological" },
  { name: "Electronics & Electrical", value: "electronics-electrical" }
]

// Mock data as fallback
const mockServices: Service[] = [
  {
    id: "s1",
    title: "Professional Web Development",
    description: "Custom websites built using the latest technologies. Responsive design, SEO optimized, and user-friendly interfaces.",
    price: "5,000",
    category: "web-development",
    image: "https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
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
    image: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
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
  },
  {
    id: "s3",
    title: "SEO Optimization Services",
    description: "Improve your website's visibility in search engines with our comprehensive SEO strategy. Technical optimization, keyword research, and content enhancement.",
    price: "6,000",
    category: "marketing",
    image: "https://images.pexels.com/photos/106344/pexels-photo-106344.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p5",
    provider: {
      id: "p5",
      name: "Mark Johnson",
      avatar: "/person-male-1.svg",
      location: "Remote",
      rating: 4.7,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.7,
  },
  {
    id: "s4",
    title: "Content Writing & Copywriting",
    description: "Engaging blog posts, website copy, product descriptions, and marketing materials that convert visitors into customers.",
    price: "2,500",
    category: "writing",
    image: "https://images.pexels.com/photos/6863250/pexels-photo-6863250.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p6",
    provider: {
      id: "p6",
      name: "Emma Wilson",
      avatar: "/person-female-1.svg",
      location: "Remote",
      rating: 4.6,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.6,
  },
  {
    id: "ls3",
    title: "Home Cleaning Service",
    description: "Professional home cleaning services including dusting, vacuuming, bathroom and kitchen cleaning. One-time or regular schedules available.",
    price: "1,500",
    category: "property-rental",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop",
    providerId: "p7",
    provider: {
      id: "p7",
      name: "Maria Santos",
      avatar: "/person-female-1.svg",
      location: "Makati City",
      rating: 4.8,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.8,
  },
  {
    id: "ls4",
    title: "Event Photography",
    description: "Capture your special events with professional photography. Weddings, birthdays, corporate events, and more with quick turnaround time.",
    price: "3,000",
    category: "event-management",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
    providerId: "p8",
    provider: {
      id: "p8",
      name: "Carlos Reyes",
      avatar: "/person-male-1.svg",
      location: "Quezon City",
      rating: 4.9,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.9,
  },
  {
    id: "s5",
    title: "Mobile App Development",
    description: "Custom iOS and Android applications built with the latest frameworks. From concept to launch with ongoing support.",
    price: "8,000",
    category: "mobile-apps",
    image: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p9",
    provider: {
      id: "p9",
      name: "David Chen",
      avatar: "/person-male-1.svg",
      location: "Remote",
      rating: 4.8,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.8,
  },
  {
    id: "ls5",
    title: "Electrical Installations & Repairs",
    description: "Professional electrical services for homes and businesses. Installations, repairs, and maintenance by licensed electricians.",
    price: "1,800",
    category: "electronics-electrical",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop",
    providerId: "p10",
    provider: {
      id: "p10",
      name: "Robert Garcia",
      avatar: "/person-male-1.svg",
      location: "Taguig City",
      rating: 4.6,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.6,
  },
  {
    id: "ls6",
    title: "Personal Fitness Training",
    description: "Personalized fitness programs with one-on-one training sessions. Goal-oriented workouts designed for your specific needs.",
    price: "2,500",
    category: "lifestyle",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop",
    providerId: "p11",
    provider: {
      id: "p11",
      name: "Miguel Santos",
      avatar: "/person-male-1.svg",
      location: "Mandaluyong City",
      rating: 4.8,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.8,
  },
  {
    id: "ls7",
    title: "Real Estate Photography",
    description: "Professional photography services for real estate listings. High-quality interior and exterior photos to showcase properties.",
    price: "3,500",
    category: "property-rental",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop",
    providerId: "p12",
    provider: {
      id: "p12",
      name: "Lisa Reyes",
      avatar: "/person-female-1.svg",
      location: "Quezon City",
      rating: 4.7,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.7,
  },
  {
    id: "ls8",
    title: "Car Detailing Service",
    description: "Complete interior and exterior car detailing. Professional cleaning, polishing, and protection for your vehicle.",
    price: "2,200",
    category: "automotive-motorcycle",
    image: "https://images.pexels.com/photos/6873077/pexels-photo-6873077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p13",
    provider: {
      id: "p13",
      name: "James Cruz",
      avatar: "/person-male-1.svg",
      location: "Makati City",
      rating: 4.9,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.9,
  },
  {
    id: "ls9",
    title: "Local SEO Services",
    description: "Improve your local business visibility online. Google My Business optimization, local citation building, and review management.",
    price: "4,500",
    category: "digital-marketing",
    image: "https://images.unsplash.com/photo-1553484771-047a44eee27a?q=80&w=2070&auto=format&fit=crop",
    providerId: "p14",
    provider: {
      id: "p14",
      name: "Anna Santos",
      avatar: "/person-female-1.svg",
      location: "Pasig City",
      rating: 4.6,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.6,
  },
  {
    id: "ls10",
    title: "Mental Health Counseling",
    description: "Licensed professional counseling services for individuals and couples. Confidential sessions in a supportive environment.",
    price: "2,000",
    category: "psychological",
    image: "https://images.unsplash.com/photo-1573497019707-1c04de26e58c?q=80&w=2070&auto=format&fit=crop",
    providerId: "p15",
    provider: {
      id: "p15",
      name: "Dr. Elena Tan",
      avatar: "/person-female-1.svg",
      location: "Ortigas Center",
      rating: 4.9,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.9,
  },
  {
    id: "s6",
    title: "Translation Services",
    description: "Professional document translation in multiple languages. Fast turnaround times and certified translations for official documents.",
    price: "3,000",
    category: "translation",
    image: "https://images.pexels.com/photos/7516509/pexels-photo-7516509.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p16",
    provider: {
      id: "p16",
      name: "Mei Lin",
      avatar: "/person-female-1.svg",
      location: "Remote",
      rating: 4.9,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.9,
  },
  {
    id: "s7",
    title: "Video Editing & Production",
    description: "Professional video editing, color grading, and post-production services for YouTube, social media, and business videos.",
    price: "4,500",
    category: "video",
    image: "https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p17",
    provider: {
      id: "p17",
      name: "Alex Miller",
      avatar: "/person-male-1.svg",
      location: "Remote",
      rating: 4.8,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.8,
  },
  {
    id: "s8",
    title: "Music Production & Composition",
    description: "Custom music composition, recording, and production services. Background music for videos, podcasts, and commercials.",
    price: "5,500",
    category: "music",
    image: "https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p18",
    provider: {
      id: "p18",
      name: "Marcus Johnson",
      avatar: "/person-male-2.svg",
      location: "Remote",
      rating: 4.7,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.7,
  },
  {
    id: "s9",
    title: "E-commerce Development",
    description: "Custom online store development using Shopify, WooCommerce, or Magento. Mobile-responsive design with secure payment processing.",
    price: "7,000",
    category: "development",
    image: "https://images.pexels.com/photos/900108/pexels-photo-900108.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p19",
    provider: {
      id: "p19",
      name: "Robert Chen",
      avatar: "/person-male-1.svg",
      location: "Remote",
      rating: 4.9,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.9,
  },
  {
    id: "s10",
    title: "Social Media Marketing",
    description: "Complete social media marketing strategies, content creation, and management for Facebook, Instagram, TikTok, and Twitter.",
    price: "4,000",
    category: "marketing",
    image: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p20",
    provider: {
      id: "p20",
      name: "Sophia Williams",
      avatar: "/person-female-2.svg",
      location: "Remote",
      rating: 4.8,
    },
    isGlobalService: true,
    isLocalService: false,
    rating: 4.8,
  },
  {
    id: "ls11",
    title: "Property Management Service",
    description: "Complete property management for landlords including tenant screening, rent collection, maintenance coordination, and accounting.",
    price: "3,000",
    category: "property-rental",
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p21",
    provider: {
      id: "p21",
      name: "Ricardo Mendoza",
      avatar: "/person-male-1.svg",
      location: "Quezon City",
      rating: 4.7,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.7,
  },
  {
    id: "ls12",
    title: "Science & Physics Tutoring",
    description: "Expert tutoring in physics, chemistry, and biology for high school and college students. Specialized test preparation for entrance exams.",
    price: "600",
    category: "academic-tutorial",
    image: "https://images.pexels.com/photos/6958506/pexels-photo-6958506.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p22",
    provider: {
      id: "p22",
      name: "Dr. Daniel Santos",
      avatar: "/person-male-2.svg",
      location: "Manila",
      rating: 4.9,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.9,
  },
  {
    id: "ls13",
    title: "Motorcycle Repair & Maintenance",
    description: "Professional motorcycle repair, maintenance, and customization services. Engine work, brake systems, electrical repairs, and more.",
    price: "1,500",
    category: "automotive-motorcycle",
    image: "https://images.pexels.com/photos/8985463/pexels-photo-8985463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p23",
    provider: {
      id: "p23",
      name: "Miguel Reyes",
      avatar: "/person-male-1.svg",
      location: "Paranaque City",
      rating: 4.8,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.8,
  },
  {
    id: "ls14",
    title: "Social Media Management",
    description: "Strategic social media management for local businesses. Content creation, posting schedules, engagement, and analytics reporting.",
    price: "2,500",
    category: "digital-marketing",
    image: "https://images.pexels.com/photos/267482/pexels-photo-267482.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p24",
    provider: {
      id: "p24",
      name: "Lisa Garcia",
      avatar: "/person-female-1.svg",
      location: "Makati City",
      rating: 4.7,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.7,
  },
  {
    id: "ls15",
    title: "Wedding Photography & Videography",
    description: "Complete wedding photography and videography packages. Pre-wedding shoots, ceremony coverage, and reception with professional editing.",
    price: "15,000",
    category: "event-management",
    image: "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    providerId: "p25",
    provider: {
      id: "p25",
      name: "Marco Antonio",
      avatar: "/person-male-2.svg",
      location: "Taguig City",
      rating: 4.9,
    },
    isGlobalService: false,
    isLocalService: true,
    rating: 4.9,
  }
]

// Log mock data counts
const globalMockServicesCount = mockServices.filter(s => s.isGlobalService === true).length;
const localMockServicesCount = mockServices.filter(s => s.isLocalService === true).length;
console.log(`Mock data check: ${globalMockServicesCount} global services, ${localMockServicesCount} local services`);

// Improved normalizeCategory function - defined as a regular function outside the component
const normalizeCategory = (category: string): string => {
  if (!category) return '';
  
  // Convert to lowercase and trim
  return category
    .toLowerCase()
    .trim()
    // Replace & and and with empty string for better matching
    .replace(/&/g, 'and')
    .replace(/\s+and\s+/g, 'and')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '');
};

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
        const filteredMock = mockServices.filter(service => 
          activeTab === "global" ? service.isGlobalService : service.isLocalService
        );
        console.log(`Initial mock data for ${activeTab} tab: ${filteredMock.length}`);
        setServices(mockServices)
        setFilteredServices(filteredMock)
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
        const filteredMock = mockServices.filter(service => 
          activeTab === "global" ? service.isGlobalService : service.isLocalService
        );
        console.log(`Initial mock data for ${activeTab} tab: ${filteredMock.length}`);
        setServices(mockServices)
        setFilteredServices(filteredMock)
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
    console.log("Filter effect triggered - current tab:", activeTab);
    if (!services.length) {
      // No services at all - use all mock data filtered by tab
      const mockFiltered = mockServices.filter(service => {
        if (activeTab === "global") {
          return service.isGlobalService === true;
        } else {
          return service.isLocalService === true;
        }
      });
      console.log(`No real services, using ${mockFiltered.length} mock data for ${activeTab} tab`);
      setFilteredServices(mockFiltered);
      return;
    }

    let filtered = [...services];

    // First filter based on active tab
    if (activeTab === "global") {
      filtered = filtered.filter(service => service.isGlobalService === true);
    } else {
      filtered = filtered.filter(service => service.isLocalService === true);
    }
    
    // Always use mock data if filtered list is empty for the current tab
    if (filtered.length === 0) {
      console.log(`No ${activeTab} services found, forcing mock data`);
      const mockFiltered = mockServices.filter(service => {
        if (activeTab === "global") {
          return service.isGlobalService === true;
        } else {
          return service.isLocalService === true;
        }
      });
      
      // IMPORTANT: Always use mock data for empty tabs
      filtered = mockFiltered;
      console.log(`Applied ${mockFiltered.length} mock services for ${activeTab} tab`);
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
      const normalizedSelected = normalizeCategory(selectedCategory);
      
      filtered = filtered.filter(service => {
        if (!service.category) return false;
        
        const normalizedServiceCategory = normalizeCategory(service.category);
        
        // Special case for categories with 'and' or '&'
        switch (normalizedSelected) {
          case 'propertyrental':
          case 'property-rental':
            return normalizedServiceCategory.includes('property') || 
                   normalizedServiceCategory.includes('rental');
          
          case 'academictutorial':
          case 'academic-tutorial':
            return normalizedServiceCategory.includes('academic') || 
                   normalizedServiceCategory.includes('tutorial');
          
          case 'automotivemotorcycle':
          case 'automotive-motorcycle':
            return normalizedServiceCategory.includes('automotive') || 
                   normalizedServiceCategory.includes('motorcycle') ||
                   normalizedServiceCategory.includes('car');
          
          case 'beautyandhealth':
          case 'beauty-health':
          case 'beautybusiness':
          case 'beauty-business':
            return normalizedServiceCategory.includes('beauty') || 
                   normalizedServiceCategory.includes('health') ||
                   normalizedServiceCategory.includes('business');
          
          case 'pcsmartphone':
          case 'pc-smartphone':
            return normalizedServiceCategory.includes('pc') || 
                   normalizedServiceCategory.includes('smartphone') ||
                   normalizedServiceCategory.includes('computer') ||
                   normalizedServiceCategory.includes('mobile');
          
          case 'eventmanagement':
          case 'event-management':
            return normalizedServiceCategory.includes('event') || 
                   normalizedServiceCategory.includes('management');
          
          case 'electronicselectrical':
          case 'electronics-electrical':
            return normalizedServiceCategory.includes('electronics') || 
                   normalizedServiceCategory.includes('electrical');
          
          default:
            // For other categories, use direct matching or include check
            return normalizedServiceCategory === normalizedSelected || 
                   normalizedServiceCategory.includes(normalizedSelected);
        }
      });
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

  // Debug current filteredServices
  useEffect(() => {
    console.log(`Tab: ${activeTab}, filteredServices: ${filteredServices.length}`);
    
    // Check if we have services for the current tab
    const servicesForCurrentTab = services.filter(service => 
      activeTab === "global" ? service.isGlobalService : service.isLocalService
    );
    console.log(`Real services for ${activeTab} tab: ${servicesForCurrentTab.length}`);
    
    // Check mock data for current tab
    const mockForCurrentTab = mockServices.filter(service => 
      activeTab === "global" ? service.isGlobalService : service.isLocalService
    );
    console.log(`Mock services for ${activeTab} tab: ${mockForCurrentTab.length}`);
  }, [activeTab, filteredServices, services]);

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
  const getCategoryName = useCallback((value: string) => {
    const allCategories: Category[] = [...globalCategories, ...localCategories]
    const category = allCategories.find(cat => 
      normalizeCategory(cat.value) === normalizeCategory(value)
    )
    return category?.name || value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs 
          value={activeTab} 
          className="w-full sm:w-auto" 
          onValueChange={(value) => {
            console.log("Tab changed to:", value);
            setActiveTab(value);
          }}
        >
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
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
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
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Force display of mock data regardless of filteredServices state */}
          {(activeTab === "global" ? 
            mockServices.filter(s => s.isGlobalService === true) : 
            mockServices.filter(s => s.isLocalService === true)
          )
            .filter(service => 
              service.title && 
              service.description && 
              service.price && 
              service.category && 
              service.image && 
              service.provider?.name
            )
            .slice(0, 8)
            .map((service) => (
              <div key={service.id} className="transition-transform hover:scale-105">
                <ServiceCard 
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  price={service.price}
                  category={service.category}
                  image={service.image || "https://via.placeholder.com/800x600?text=Service+Image"}
                  provider={{
                    ...service.provider,
                    avatar: service.provider.avatar || "/person-male-1.svg"
                  }}
                  showRating={true}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
