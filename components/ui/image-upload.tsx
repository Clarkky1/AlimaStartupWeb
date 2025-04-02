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
}

export function ImageUpload({
  onUploadComplete,
  defaultImage = "",
  folder = "uploads",
  className = "",
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
      
      // Update preview with Cloudinary URL
      setImagePreview(result.url)
      
      // Notify parent component
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
      {imagePreview ? (
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
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
          <Image className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">No image selected</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>
    </div>
  )
}
