import { 
  Code, PenTool, BarChart, Smartphone, FileText, Video, Camera, 
  Music, BookOpen, Globe, BookOpenText, Car, Palette, Briefcase, 
  Monitor, Brain, Home, Cpu 
} from "lucide-react"

export const globalCategories = [
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

export const localCategories = [
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
