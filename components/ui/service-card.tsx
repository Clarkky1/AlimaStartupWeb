"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarIcon, MapPinIcon, MessageSquare, Loader2 } from "lucide-react"
import { ContactModal } from "@/components/messages/contact-modal"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useNetworkStatus } from "@/app/context/network-status-context"
import { format, isValid } from 'date-fns'
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import { AuthPromptModal } from "@/components/auth/auth-prompt-modal"

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
  provider?: Provider;
  showRating?: boolean;
  createdAt: Date;
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

// Function to format price
const formatPrice = (price: string) => {
  return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ServiceCard({
  id,
  title,
  description,
  price,
  category,
  image,
  provider = defaultProvider,
  showRating = false,
  createdAt
}: ServiceCardProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'pending' | 'connected'>('idle')
  const [isAuthPromptModalOpen, setIsAuthPromptModalOpen] = useState(false)
  const { isOnline } = useNetworkStatus()
  const { user } = useAuth()

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

  // Check and format date and time
  const isDateValid = isValid(new Date(createdAt));
  const formattedDate = isDateValid ? format(new Date(createdAt), 'MMM dd, yyyy') : 'Invalid Date';
  const formattedTime = isDateValid ? format(new Date(createdAt), 'p') : '--:--';

  const handleConnect = async () => {
    if (!user) {
      setIsAuthPromptModalOpen(true)
      return
    }

    setIsConnecting(true)
    try {
      const { db } = await initializeFirebase()
      if (!db) throw new Error("Failed to initialize database")

      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

      const connectionData = {
        serviceId: id,
        userId: user.uid,
        providerId: provider.id,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, "service_connections"), connectionData)
      setConnectionStatus('pending')
    } catch (error) {
      console.error("Error connecting to service:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <>
      <Card className="group overflow-hidden h-full flex flex-col border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm bg-white/95 dark:bg-black/85 dark:border-gray-800">
        <CardContent className="p-0 flex flex-col h-full relative text-[10px]">
          <div className="aspect-video overflow-hidden relative">
            <img
              src={currentServiceImageSrc}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
              onError={isOnline ? handleServiceImageError : undefined}
            />
          </div>

          <div className="space-y-2 p-3 flex-1 flex flex-col relative">
            {/* Date and Time */}
            <div className="text-[9px] text-muted-foreground/80 flex justify-between">
              <span>Date: {formattedDate}</span>
              <span>{formattedTime}</span>
            </div>

            {/* Service Name and Category */}
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-semibold leading-tight tracking-tight text-sm line-clamp-2 flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {title}
              </h3>
              <Badge
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 text-[8px] whitespace-nowrap flex-shrink-0 mt-0"
                variant="secondary"
              >
                {formatCategoryName(category)}
              </Badge>
            </div>

            {/* Description - Adjusted line clamp and text size */}
            <p className="text-[10px] text-muted-foreground/80 line-clamp-3 flex-grow">{description}</p>

            {/* Price and Provider Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1 mt-auto">
              <div className="h-5 w-5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <img
                  src={currentAvatarSrc}
                  alt={provider.name}
                  className="h-full w-full object-cover"
                  onError={isOnline ? handleImageError : undefined}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-medium truncate">By {provider.name}</p>
                <div className="flex items-center gap-0.5 text-[8px] text-muted-foreground/70 truncate">
                  <MapPinIcon className="h-2 w-2 flex-shrink-0" />
                  <span className="truncate">{provider.location}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right space-y-0.5">
                <span className="text-xs font-bold text-blue-500 block">{formatPrice(price)}</span>
                {showRating && provider.hasRating && (
                  <div className="flex items-center justify-end text-[9px] text-amber-500 mt-0.5">
                    <StarIcon className="h-2 w-2 fill-amber-500 stroke-amber-500" />
                    <span className="ml-0.5 font-medium text-[10px]">{provider.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Connect Button - Adjusted size */}
            <Button
              className={`rounded-md w-full text-[9px] h-8 mt-2 ${
                connectionStatus === 'pending' 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              onClick={handleConnect}
              disabled={isConnecting || connectionStatus === 'pending'}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                  Connecting...
                </>
              ) : connectionStatus === 'pending' ? (
                'Pending'
              ) : (
                <>
                  <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                  Connect
                </>
              )}
            </Button>
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
      <AuthPromptModal
        open={isAuthPromptModalOpen}
        onOpenChange={setIsAuthPromptModalOpen}
      />
    </>
  )
}
