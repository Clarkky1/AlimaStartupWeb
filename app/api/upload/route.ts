import { NextResponse } from "next/server"
import { cloudinary } from "@/app/lib/server/cloudinary"
import { getFallbackIllustration } from "@/app/lib/avatar-utils"
import { sanitizeBasicInput } from "@/app/lib/validation"
import { nanoid } from "nanoid"

// Define allowed folder paths to prevent directory traversal
const ALLOWED_FOLDERS = [
  "uploads",
  "payment-proofs",
  "profile-pictures",
  "service-images",
  "payment-info"
];

// Define allowed file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp"
];

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    let folder = formData.get("folder") as string || process.env.UPLOAD_FOLDER || "uploads"
    const providerId = formData.get("providerId") as string

    // Basic security validation
    if (!file) {
      console.error("Upload error: No file provided")
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`Upload error: File too large (${file.size} bytes)`)
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error(`Upload error: Invalid file type (${file.type})`)
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      )
    }

    // Ensure folder is sanitized and valid
    const baseFolderName = folder.split("/")[0]; // Get base folder
    if (!ALLOWED_FOLDERS.includes(baseFolderName)) {
      console.warn(`Upload warning: Invalid folder requested (${folder}), using default`)
      folder = "uploads"; // Default to safe value
    }
    
    // Sanitize folder path to prevent directory traversal
    folder = sanitizeBasicInput(folder)
      .replace(/\.\./g, "") // Remove path traversal attempts
      .replace(/[^a-zA-Z0-9_\/-]/g, ""); // Only allow safe characters

    // Determine file type from content
    const isPaymentProof = folder.includes("payment-proofs")
    const isProfileImage = folder.includes("profile-pictures") || folder.includes("profile-picture")

    try {
      // Convert File to base64
      const bytes = await file.arrayBuffer()
      const base64File = Buffer.from(bytes).toString('base64')
      const dataURI = `data:${file.type};base64,${base64File}`

      // Generate a secure random filename using nanoid
      const secureFileName = nanoid(16);

      // Upload to Cloudinary with proper error handling
      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        public_id: secureFileName, // Use secure random filename
        resource_type: "auto",
        overwrite: false, // Don't allow overwriting existing files 
        invalidate: true,
      })

      console.log(`Upload successful: ${result.public_id}, URL: ${result.secure_url}`)
      
      return NextResponse.json({
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format
      })
    } catch (cloudinaryError: any) {
      console.error("Cloudinary upload error:", {
        message: cloudinaryError.message,
        error: cloudinaryError
      })
      
      // Use default fallback for errors
      let fallbackUrl = '/illustrations/peace-hand.svg'
      
      if (isProfileImage) {
        fallbackUrl = getFallbackIllustration()
      }
      
      return NextResponse.json({
        public_id: "placeholder",
        secure_url: fallbackUrl,
        width: 300,
        height: 300,
        format: "svg"
      })
    }
  } catch (error: any) {
    console.error("Upload error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Get provider ID from error message path if possible
    const pathMatch = error.message?.match(/providers\/([^\/]+)/) || []
    const providerId = pathMatch[1]
    
    // Determine if this is likely a profile image
    const isProfileImage = error.message?.includes("profile-picture") || error.message?.includes("profile-pictures")
    
    // Use fallback for profile images
    let fallbackUrl = '/illustrations/peace-hand.svg'
    
    if (isProfileImage) {
      fallbackUrl = getFallbackIllustration()
    }
    
    return NextResponse.json({
      public_id: "placeholder",
      secure_url: fallbackUrl,
      width: 300,
      height: 300,
      format: "svg"
    })
  }
}
