"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export function PopularCategories() {
  const router = useRouter()

  return (
    <Tabs defaultValue="global" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="global">Global Services</TabsTrigger>
        <TabsTrigger value="local">Local Services</TabsTrigger>
      </TabsList>

      <TabsContent value="global" className="mt-0">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {globalCategories.map((category) => (
            <Card
              key={category.name}
              className="cursor-pointer transition-all hover:bg-primary/5 hover:shadow-md"
              onClick={() => router.push(`/explore/${category.slug}`)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <category.icon className="mb-3 h-8 w-8 text-primary" />
                <span className="text-center font-medium">{category.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="local" className="mt-0">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {localCategories.map((category) => (
            <Card
              key={category.name}
              className="cursor-pointer transition-all hover:bg-primary/5 hover:shadow-md"
              onClick={() => router.push(`/explore/${category.slug}`)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <category.icon className="mb-3 h-8 w-8 text-primary" />
                <span className="text-center font-medium">{category.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
