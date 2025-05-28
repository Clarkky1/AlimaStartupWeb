"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"

export default function ServiceApplicationPage() {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { db } = await initializeFirebase()
      if (!db) {
        throw new Error("Failed to initialize database")
      }

      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")

      const serviceData = {
        name,
        address,
        serviceName,
        description,
        price: parseFloat(price),
        providerId: user?.uid,
        createdAt: serverTimestamp(),
        status: "pending",
        isActive: true
      }

      await addDoc(collection(db, "services"), serviceData)

      toast({
        title: "Service application submitted",
        description: "Your service has been submitted for review.",
      })

      router.push("/dashboard")
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
    <div className="bg-gray-50 py-8 sm:py-12 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Apply for Service</CardTitle>
            <CardDescription className="text-base sm:text-lg">Fill out the form below to apply for a service</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Enter your address"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="serviceName" className="text-base">Service Name</Label>
                  <Input
                    id="serviceName"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    required
                    placeholder="Enter service name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-base">Price (₱)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="Enter service price"
                    min="0"
                    step="0.01"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe your service"
                  className="min-h-[120px] sm:min-h-[150px] resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 