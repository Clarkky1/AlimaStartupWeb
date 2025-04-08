"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { initializeFirebase } from "@/app/lib/firebase"
import { ImageUpload } from "@/components/ui/image-upload"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, UserRound } from "lucide-react"
import { getDefaultAvatar, createImageErrorHandler } from "@/app/lib/avatar-utils"

export function ProfileSettings() {
  const { user, setUser, refreshUserData } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [avatar, setAvatar] = useState("")

  const defaultAvatar = user?.uid ? getDefaultAvatar(user.uid) : "/illustrations/person-default.svg"
  const handleImageError = user?.uid ? createImageErrorHandler(user.uid) : undefined

  useEffect(() => {
    if (user) {
      setName(user.displayName || user.name || "")
      setBio(user.bio || "")
      setPhone(user.contactNumber || user.phone || "")
      setLocation(user.location || "")
      setAvatar(user.profilePicture || user.avatar || "")
    }
  }, [user])

  const handleAvatarUpload = (url: string) => {
    // Add cache-busting parameter to the avatar URL
    const cacheBustedUrl = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    setAvatar(cacheBustedUrl)
    
    // After setting the avatar URL, immediately update the user data
    // This ensures the profile picture is visible throughout the app
    if (url && user) {
      updateProfilePicture(url);
    }
  }
  
  // New function to update just the profile picture in Firestore and auth context
  const updateProfilePicture = async (imageUrl: string) => {
    if (!user) return;

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
        avatar: imageUrl,         // Store clean URL without cache-busting
        updatedAt: new Date().toISOString(),
      }

      // Update user document in Firestore (without cache parameters)
      await updateDoc(doc(db, "users", user.uid), updateData)
      
      // Create cache-busted version for the UI with unique timestamp
      const uniqueTimestamp = Date.now();
      const cacheBustedUrl = imageUrl.includes('?') 
        ? `${imageUrl}&t=${uniqueTimestamp}&forceRefresh=true` 
        : `${imageUrl}?t=${uniqueTimestamp}&forceRefresh=true`;
        
      // Update local state with cache-busted version
      setUser({
        ...user,
        ...updateData,
        avatar: cacheBustedUrl, // Use cache-busted version for the UI
      })
      
      // Immediately update the avatar in the component state to force a re-render
      setAvatar(cacheBustedUrl);

      // Force reload all images in the DOM with this source
      if (typeof window !== 'undefined') {
        // This stronger approach will update ALL images that might show the user's avatar
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
              
              // Also update the key attribute if it exists
              if (img.parentElement && img.parentElement.hasAttribute('key')) {
                img.parentElement.setAttribute('key', `img-${uniqueTimestamp}`);
              }
            }
          }
        });
      }
      
      // Refresh user data globally
      if (refreshUserData) {
        await refreshUserData();
        
        // Add a small delay and try again to ensure all components are updated
        setTimeout(async () => {
          try {
            await refreshUserData();
          } catch (e) {
            console.error("Error in delayed refresh:", e);
          }
        }, 500);
      }
      
      // Force a browser repaint to show the new image
      if (typeof window !== 'undefined') {
        // This forces a reflow/repaint
        document.body.style.display = 'none';
        // This line causes the browser to re-render
        void document.body.offsetHeight;
        document.body.style.display = '';
      }
      
    } catch (error) {
      console.error("Error updating profile picture:", error)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      const { doc, updateDoc } = await import("firebase/firestore")
      const timestamp = new Date().toISOString()

      const updatedUserData = {
        displayName: name,
        name: name,
        profilePicture: avatar,
        avatar: avatar,
        bio: bio,
        location: location,
        phone: phone,
        contactNumber: phone,
        updatedAt: timestamp,
      }

      // Update user document
      await updateDoc(doc(db, "users", user.uid), updatedUserData)

      // Update local storage and user state with all properties
      if (typeof window !== 'undefined') {
        localStorage.setItem(`avatar_${user.uid}`, avatar || defaultAvatar)
        localStorage.setItem(`name_${user.uid}`, name)
      }

      // Update all service provider names and avatars
      const { collection, query, where, getDocs } = await import("firebase/firestore")
      const servicesQuery = query(
        collection(db, "services"),
        where("providerId", "==", user.uid)
      )

      const querySnapshot = await getDocs(servicesQuery)
      const updatePromises = querySnapshot.docs.map(docRef => {
        return updateDoc(docRef.ref, {
          providerName: name,
          providerAvatar: avatar || defaultAvatar,
          updatedAt: timestamp,
        })
      })

      await Promise.all(updatePromises)

      // Finally update local user state
      setUser({
        ...user,
        ...updatedUserData,
      })
      
      // Refresh user data to ensure all components are updated
      if (refreshUserData) {
        await refreshUserData();
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile information and how others see you on the platform
          </p>
        </div>
        {user?.role === "provider" && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Service Provider
          </Badge>
        )}
      </div>

      <Separator className="my-6" />

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserRound className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-background shadow-xl">
                    <img
                      key={`avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
                      src={`${avatar || defaultAvatar}${avatar && avatar.includes('?') ? '&' : '?'}forceReload=${Date.now()}`}
                      alt={name || "Profile"}
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                      onLoad={() => console.log("Profile image loaded:", avatar)}
                      crossOrigin="anonymous"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  {(avatar || user?.profilePicture || user?.avatar) && (
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-green-500 p-1.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center w-full">
                  <div className="max-w-[250px] w-full">
                    <ImageUpload
                      onUploadComplete={handleAvatarUpload}
                      defaultImage={avatar || defaultAvatar}
                      folder={`users/${user?.uid || "unknown"}`}
                      hidePreview={true}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-[200px]">
                  Recommended: Square JPG, PNG, or GIF, at least 300x300px.
                </p>
              </div>

              {/* Form Fields Section */}
              <div className="flex-1 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your display name"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your phone number"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="font-medium">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Province, or Region"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-medium">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your experience, and what you offer..."
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Brief description for your profile. URLs are hyperlinked.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="min-w-[100px]">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

