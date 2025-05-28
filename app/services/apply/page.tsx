"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFirebaseStorage } from "@/app/lib/firebase"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SERVICE_CATEGORIES = [
  { value: "accounting", label: "Accounting & Bookkeeping Services" },
  { value: "academic", label: "Academic & Tutorial Services" },
  { value: "airconditioning", label: "Airconditioning Services" },
  { value: "automotive", label: "Automotive and Motorcycle Services" },
  { value: "beauty", label: "Beauty & Wellness Services" },
  { value: "car-rental", label: "Car Rental Services" },
  { value: "computer", label: "Computer & Cellphone Services" },
  { value: "construction", label: "Construction & Interior Design Services" },
  { value: "dental", label: "Dental Services" },
  { value: "digital-marketing", label: "Digital Marketing Services" },
  { value: "electronic", label: "Electronic & Electrical Services" },
  { value: "event", label: "Event Management Services" },
  { value: "food", label: "Food Supply Services" },
  { value: "insurance", label: "Insurance Services" },
  { value: "legal", label: "Legal Services" },
  { value: "mechanical", label: "Mechanical Services" },
  { value: "medical", label: "Medical Services" },
  { value: "music", label: "Music Services" },
  { value: "photography", label: "Photography & Videography Services" },
  { value: "property", label: "Property & Rental Services" },
  { value: "psychological", label: "Psychological Services" },
  { value: "sanitation", label: "Sanitation Services" },
  { value: "sounds", label: "Sounds & Lights Services" },
  { value: "sports", label: "Sport Services" },
  { value: "teambuilding", label: "Teambuilding Services" }
];

interface ApplicationData {
  userId: string;
  status: string;
  createdAt: any;
  updatedAt: any;
  category: string;
  serviceName: string;
  location: string;
  serviceDescription: string;
  serviceImage?: string;
}

export default function ServiceApplicationPage() {
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [location, setLocation] = useState("")
  const [serviceDescription, setServiceDescription] = useState("")
  const [serviceImage, setServiceImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to apply for services",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for your service",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { db } = await initializeFirebase()
      if (!db) throw new Error("Failed to initialize Firebase")

      // Create application
      const applicationData: ApplicationData = {
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        category: category,
        serviceName: serviceName,
        location: location,
        serviceDescription: serviceDescription,
      }

      // Handle image upload if an image is selected
      if (serviceImage) {
        try {
          const storage = getFirebaseStorage()
          const storageRef = ref(storage, `service_images/${user.uid}/${Date.now()}-${serviceImage.name}`)
          const snapshot = await uploadBytes(storageRef, serviceImage)
          const downloadURL = await getDownloadURL(snapshot.ref)
          applicationData.serviceImage = downloadURL
        } catch (uploadError: any) {
          console.error("Error uploading image:", uploadError)
          toast({
            title: "Image upload failed",
            description: uploadError.message,
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      const applicationRef = await addDoc(collection(db, "service_applications"), applicationData)

      // Notify platform
      const platformNotification = {
        userId: user.uid,
        type: 'service_application',
        message: `New service application from user ${user.uid}`,
        read: false,
        createdAt: new Date().toISOString(),
        applicationId: applicationRef.id
      }

      await addDoc(collection(db, "platform_notifications"), platformNotification)

      // Notify user
      const userNotification = {
        userId: user.uid,
        type: 'application_submitted',
        message: "Your service application has been submitted",
        read: false,
        createdAt: new Date().toISOString(),
        applicationId: applicationRef.id
      }

      await addDoc(collection(db, "notifications"), userNotification)

      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully",
      })

      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Left Column - Fixed Guide */}
      <div className="fixed top-0 bottom-0 md:top-16 md:bottom-8 left-0 md:left-auto md:right-auto md:w-[calc(33.33%-16px)] lg:w-[calc(25%-16px)] xl:w-[calc(20%-16px)] p-4 overflow-y-auto z-0 hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Application Guide</CardTitle>
            <CardDescription>Follow these steps to apply</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Process</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Provide service details</li>
                  <li>Submit your application</li>
                  <li>Wait for platform review</li>
                  <li>Receive notification of approval</li>
                  <li>Start providing services</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Valid government ID</li>
                  <li>Proof of address</li>
                  <li>Professional certifications (if applicable)</li>
                  <li>Service portfolio or experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Application Details Form and Requirements */}
      <div className="grid grid-cols-1 space-y-8 px-4 py-8 md:ml-[calc(33.33%-16px)] lg:ml-[calc(25%-16px)] xl:ml-[calc(20%-16px)] md:grid-cols-1 md:space-y-8">
        <div className="space-y-8 max-w-2xl mx-auto">
          {/* Service Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Enter the details for the service you want to provide.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      className="w-full z-[100]"
                      sideOffset={4}
                    >
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name</Label>
                  <Input 
                    id="serviceName" 
                    placeholder="e.g., Expert Plumbing Services" 
                    value={serviceName} 
                    onChange={(e) => setServiceName(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g., Metro Manila" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDescription">Service Description</Label>
                  <Textarea 
                    id="serviceDescription" 
                    placeholder="Describe the services you offer..." 
                    value={serviceDescription} 
                    onChange={(e) => setServiceDescription(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceImage">Service Image (Optional)</Label>
                  <Input 
                    id="serviceImage" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setServiceImage(e.target.files[0])
                        setImagePreviewUrl(URL.createObjectURL(e.target.files[0]))
                      } else {
                        setServiceImage(null)
                        setImagePreviewUrl(null)
                      }
                    }}
                  />
                  {imagePreviewUrl && (
                    <div className="mt-2">
                      <img src={imagePreviewUrl} alt="Image Preview" className="w-32 h-32 object-cover rounded-md" />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleApply} 
                  disabled={loading || !category}
                  className="w-full mt-4"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Section */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>Please ensure you have the following ready for verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valid-id">Upload Valid Government ID</Label>
                  <Input id="valid-id" type="file" accept="image/*,application/pdf" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof-address">Upload Proof of Address</Label>
                  <Input id="proof-address" type="file" accept="image/*,application/pdf" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Upload Professional Certifications (Optional)</Label>
                  <Input id="certifications" type="file" accept="image/*,application/pdf" multiple />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-info">Additional Information (Optional)</Label>
                  <Textarea id="additional-info" placeholder="Provide any additional information relevant to your application..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 