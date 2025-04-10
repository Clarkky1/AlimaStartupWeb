"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const localCategoryOptions = [
  { label: "Academic & Tutorial", value: "academic-tutorial" },
  { label: "Automotive & Motorcycle", value: "automotive-motorcycle" },
  { label: "Digital Marketing", value: "digital-marketing" },
  { label: "Beauty & Business", value: "beauty-business" },
  { label: "Event Management", value: "event-management" },
  { label: "PC & Smartphone", value: "pc-smartphone" },
  { label: "Psychological", value: "psychological" },
  { label: "Property & Rental", value: "property-rental" },
  { label: "Electronics & Electrical", value: "electronics-electrical" },
]

const globalCategoryOptions = [
  { label: "Development", value: "development" },
  { label: "Design", value: "design" },
  { label: "Marketing", value: "marketing" },
  { label: "Mobile Apps", value: "mobile-apps" },
  { label: "Writing", value: "writing" },
  { label: "Video", value: "video" },
  { label: "Photography", value: "photography" },
  { label: "Music", value: "music" },
  { label: "Education", value: "education" },
  { label: "Translation", value: "translation" },
  { label: "Business", value: "business" },
  { label: "Lifestyle", value: "lifestyle" },
]

interface ProviderProfile {
  displayName: string
  profilePicture: string
  bio: string
  location: string
  contactNumber: string
  primaryCategory: string
  secondaryCategories: string[]
  yearsOfExperience: string
  priceRange: string
  languages: string
  website: string
  socialLinks: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
  }
}

export default function ProfileSetupPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  const [profileData, setProfileData] = useState<ProviderProfile>({
    displayName: "",
    profilePicture: "",
    bio: "",
    location: "",
    contactNumber: "",
    primaryCategory: "",
    secondaryCategories: [],
    yearsOfExperience: "",
    priceRange: "",
    languages: "",
    website: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: ""
    }
  })

  useEffect(() => {
    async function fetchProviderProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { db } = await initializeFirebase()
        if (!db) {
          toast({
            title: "Error",
            description: "Failed to initialize Firebase",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const docRef = doc(db, "providers", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.profile) {
            setProfileData(data.profile)
            setIsProfileComplete(!!data.profile.displayName)
          }
        }
      } catch (error) {
        console.error("Error fetching provider profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProviderProfile()
  }, [user, toast])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      // First check if the provider document exists
      const docRef = doc(db, "providers", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, {
          profile: profileData,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Create new document
        await setDoc(docRef, {
          userId: user.uid,
          email: user.email,
          profile: profileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      // Also update the user document with provider role if needed
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        role: "provider",
        displayName: profileData.displayName,
        profileComplete: true
      })

      setIsProfileComplete(true)
      
      // Show success dialog
      setShowSuccessDialog(true)
      
      toast({
        title: "Success",
        description: "Profile information saved successfully",
      })
      
      // Reload the page to reflect changes
      // router.refresh()
    } catch (error) {
      console.error("Error saving provider profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleProfilePictureUpload = (url: string) => {
    setProfileData(prev => ({
      ...prev,
      profilePicture: url
    }))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-muted-foreground">Loading profile information...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Profile Setup</h1>
          <p className="text-muted-foreground mt-2">
            Complete your profile to start offering services on Alima
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your public profile details seen by clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, displayName: e.target.value }))
                        }
                        placeholder="How you want to be known to clients"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="City, Province"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        value={profileData.contactNumber}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, contactNumber: e.target.value }))
                        }
                        placeholder="Your phone number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/3 space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex justify-center w-full">
                      <div className="max-w-[250px] w-full">
                        <ImageUpload
                          onUploadComplete={handleProfilePictureUpload}
                          defaultImage={profileData.profilePicture}
                          folder={`profile-pictures/${user?.uid || "unknown"}`}
                          hidePreview={true}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a professional profile picture to increase client trust
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell clients about yourself, your experience, and what you offer"
                    rows={5}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Information */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
              <CardDescription>Details about the services you provide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryCategory">Primary Service Category</Label>
                  <Select
                    value={profileData.primaryCategory}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({ ...prev, primaryCategory: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your main service category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="choose">Choose a category</SelectItem>
                      <SelectItem value="local-header" disabled className="font-semibold">
                        Local Services
                      </SelectItem>
                      {localCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="global-header" disabled className="font-semibold">
                        Global Services
                      </SelectItem>
                      {globalCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    value={profileData.yearsOfExperience}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, yearsOfExperience: e.target.value }))
                    }
                    placeholder="How many years of experience do you have?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Input
                    id="priceRange"
                    value={profileData.priceRange}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, priceRange: e.target.value }))
                    }
                    placeholder="e.g. ₱500-2,000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Languages</Label>
                  <Input
                    id="languages"
                    value={profileData.languages}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, languages: e.target.value }))
                    }
                    placeholder="Languages you speak (e.g. English, Filipino)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web Presence */}
          <Card>
            <CardHeader>
              <CardTitle>Web Presence</CardTitle>
              <CardDescription>Your online portfolio and social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website or Portfolio</Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, website: e.target.value }))
                    }
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={profileData.socialLinks.facebook}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, facebook: e.target.value },
                        }))
                      }
                      placeholder="Facebook profile URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={profileData.socialLinks.instagram}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                        }))
                      }
                      placeholder="Instagram profile URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={profileData.socialLinks.twitter}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                        }))
                      }
                      placeholder="Twitter profile URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={profileData.socialLinks.linkedin}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
                        }))
                      }
                      placeholder="LinkedIn profile URL"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="min-w-[150px]" disabled={saving}>
              {saving ? "Saving..." : isProfileComplete ? "Update Profile" : "Complete Profile"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-500 h-5 w-5" />
              Profile {isProfileComplete ? "Updated" : "Completed"} Successfully
            </DialogTitle>
            <DialogDescription>
              Your provider profile has been {isProfileComplete ? "updated" : "completed"} successfully. Clients can now find you based on your profile information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                router.refresh();
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
