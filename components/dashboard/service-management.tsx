"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { ImageUpload } from "@/components/ui/image-upload"
import { ResponsiveImage } from "@/components/ui/responsive-image"

interface Service {
  id: string
  title: string
  description: string
  price: number
  category: string
  image: string
}

// Global categories
const globalCategories = [
  "development",
  "design",
  "marketing",
  "mobile-apps",
  "writing",
  "video",
  "photography",
  "music",
  "education",
  "translation",
]

// Local categories
const localCategories = [
  "academic-tutorial",
  "automotive-motorcycle",
  "digital-marketing",
  "beauty-&-business",
  "event-management",
  "pc-&-smartphone",
  "psychological",
  "property-&-rental",
  "electronics-&-electrical",
]

// All categories (used for select dropdown)
const categories = [
  ...globalCategories,
  ...localCategories,
]

// Mock data for initial render
const mockServices: Service[] = [
  {
    id: "1",
    title: "Web Development",
    description: "Custom website development with responsive design",
    price: 500,
    category: "development",
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: "2",
    title: "Logo Design",
    description: "Professional logo design with unlimited revisions",
    price: 200,
    category: "design",
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: "3",
    title: "SEO Optimization",
    description: "Improve your website's search engine ranking",
    price: 300,
    category: "marketing",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export function ServiceManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentService, setCurrentService] = useState<Service | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchServices() {
      if (!user) return

      try {
        setLoading(true)
        setLoadingError(null)
        
        const { db } = await initializeFirebase()
        if (!db) {
          setLoadingError("Failed to initialize Firebase. Please try again later.")
          return
        }

        const servicesQuery = query(
          collection(db, "services"),
          where("providerId", "==", user.uid)
        )

        const querySnapshot = await getDocs(servicesQuery)
        const servicesData: Service[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          servicesData.push({
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            price: data.price || 0,
            category: data.category || "",
            image: data.image || "/placeholder.svg?height=100&width=100",
          })
        })

        setServices(servicesData)
      } catch (error) {
        console.error("Error fetching services:", error)
        setLoadingError("Failed to load services. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to fetch services",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [user, toast])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPrice("")
    setCategory("")
    setImageUrl("")
  }

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
  }

  const handleAddService = async () => {
    if (!title || !description || !price || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!imageUrl) {
      toast({
        title: "Missing image",
        description: "Please upload an image for your service",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

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

      // Validate inputs
      if (!title.trim()) {
        toast({
          title: "Missing title",
          description: "Please enter a service title",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!description.trim()) {
        toast({
          title: "Missing description",
          description: "Please enter a service description",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price greater than 0",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!category) {
        toast({
          title: "Missing category",
          description: "Please select a category",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Determine if this is a global or local service based on category
      let isLocalService = false;
      let isGlobalService = false;
      
      // Check if the category belongs to global or local categories
      if (globalCategories.some(gc => gc.toLowerCase() === category.toLowerCase() 
          || gc.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase())) {
        isGlobalService = true;
      } else if (localCategories.some(lc => lc.toLowerCase() === category.toLowerCase() 
                 || lc.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase())) {
        isLocalService = true;
      } else {
        // Default to global if category doesn't match any known category
        isGlobalService = true;
      }
      
      // Add to Firestore
      const newService = {
        title,
        description,
        price: Number.parseFloat(price),
        category: category.toLowerCase().replace(/\s+/g, '-'),
        image: imageUrl,
        providerId: user?.uid,
        providerName: user?.displayName || user?.name,
        providerAvatar: user?.avatar || "/placeholder.svg?height=50&width=50",
        rating: 0,
        reviewCount: 0,
        active: true,
        createdAt: new Date().toISOString(),
        isGlobalService,
        isLocalService,
        totalContacts: 0,
        totalRevenue: 0,
      }
      const docRef = await addDoc(collection(db, "services"), newService)
      const serviceWithId = { ...newService, id: docRef.id }

      setServices([...services, serviceWithId])

      toast({
        title: "Service added",
        description: "Your service has been added successfully",
      })

      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding service:", error)
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditService = async () => {
    if (!currentService || !title || !description || !price || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      const updatedService = {
        ...currentService,
        title,
        description,
        price: Number.parseFloat(price),
        category,
        image: imageUrl || currentService.image,
        updatedAt: new Date().toISOString(),
      }

      // Update in Firestore
      await updateDoc(doc(db, "services", currentService.id), {
        title: updatedService.title,
        description: updatedService.description,
        price: updatedService.price,
        category: updatedService.category,
        image: updatedService.image,
        updatedAt: updatedService.updatedAt,
      })

      // Update local state
      setServices(services.map((service) => (service.id === currentService.id ? updatedService : service)))

      toast({
        title: "Service updated",
        description: "Your service has been updated successfully",
      })

      resetForm()
      setCurrentService(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async () => {
    if (!currentService) return

    try {
      setLoading(true)

      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      // Delete from Firestore
      await deleteDoc(doc(db, "services", currentService.id))

      // Update local state
      setServices(services.filter((service) => service.id !== currentService.id))

      toast({
        title: "Service deleted",
        description: "Your service has been deleted successfully",
      })

      setCurrentService(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (service: Service) => {
    setCurrentService(service)
    setTitle(service.title)
    setDescription(service.description)
    setPrice(service.price.toString())
    setCategory(service.category)
    setImageUrl(service.image)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (service: Service) => {
    setCurrentService(service)
    setIsDeleteDialogOpen(true)
  }

  // Format price with peso sign
  const formatPrice = (price: number | string): string => {
    return `₱${Number(price).toLocaleString('en-PH')}`
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your services and offerings</p>
        </div>
        <Button size="lg" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Add Service
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border">
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      ) : loadingError ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border bg-destructive/10 p-4">
          <p className="text-destructive">{loadingError}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setLoading(true);
              setLoadingError(null);
              window.location.reload();
            }}
          >
            Try Again
          </Button>
        </div>
      ) : services.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">No services yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first service
            </p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add Service
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="h-16 w-16 overflow-hidden rounded-lg">
                      <ResponsiveImage
                        src={service.image}
                        alt={service.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.title}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {service.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>{formatPrice(service.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentService(service)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentService(service)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Add a new service to showcase your skills and expertise.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter service title"
                className="h-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description"
                className="h-32"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (₱)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter service price"
                className="h-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-12">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Service Image</Label>
              <ImageUpload
                onUploadComplete={handleImageUpload}
                defaultImage={imageUrl}
                folder={`services/${user?.uid || "unknown"}`}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService}>Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update your service details to better attract potential clients.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter service title"
                className="h-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description"
                className="h-32"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price (₱)</Label>
              <Input
                id="edit-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter service price"
                className="h-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category" className="h-12">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Service Image</Label>
              <ImageUpload
                onUploadComplete={handleImageUpload}
                defaultImage={imageUrl}
                folder={`services/${user?.uid || "unknown"}`}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteService}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
