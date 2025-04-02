"use client"

// Import the configured Cloudinary values
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./cloudinary-url"

/**
 * Uploads a file to Cloudinary
 * @param file The file to upload
 * @param folder The folder to upload to (optional)
 * @returns Promise with the upload result
 */
export async function uploadToCloudinary(file: File, folder = "uploads"): Promise<{ url: string, publicId: string }> {
  try {
    // Use the server route for file uploads
    // This is more secure than client-side uploads
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Upload error response:', errorText)
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    // Return a default image URL instead of throwing an error
    return {
      url: '/placeholder.svg',
      publicId: 'placeholder',
    }
  }
}

/**
 * Optimizes a Cloudinary URL for responsive display
 * @param url The original Cloudinary URL
 * @param width Desired width
 * @param height Desired height
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(url: string, width: number, height: number) {
  if (!url || !url.includes("cloudinary.com")) {
    return url
  }

  // Extract the base URL and file path
  const parts = url.split("/upload/")
  if (parts.length !== 2) return url

  // Insert transformation parameters
  return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${parts[1]}`
}

/**
 * Creates a responsive Cloudinary URL
 * @param url The original Cloudinary URL
 * @returns Object with different sized URLs
 */
export function getResponsiveImageUrl(url: string) {
  if (!url || !url.includes("cloudinary.com")) {
    return {
      sm: url,
      md: url,
      lg: url,
      xl: url,
    }
  }

  return {
    sm: getOptimizedImageUrl(url, 640, 480),
    md: getOptimizedImageUrl(url, 768, 576),
    lg: getOptimizedImageUrl(url, 1024, 768),
    xl: getOptimizedImageUrl(url, 1280, 960),
  }
}
