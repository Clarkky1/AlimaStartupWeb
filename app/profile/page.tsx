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
import { ArrowLeft, CheckCircle } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { useNetworkStatus } from "@/app/context/network-status-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth()
  const { isOnline } = useNetworkStatus()
  const router = useRouter()
  const { toast } = useToast()
  const [avatar, setAvatar] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
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
      setAvatar(user.profilePicture || user.photoURL || "")
    }
  }, [user])

  // Handle avatar upload complete
  const handleAvatarUpload = async (imageUrl: string) => {
    // Add cache-busting parameter to the avatar URL
    const uniqueTimestamp = Date.now();
    const cacheBustedUrl = imageUrl.includes('?') 
      ? `${imageUrl}&t=${uniqueTimestamp}&forceRefresh=true` 
      : `${imageUrl}?t=${uniqueTimestamp}&forceRefresh=true`;
    
    setAvatar(cacheBustedUrl)
    
    // Immediately update the profile picture in Firestore
    if (imageUrl && user && isOnline) {
      try {
        const { db } = await initializeFirebase()
        if (!db) {
          console.error("Failed to initialize Firebase")
          return;
        }

        const { doc, updateDoc } = await import("firebase/firestore")
        
        // Only update the profile picture fields - store original URL in DB
        const updateData = {
          profilePicture: imageUrl, // Store clean URL without cache-busting
          updatedAt: new Date().toISOString(),
        }

        // Update user document in Firestore (without cache parameters)
        await updateDoc(doc(db, "users", user.uid), updateData)
        
        // Update local state with cache-busted version
        setUser({
          ...user,
          ...updateData,
          profilePicture: cacheBustedUrl, // Use cache-busted version for the UI
        })
        
        // Force reload all images in the DOM with this source
        if (typeof window !== 'undefined' && isOnline) {
          const allImages = document.querySelectorAll('img');
          allImages.forEach(img => {
            if (img instanceof HTMLImageElement) {
              const imgSrc = img.src;
              // Check if this is likely a profile image for this user
              if (imgSrc.includes(user.uid) || 
                  imgSrc.includes('avatar') || 
                  imgSrc.includes('profile') ||
                  (imgSrc.includes('cloudinary') && imgSrc.includes(imageUrl.split('/').pop()?.split('.')[0] || ''))) {
                
                // Force a reload by setting a new src with cache busting
                const newSrc = imgSrc.includes('?') 
                  ? `${imgSrc.split('?')[0]}?t=${uniqueTimestamp}&nocache=true` 
                  : `${imgSrc}?t=${uniqueTimestamp}&nocache=true`;
                
                img.src = newSrc;
              }
            }
          });
        }
        
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        });
      } catch (error) {
        console.error("Error updating profile picture:", error);
        toast({
          title: "Error updating profile picture",
          description: "There was an error updating your profile picture",
          variant: "destructive"
        });
      }
    }
  }

  const updateProfile = async () => {
    if (!user || !isOnline) {
      toast({
        title: isOnline ? "Not authenticated" : "Offline",
        description: isOnline ? "Please log in to update your profile" : "Cannot update profile while offline",
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

      // Include profile picture if available - strip any cache-busting parameters first
      if (avatar) {
        // Remove any cache-busting query parameters before storing in DB
        const cleanAvatarUrl = avatar.includes('?') ? avatar.split('?')[0] : avatar;
        updateData.profilePicture = cleanAvatarUrl;
      }

      // Update the user document in Firestore
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, updateData)

      // Add cache-busting for UI display
      const uniqueTimestamp = Date.now();
      if (avatar) {
        updateData.profilePicture = avatar.includes('?')
          ? `${avatar.split('?')[0]}?t=${uniqueTimestamp}`
          : `${avatar}?t=${uniqueTimestamp}`;
      }
      
      // Update local user state with cache-busted version for UI
      setUser({
        ...user,
        ...updateData
      })
      
      // Also refresh the avatar state with cache-busting
      if (avatar) {
        setAvatar(updateData.profilePicture);
      }

      // Show success dialog instead of just toast
      setShowSuccessDialog(true)
      
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
              <AvatarImage 
                key={`avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
                src={isOnline ? `${avatar || ""}${avatar && avatar.includes('?') ? '&' : '?'}forceReload=${Date.now()}` : undefined}
                alt={user.displayName || "User"} 
                onError={(e) => {
                  const imgElement = e.currentTarget;
                  imgElement.style.display = 'none';
                  console.error("Avatar image failed to load:", avatar);
                }}
              />
              <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            
            <div className="w-full flex justify-center">
              <div className="max-w-[250px]">
                <ImageUpload
                  onUploadComplete={handleAvatarUpload}
                  defaultImage={avatar}
                  folder={`users/${user?.uid || "unknown"}`}
                  hidePreview={true}
                  disabled={!isOnline}
                />
              </div>
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
                disabled={!isOnline}
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
                disabled={!isOnline}
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
                  disabled={!isOnline}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Your city or area"
                  disabled={!isOnline}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={updateProfile} 
            disabled={isUpdating || !isOnline}
            className="w-full sm:w-auto sm:min-w-32"
            variant="default"
          >
            {isUpdating ? "Updating..." : "Update Profile"}
          </Button>
        </CardFooter>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-500 h-5 w-5" />
              Profile Updated Successfully
            </DialogTitle>
            <DialogDescription>
              Your profile information has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
