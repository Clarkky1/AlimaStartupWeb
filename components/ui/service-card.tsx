"use client"

import Image from "next/image" 
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarIcon, MapPinIcon, MessageSquare } from "lucide-react"
import { ContactModal } from "@/components/messages/contact-modal"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useNetworkStatus } from "@/app/context/network-status-context"

interface Provider {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  hasRating?: boolean;
}

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  image: string;
  provider?: Provider; // Make provider optional
  showRating?: boolean;
}

// Default provider values
const defaultProvider: Provider = {
  id: "unknown",
  name: "Service Provider",
  avatar: "/person-male-1.svg",
  location: "Philippines",
  rating: 0,
  hasRating: false
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
  provider = defaultProvider, // Set default value
  showRating = false
}: ServiceCardProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const { isOnline } = useNetworkStatus()

  // Fallback sources defined
  const serviceFallbackSrc = "/placeholder.jpg"
  const avatarFallbackSrc = "/person-male-1.svg"

  // Use a fallback image handler (still needed for online errors)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = avatarFallbackSrc
    e.currentTarget.onerror = null // Prevent infinite loop
  }

  // Handle service image error (still needed for online errors)
  const handleServiceImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log(`Image failed to load: ${image}`)
    // Use a single reliable fallback and prevent further errors
    e.currentTarget.src = serviceFallbackSrc
    e.currentTarget.onerror = null // Prevent infinite loop
  }

  // Determine image sources based on network status
  const currentServiceImageSrc = isOnline ? (image || serviceFallbackSrc) : serviceFallbackSrc
  const currentAvatarSrc = isOnline ? (provider.avatar || avatarFallbackSrc) : avatarFallbackSrc

  return (
    <>
      <Card className="group overflow-hidden h-full flex flex-col border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="aspect-video overflow-hidden relative">
            <img
              src={currentServiceImageSrc}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
              onError={isOnline ? handleServiceImageError : undefined}
            />
          </div>

          <div className="space-y-2 p-3 sm:p-4 flex-1 flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-1 sm:gap-2">
              <h3 className="font-semibold leading-tight tracking-tight text-xs sm:text-sm md:text-base line-clamp-2">
                {title}
              </h3>
              <Badge 
                className="bg-green-500 hover:bg-green-600 text-white border-0 text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 mt-0.5"
                variant="secondary"
              >
                {formatCategoryName(category)}
              </Badge>
            </div>
            
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground line-clamp-2 flex-grow">{description}</p>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base md:text-lg font-bold">₱{price}</span>
              </div>
              {showRating && provider.hasRating && (
                <div className="flex items-center gap-1">
                  <StarIcon className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium">{provider.rating}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-2 sm:pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 overflow-hidden rounded-full bg-primary/10 flex-shrink-0">
                    <img 
                      src={currentAvatarSrc}
                      alt={provider.name} 
                      className="h-full w-full object-cover"
                      onError={isOnline ? handleImageError : undefined}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm font-medium truncate">{provider.name}</p>
                    <div className="flex items-center gap-1 text-[8px] sm:text-[10px] md:text-xs text-muted-foreground truncate">
                      <MapPinIcon className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                      <span className="truncate">{provider.location}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 ml-1"
                  onClick={() => setIsContactModalOpen(true)}
                  title="Contact Provider"
                  aria-label="Contact Provider"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
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
        serviceId={id}
        serviceTitle={title}
        serviceDescription={description}
        servicePrice={price}
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />
    </>
  )
}
