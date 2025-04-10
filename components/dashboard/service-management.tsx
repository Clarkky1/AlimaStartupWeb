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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Image, ArrowUp, ArrowDown, MoreHorizontal, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { ImageUpload } from "@/components/ui/image-upload"
import { ResponsiveImage } from "@/components/ui/responsive-image"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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
  const [sortField, setSortField] = useState<string>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
  const formatPrice = (price: number | string) => {
    const numValue = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
    if (isNaN(numValue)) return '₱0';
    return `₱${numValue.toLocaleString('en-PH')}`;
  }

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedServices = [...services].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === "title") {
      comparison = a.title.localeCompare(b.title)
    } else if (sortField === "price") {
      comparison = a.price - b.price
    } else if (sortField === "category") {
      comparison = a.category.localeCompare(b.category)
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight">My Services</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage your service offerings</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-5 py-2 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Service</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-gray-200/50 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Loading services...</p>
          </div>
        </div>
      ) : loadingError ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/80 backdrop-blur-sm p-6">
          <p className="text-red-500">{loadingError}</p>
          <Button 
            variant="outline" 
            className="mt-4 rounded-full border-gray-300 hover:bg-gray-100/80 transition-colors"
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
        <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="text-center p-8">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
              <Image className="h-10 w-10 text-blue-500" />
            </div>
            <p className="text-xl font-medium text-gray-800">No services yet</p>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
              Start showcasing your skills by adding your first service to attract potential clients
            </p>
            <Button 
              className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-6 py-2 transition-all shadow-sm" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-md overflow-hidden shadow-sm">
          {/* Table header - Notion-style */}
          <div className="sticky top-0 z-10 backdrop-blur-md bg-white/90 border-b border-gray-200/70 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
              <div className="col-span-5 flex items-center gap-2 cursor-pointer" onClick={() => toggleSort("title")}>
                <span>Title</span>
                {sortField === "title" && (
                  sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
              <div className="col-span-3 flex items-center gap-2 cursor-pointer" onClick={() => toggleSort("category")}>
                <span>Category</span>
                {sortField === "category" && (
                  sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2 cursor-pointer" onClick={() => toggleSort("price")}>
                <span>Price</span>
                {sortField === "price" && (
                  sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>
          
          {/* Table body - Notion-style */}
          <div className="divide-y divide-gray-100">
            {sortedServices.map((service) => (
              <div 
                key={service.id} 
                className="group grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors relative"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    <ResponsiveImage
                      src={service.image}
                      alt={service.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-gray-900 truncate">{service.title}</span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full truncate max-w-[150px]">
                    {service.category}
                  </span>
                </div>
                <div className="col-span-2 flex items-center font-medium text-gray-900">
                  {formatPrice(service.price)}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(service)}
                    className="h-8 w-8 rounded-full hover:bg-gray-200/70"
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-gray-200/70"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-gray-200/70 bg-white/95 backdrop-blur-sm">
                      <DropdownMenuItem className="cursor-pointer focus:bg-gray-100/80" onClick={() => openEditDialog(service)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-500 focus:bg-red-50/80 focus:text-red-500" 
                        onClick={() => openDeleteDialog(service)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-md p-0 border-none shadow-xl">
          <div className="bg-gray-50/90 backdrop-blur-sm p-6 rounded-t-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-medium text-gray-900">Add New Service</DialogTitle>
              <DialogDescription className="text-gray-500 text-sm mt-1">
                Add a new service to showcase your skills and expertise.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-gray-900 font-medium">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter service title"
                className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-900 font-medium">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description"
                className="h-32 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-gray-900 font-medium">Price (₱)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter service price"
                className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-gray-900 font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200 shadow-md">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="focus:bg-gray-100">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-900 font-medium">Service Image</Label>
              <ImageUpload
                onUploadComplete={handleImageUpload}
                defaultImage={imageUrl}
                folder={`services/${user?.uid || "unknown"}`}
                className="w-full rounded-xl border-gray-200 border-dashed"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50/90 backdrop-blur-sm rounded-b-3xl">
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)} 
              className="rounded-full border-gray-300 hover:bg-gray-100/80 text-gray-900 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddService}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-5 transition-all"
            >
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-0 border-none shadow-xl">
          <div className="bg-gray-50 p-6 rounded-t-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-900">Edit Service</DialogTitle>
              <DialogDescription className="text-gray-500 text-sm mt-1">
                Update your service details to better attract potential clients.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="edit-title" className="text-gray-900 font-medium">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter service title"
                className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-gray-900 font-medium">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description"
                className="h-32 rounded-xl border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price" className="text-gray-900 font-medium">Price (₱)</Label>
              <Input
                id="edit-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter service price"
                className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category" className="text-gray-900 font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category" className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200 shadow-md">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="focus:bg-gray-100">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-900 font-medium">Service Image</Label>
              <ImageUpload
                onUploadComplete={handleImageUpload}
                defaultImage={imageUrl}
                folder={`services/${user?.uid || "unknown"}`}
                className="w-full rounded-xl border-gray-200 border-dashed"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50 rounded-b-3xl">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-900 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditService}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[95%] max-w-[400px] p-0 rounded-3xl bg-white border-none shadow-xl">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Delete Service</DialogTitle>
              <DialogDescription className="text-gray-500 text-sm mt-1">
                Are you sure you want to delete this service? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 p-6 bg-gray-50 rounded-b-3xl">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto rounded-full border-gray-300 hover:bg-gray-100 text-gray-900 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteService}
              className="w-full sm:w-auto rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
