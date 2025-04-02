"use client"

// ... in your profile update function
import { useAuth } from "@/app/context/auth-context"

const handleProfileImageUpload = async (file: File): Promise<string> => {
  const { user } = useAuth()
  if (!user) {
    throw new Error("User not authenticated")
  }
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", `users/${user.uid}`)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error("Error uploading profile image:", error)
    throw error
  }
}

// Then use this function when updating the profile
const updateProfile = async (profileImageFile: File | null) => {
  const { user } = useAuth()
  if (!user) {
    console.error("User not authenticated")
    return
  }

  if (profileImageFile) {
    try {
      const imageUrl = await handleProfileImageUpload(profileImageFile)
      // Update user document with new image URL
      console.log("Image URL:", imageUrl)
      // Assuming you have a function to update the user document
      // await updateUserDocument(user.id, { profileImageUrl: imageUrl });
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }
}
