import { NextResponse } from "next/server"
import { cloudinary } from "@/app/lib/server/cloudinary"
import { getRandomAvatar, getPaymentConfirmationImage, getFallbackIllustration } from "@/app/lib/avatar-utils"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || process.env.UPLOAD_FOLDER || "uploads"
    const providerId = formData.get("providerId") as string
    const isPaymentProof = folder.includes("payment-proofs")
    const isProfileImage = folder.includes("profile-pictures") || folder.includes("profile-picture")

    if (!file) {
      console.error("Upload error: No file provided")
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Log file information for debugging
    console.log(`Processing upload: ${file.name}, size: ${file.size}, type: ${file.type}, folder: ${folder}`)

    try {
      // Convert File to base64
      const bytes = await file.arrayBuffer()
      const base64File = Buffer.from(bytes).toString('base64')
      const dataURI = `data:${file.type};base64,${base64File}`

      // Upload to Cloudinary with proper error handling
      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: "auto",
        overwrite: true,
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
      
      // Use randomized avatar for profile pictures, peace-hand for everything else
      let fallbackUrl = '/illustrations/peace-hand.svg'
      
      if (isProfileImage && providerId) {
        fallbackUrl = getFallbackIllustration(providerId)
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
    
    // Use randomized avatar for profile pictures, peace-hand for everything else
    let fallbackUrl = '/illustrations/peace-hand.svg'
    
    if (isProfileImage && providerId) {
      fallbackUrl = getFallbackIllustration(providerId)
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
