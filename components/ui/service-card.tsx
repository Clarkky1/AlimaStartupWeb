"use client"

import Image from "next/image" 
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarIcon, MapPinIcon, MessageSquare } from "lucide-react"
import { ContactModal } from "@/components/messages/contact-modal"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface Provider {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
}

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  image: string;
  provider?: Provider; // Make provider optional
}

// Default provider values
const defaultProvider: Provider = {
  id: "unknown",
  name: "Service Provider",
  avatar: "/person-male-1.svg",
  location: "Philippines",
  rating: 4.0
}

// Function to format category name
const formatCategoryName = (category: string) => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function ServiceCard({
  id,
  title,
  description,
  price,
  category,
  image,
  provider = defaultProvider // Set default value
}: ServiceCardProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // Use a fallback image handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/person-male-1.svg"
    e.currentTarget.onerror = null // Prevent infinite loop
  }

  return (
    <>
      <Card className="group overflow-hidden">
        <CardContent className="p-0">
          <Link href={`/service/${id}`}>
            <div className="aspect-video overflow-hidden relative">
              <img
                src={image || "/placeholder.jpg"}
                alt={title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.jpg"
                  e.currentTarget.onerror = null
                }}
              />
            </div>
          </Link>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold leading-none tracking-tight">
                <Link href={`/service/${id}`}>{title}</Link>
              </h3>
              <Badge 
                className="bg-green-500 hover:bg-green-600 text-white border-0"
                variant="secondary"
              >
                {formatCategoryName(category)}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">₱{price}</span>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{provider.rating}</span>
              </div>
            </div>

            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-primary/10">
                    <img 
                      src={provider.avatar} 
                      alt={provider.name} 
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{provider.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPinIcon className="h-3 w-3" />
                      <span>{provider.location}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsContactModalOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContactModal
        providerId={provider.id}
        providerName={provider.name}
        providerAvatar={provider.avatar}
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />
    </>
  )
}
