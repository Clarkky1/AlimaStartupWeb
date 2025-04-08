"use client"

import { useState, useEffect } from "react"
import { getOptimizedImageUrl } from "@/app/lib/cloudinary"
import { useNetworkStatus } from "@/app/context/network-status-context"

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  priority?: boolean
}

export function ResponsiveImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  fallbackSrc = "/placeholder.svg",
  priority = false,
}: ResponsiveImageProps) {
  const { isOnline } = useNetworkStatus()
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (isOnline && src) {
      setImgSrc(getOptimizedImageUrl(src, width, height))
      setError(false)
    } else {
      setImgSrc(fallbackSrc)
      setIsLoading(false)
      if (!isOnline && src) {
        setError(true)
      }
    }
  }, [src, width, height, fallbackSrc, isOnline])

  const handleError = () => {
    setError(true)
    setImgSrc(fallbackSrc)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
        </div>
      )}
      <img
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        onError={handleError}
        onLoad={handleLoad}
        className={`h-full w-full object-cover transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  )
}

