"use client"

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

// Function to format price with thousand separators
const formatPrice = (price: string | number) => {
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
  
  // Check if it's a valid number
  if (isNaN(numericPrice)) return '₱0';
  
  // Format with thousand separators
  return `₱${numericPrice.toLocaleString('en-PH')}`;
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
      <Card className="group overflow-hidden h-full flex flex-col border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm bg-white/95 dark:bg-black/85 dark:border-gray-800">
        <CardContent className="p-0 flex flex-col h-full relative">
          <div className="aspect-video overflow-hidden relative">
            <img
              src={currentServiceImageSrc}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
              onError={isOnline ? handleServiceImageError : undefined}
            />
          </div>

          <div className="space-y-3 p-4 flex-1 flex flex-col relative">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight tracking-tight text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {title}
              </h3>
              <Badge 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 text-xs whitespace-nowrap flex-shrink-0 mt-0.5"
                variant="secondary"
              >
                {formatCategoryName(category)}
              </Badge>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 flex-grow">{description}</p>

            <div className="flex items-center justify-between mt-auto pt-2">
              {showRating && provider.hasRating ? (
                <div className="flex items-center gap-1.5">
                  <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs sm:text-sm font-medium">{provider.rating}</span>
                </div>
              ) : (
                <div className="flex-1"></div>
              )}
              <div className="flex justify-end w-full mr-1">
                <span className="text-base sm:text-lg font-bold text-blue-500">{formatPrice(price)}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <img 
                      src={currentAvatarSrc}
                      alt={provider.name} 
                      className="h-full w-full object-cover"
                      onError={isOnline ? handleImageError : undefined}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{provider.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/70 truncate mt-0.5">
                      <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{provider.location}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  className="rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 flex-shrink-0 ml-2"
                  onClick={() => setIsContactModalOpen(true)}
                  title="Contact Provider"
                  aria-label="Contact Provider"
                >
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Contact</span>
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
