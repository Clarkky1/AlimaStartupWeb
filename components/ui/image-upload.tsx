"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { uploadToCloudinary } from "@/app/lib/cloudinary"

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string) => void
  defaultImage?: string
  folder?: string
  className?: string
  hidePreview?: boolean
  disabled?: boolean
}

export function ImageUpload({
  onUploadComplete,
  defaultImage = "",
  folder = "uploads",
  className = "",
  hidePreview = false,
  disabled = false,
}: ImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string>(defaultImage)
  const [uploading, setUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Default placeholder image - using local path that definitely exists
  const placeholderImage = "/person-male-1.svg"

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create temporary preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    await handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, folder)
      
      // Log successful upload
      console.log("Cloudinary upload successful:", result.url)
      
      // Add stronger cache busting parameters
      const uniqueTime = Date.now();
      const cacheBustUrl = `${result.url}?timestamp=${uniqueTime}&nocache=true&forceReload=1`
      
      // Update preview with cache-busted Cloudinary URL
      setImagePreview(cacheBustUrl)
      
      // Clear any existing image with this path from browser cache
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          // Try to clear cache entry for this image
          const cacheNames = await window.caches.keys();
          for (const cacheName of cacheNames) {
            const cache = await window.caches.open(cacheName);
            await cache.delete(result.url);
            await cache.delete(cacheBustUrl);
          }
        } catch (e) {
          console.error('Error clearing image cache:', e);
        }
      }
      
      // Notify parent component with both URLs
      onUploadComplete(result.url)
      
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded",
      })
    } catch (error) {
      console.error("Upload error:", error)
      // Revert to default image on error
      setImagePreview(defaultImage || placeholderImage)
      onUploadComplete(defaultImage || placeholderImage)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const clearImage = () => {
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onUploadComplete("")
  }

  // Handle image load error
  const handleImageError = () => {
    console.error("Image failed to load, using placeholder instead:", imagePreview)
    setImagePreview(placeholderImage)
    onUploadComplete(placeholderImage)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-center w-full">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {imagePreview && !hidePreview && (
        <div className="relative">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-40 w-full rounded-md object-cover"
            onError={handleImageError}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
