"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { initializeFirebase } from "@/app/lib/firebase"
import { ArrowLeft } from "lucide-react"

// Utility functions moved outside the component
const handleProfileImageUpload = async (file: File, userId: string): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", `users/${userId}`)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const data = await response.json()
    return data.secure_url // Make sure the property name matches what your API returns
  } catch (error) {
    console.error("Error uploading profile image:", error)
    throw error
  }
}

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?returnUrl=/profile')
    }
  }, [user, loading, router])

  // Initialize form with user data when available
  useEffect(() => {
    if (user) {
      setName(user.displayName || user.name || "")
      setBio(user.bio || "")
      setPhone(user.phone || "")
      setLocation(user.location || "")
    }
  }, [user])

  const updateProfile = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to update your profile",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      const { db } = await initializeFirebase()
      if (!db) {
        throw new Error("Failed to initialize Firestore")
      }

      // Import Firestore functions
      const { doc, updateDoc } = await import("firebase/firestore")
      
      const updateData: any = {
        displayName: name,
        name,
        bio,
        phone,
        location,
        updatedAt: new Date().toISOString()
      }

      // Upload profile image if provided
      if (profileImageFile) {
        const imageUrl = await handleProfileImageUpload(profileImageFile, user.uid)
        updateData.profilePicture = imageUrl
      }

      // Update the user document in Firestore
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, updateData)

      // Update local user state
      setUser({
        ...user,
        ...updateData
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error updating profile",
        description: "There was an error updating your profile",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-2 flex items-center gap-1"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="pt-8">
            <CardTitle>Profile</CardTitle>
            <CardDescription>View and update your profile information</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.photoURL || user.profilePicture || ""} alt={user.displayName || "User"} />
              <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            
            <div>
              <input 
                type="file" 
                id="profile-image" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setProfileImageFile(file)
                  }
                }}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('profile-image')?.click()}
              >
                Change Profile Picture
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email || ""} disabled />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Tell us a bit about yourself"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Your city or area"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={updateProfile} 
            disabled={isUpdating}
            className="w-full sm:w-auto sm:min-w-32"
            variant="default"
          >
            {isUpdating ? "Updating..." : "Update Profile"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
