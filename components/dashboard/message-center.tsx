"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Image, DollarSign, X, Upload, ArrowLeft, Info, Phone, MapPin, ChevronLeft, Star, Mail, MessageSquare, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  updateDoc,
  getDocs,
  setDoc,
  increment,
  or
} from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createImageErrorHandler, getFallbackIllustration } from "@/app/lib/avatar-utils"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  unread: number
}

interface Message {
  id?: string
  text: string
  senderId: string
  receiverId: string
  timestamp: any
  read: boolean
  isPaymentInfo?: boolean
  paymentProof?: string
  paymentConfirmed?: boolean
  time?: string
  senderName?: string
  senderAvatar?: string
  conversationId?: string
}

// Add proper interfaces for conversations and related conversations
interface ConversationData {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  lastSenderId?: string;
  lastSenderName?: string;
  lastSenderAvatar?: string;
  serviceId?: string;
  serviceTitle?: string;
  servicePrice?: number;
  otherParticipantId?: string;
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
  relatedConversations?: RelatedConversation[];
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, string | null>;
}

interface RelatedConversation {
  id: string;
  serviceId?: string;
  serviceTitle?: string;
  lastMessageTime?: any;
  price?: number | string;
}

// Mock data for initial render
const mockUsers: User[] = [
  {
    id: "user1",
    name: "Kin Clark Perez",
    avatar: "/person-male-1.svg?height=50&width=50",
    lastMessage: "Hi, I'm interested in your web development service",
    lastMessageTime: "10:30 AM",
    unread: 2,
  },
  {
    id: "user2",
    name: "Lorenz Aguirre",
    avatar: "/person-male-1.svg?height=50&width=50",
    lastMessage: "Can you help me with my project?",
    lastMessageTime: "Yesterday",
    unread: 0,
  },
  {
    id: "user3",
    name: "Kyle Florendo",
    avatar: "/person-male-1.svg?height=50&width=50",
    lastMessage: "Thanks for your help!",
    lastMessageTime: "2 days ago",
    unread: 0,
  },
]

const mockMessages: Record<string, Message[]> = {
  user1: [
    {
      id: "msg1",
      text: "Hi, I'm interested in your web development service",
      senderId: "user1",
      receiverId: "provider1",
      timestamp: "2023-06-10T10:30:00Z",
      read: true,
    },
    {
      id: "msg2",
      text: "Hello! Thank you for your interest. What kind of website are you looking to build?",
      senderId: "provider1",
      receiverId: "user1",
      timestamp: "2023-06-10T10:35:00Z",
      read: true,
    },
    {
      id: "msg3",
      text: "I need an e-commerce website for my small business",
      senderId: "user1",
      receiverId: "provider1",
      timestamp: "2023-06-10T10:40:00Z",
      read: false,
    },
    {
      id: "msg4",
      text: "Do you have any examples of your previous work?",
      senderId: "user1",
      receiverId: "provider1",
      timestamp: "2023-06-10T10:42:00Z",
      read: false,
    },
  ],
  user2: [
    {
      id: "msg5",
      text: "Can you help me with my project?",
      senderId: "user2",
      receiverId: "provider1",
      timestamp: "2023-06-09T15:20:00Z",
      read: true,
    },
    {
      id: "msg6",
      text: "Of course! What kind of project are you working on?",
      senderId: "provider1",
      receiverId: "user2",
      timestamp: "2023-06-09T15:25:00Z",
      read: true,
    },
  ],
  user3: [
    {
      id: "msg7",
      text: "I need help with a logo design",
      senderId: "user3",
      receiverId: "provider1",
      timestamp: "2023-06-08T09:10:00Z",
      read: true,
    },
    {
      id: "msg8",
      text: "I'd be happy to help with your logo design. Do you have any specific ideas or requirements?",
      senderId: "provider1",
      receiverId: "user3",
      timestamp: "2023-06-08T09:15:00Z",
      read: true,
    },
    {
      id: "msg9",
      text: "Thanks for your help!",
      senderId: "user3",
      receiverId: "provider1",
      timestamp: "2023-06-08T09:20:00Z",
      read: true,
    },
  ],
}

const UploadPaymentProofDialog = ({ 
  onUpload, 
  providerId, 
  services = [] 
}: { 
  onUpload: (imageUrl: string, serviceId?: string, amount?: number) => void; 
  providerId?: string;
  services?: Array<{id: string, title: string, price?: number | string}>
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<{title: string, price?: number | string} | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()

  // Select first service by default if available
  useEffect(() => {
    if (services && services.length > 0 && !selectedService) {
      setSelectedService(services[0].id)
      setSelectedServiceDetails(services[0])
      
      // Set default price if available
      const defaultPrice = services[0].price
      if (defaultPrice) {
        setPaymentAmount(typeof defaultPrice === 'number' ? defaultPrice.toString() : defaultPrice)
      }
    }
  }, [services, selectedService])

  // Update selected service details when service changes
  const handleServiceChange = (value: string) => {
    setSelectedService(value)
    const service = services.find(s => s.id === value)
    if (service) {
      setSelectedServiceDetails(service)
      if (service.price) {
        setPaymentAmount(typeof service.price === 'number' ? service.price.toString() : service.price)
      }
    }
  }

  const handleUpload = async (file: File) => {
    // File validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, GIF or WebP)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'payment-proofs');
      
      // Add provider ID for consistent fallback avatars
      if (providerId) {
        formData.append('providerId', providerId);
      }

      // Use the API route for more consistent uploads
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const data = await response.json();
      
      // Call onUpload with service info and payment amount
      onUpload(
        data.secure_url, 
        selectedService || undefined, 
        paymentAmount ? parseFloat(paymentAmount) : undefined
      );
      
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      toast({
        title: "Error",
        description: "Failed to upload payment proof, using fallback image",
        variant: "destructive",
      });
      
      // Use peace hand image as fallback for payment proof
      onUpload(
        '/peace-hand.svg', 
        selectedService || undefined, 
        paymentAmount ? parseFloat(paymentAmount) : undefined
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Upload Payment Proof">
          <Upload className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95%] max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Upload Payment Proof</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Upload a screenshot of your payment receipt
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Service selection */}
          {services.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="service-select">Service</Label>
              <Select 
                value={selectedService || ""} 
                onValueChange={handleServiceChange}
              >
                <SelectTrigger id="service-select">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title} {service.price ? `- ₱${service.price}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Display selected service details */}
              {selectedServiceDetails && (
                <div className="mt-2 p-3 rounded-md border bg-muted/10">
                  <h4 className="text-sm font-medium mb-1">{selectedServiceDetails.title}</h4>
                  {selectedServiceDetails.price && (
                    <div className="text-sm font-semibold text-primary">
                      ₱{typeof selectedServiceDetails.price === 'number' 
                        ? selectedServiceDetails.price.toLocaleString() 
                        : selectedServiceDetails.price}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Payment amount input */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount (₱)</Label>
            <Input
              id="payment-amount"
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="Enter payment amount"
              min="0"
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">This amount will be visible in the payment confirmation</p>
          </div>
          
          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="payment-proof">Upload payment proof image</Label>
            <Input
              id="payment-proof"
              type="file"
              accept="image/*"
              className="w-full"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                }
              }}
              disabled={isUploading}
              required
            />
          </div>
          
          {/* Send button */}
          <div className="flex justify-end mt-4">
            <Button 
              type="button" 
              disabled={isUploading || !selectedFile}
              onClick={() => {
                if (selectedFile) {
                  handleUpload(selectedFile)
                }
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2">Uploading...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="h-4 w-4 mr-2" />
                  Send Payment Proof
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// User/Provider profile component with service details
const ConversationInfo = ({ userId, serviceId, isVisible, onClose }: { 
  userId: string; 
  serviceId?: string;
  isVisible: boolean;
  onClose: () => void;
}) => {
  const [user, setUser] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfileData() {
      if (!userId) return

      try {
        const { db } = await initializeFirebase()
        if (!db) return

        const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore")
        
        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Prioritize name, then displayName, then fallback to email
          const name = userData.name || userData.displayName || userData.email?.split('@')[0] || 'Unknown User'
          const avatar = userData.profilePicture || userData.avatar
          setUser({
            id: userDoc.id,
            name,
            avatar,
            ...userData
          })
        }
        
        // Fetch service if available
        if (serviceId) {
          const serviceDoc = await getDoc(doc(db, "services", serviceId))
          if (serviceDoc.exists()) {
            setService({
              id: serviceDoc.id,
              ...serviceDoc.data()
            })
          }
        } else if (userDoc.exists() && userDoc.data().role === 'provider') {
          // If no service ID but user is a provider, fetch their first service
          const servicesQuery = query(
            collection(db, "services"),
            where("providerId", "==", userId),
            where("active", "==", true)
          )
          
          const servicesSnapshot = await getDocs(servicesQuery)
          if (!servicesSnapshot.empty) {
            const firstService = servicesSnapshot.docs[0]
            setService({
              id: firstService.id,
              ...firstService.data()
            })
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (isVisible) {
      fetchProfileData()
    }
  }, [userId, serviceId, isVisible])

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return ""
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (!isVisible) return null
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">
          {user?.role === 'provider' ? 'About Provider' : 'About Client'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
          Back to Chat
        </Button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="h-full overflow-auto">
          {user && (
            <>
              {user.bio && (
                <div className="pt-3">
                  <h4 className="text-sm font-semibold mb-1">Bio</h4>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              )}

              <div className="pt-3">
                <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                <div className="space-y-2">
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {user.specialties && (
                <div className="pt-3">
                  <h4 className="text-sm font-semibold mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.specialties.map((specialty: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {service && (
            <div className="pt-3">
              <h4 className="text-sm font-semibold mb-2">Service Information</h4>
              <div className="rounded-md overflow-hidden bg-muted/10">
                <div className="p-3 flex flex-col gap-3">
                  {service.image && (
                    <div>
                      <img 
                        src={service.image} 
                        alt={service.title} 
                        className="w-full h-40 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg"
                          e.currentTarget.onerror = null
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{service.title}</h3>
                    <p className="text-sm text-muted-foreground my-2">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">₱{service.price?.toLocaleString() || "N/A"}</span>
                      {service.category && (
                        <Badge variant="outline">
                          {formatCategoryName(service.category)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Create a ConversationItem component to handle the useEffect
const ConversationItem = ({ 
  conversation, 
  isSelected, 
  onSelect, 
  user,
  getOtherParticipantId,
  getConversationDisplayInfo,
  updateConversationInfo
}: { 
  conversation: ConversationData; 
  isSelected: boolean; 
  onSelect: (conversation: ConversationData) => void;
  user: any;
  getOtherParticipantId: (conversation: ConversationData) => string | null | undefined;
  getConversationDisplayInfo: (conversation: ConversationData) => Promise<{ name: string; avatar: string | null | undefined }>;
  updateConversationInfo: (id: string, name: string, avatar?: string) => void;
}) => {
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // If today, show time
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If yesterday, show "Yesterday"
    if (days === 1) {
      return 'Yesterday';
    }
    // If within 7 days, show day name
    if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const otherParticipantId = getOtherParticipantId(conversation);
  
  // Get the display name and avatar for the other participant
  const displayName = otherParticipantId && conversation.participantNames?.[otherParticipantId] 
    ? conversation.participantNames[otherParticipantId]
    : conversation.otherParticipantName || 'Loading...';
    
  const displayAvatar = otherParticipantId && conversation.participantAvatars?.[otherParticipantId]
    ? conversation.participantAvatars[otherParticipantId]
    : conversation.otherParticipantAvatar || "/person-male-1.svg?height=40&width=40";
  
  // Move the useEffect into this component
  useEffect(() => {
    // Only fetch if we don't have participant info in either format
    const needsUserInfo = otherParticipantId && 
      !conversation.otherParticipantName && 
      !conversation.participantNames?.[otherParticipantId];
      
    if (needsUserInfo) {
      getConversationDisplayInfo(conversation).then(({ name, avatar }) => {
        // Update the conversation with the user's name and avatar
        updateConversationInfo(conversation.id, name, avatar || undefined);
      });
    }
  }, [conversation, otherParticipantId, getConversationDisplayInfo, updateConversationInfo]);
  
  return (
    <div
      onClick={() => onSelect(conversation)}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-md cursor-pointer hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={displayAvatar} />
        <AvatarFallback>{displayName?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <div className="space-y-1 flex-1 overflow-hidden">
        <div className="flex justify-between">
          <p className="font-medium text-sm">
            {displayName}
          </p>
          {conversation.lastMessageTime && (
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(conversation.lastMessageTime)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {conversation.lastSenderId === user.uid && "You: "}
          {conversation.lastMessage}
        </p>
      </div>
    </div>
  );
};

const ImagePreviewDialog = ({ src, isOpen, onClose }: { src: string, isOpen: boolean, onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-3xl md:max-w-4xl p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Image Preview</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">View the full size image</DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-full max-h-[60vh] sm:max-h-[80vh] overflow-auto">
          <img
            src={src}
            alt="Full size preview"
            className="w-full h-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.jpg"
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add this component for rating services after payment confirmation
const RatingDialog = ({ 
  isOpen, 
  onClose, 
  serviceId, 
  serviceTitle, 
  providerId,
  providerName,
  transactionId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  serviceId: string; 
  serviceTitle: string; 
  providerId: string;
  providerName: string;
  transactionId: string;
}) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !serviceId || !providerId) return;
    
    try {
      setIsSubmitting(true);
      const { db } = await initializeFirebase();
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        });
        return;
      }
      
      // Add the review
      const { addDoc, collection, serverTimestamp, updateDoc, doc } = await import("firebase/firestore");
      
      const reviewData = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userAvatar: user.photoURL || null,
        providerId,
        providerName,
        serviceId,
        serviceTitle,
        rating,
        feedback,
        transactionId,
        createdAt: serverTimestamp()
      };
      
      // Add the review
      await addDoc(collection(db, "reviews"), reviewData);
      
      // Update the transaction to mark it as rated
      if (transactionId) {
        await updateDoc(doc(db, "transactions", transactionId), {
          rated: true,
          rating,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update provider's average rating
      const providerDoc = doc(db, "users", providerId);
      const { getDoc, increment } = await import("firebase/firestore");
      const providerSnapshot = await getDoc(providerDoc);
      
      if (providerSnapshot.exists()) {
        const providerData = providerSnapshot.data();
        const currentRating = providerData.rating || 0;
        const totalRatings = providerData.totalRatings || 0;
        
        // Calculate new average rating
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;
        
        await updateDoc(providerDoc, {
          rating: newRating,
          totalRatings: increment(1)
        });
      }
      
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate this service</DialogTitle>
          <DialogDescription>
            How was your experience with {serviceTitle}?
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer ${
                    star <= rating 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback">Your feedback (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with this service..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="animate-spin mr-2">⟳</span> Submitting...</>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export function MessageCenter() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [activeService, setActiveService] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [unsubscribeMessages, setUnsubscribeMessages] = useState<any>(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isProvider, setIsProvider] = useState(false)
  const [showConversationList, setShowConversationList] = useState(true)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0)
  // Add state for mobile tab navigation
  const [activeMobileTab, setActiveMobileTab] = useState<'conversations' | 'chat' | 'info'>('chat')
  // Add state for the rating dialog
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingService, setRatingService] = useState<{
    serviceId: string;
    serviceTitle: string;
    providerId: string;
    providerName: string;
    transactionId: string;
  } | null>(null);
  // Add a new hook for checking participants' roles after the existing hooks
  const [otherParticipantRole, setOtherParticipantRole] = useState<string | null>(null);

  // Define getOtherParticipantId function before it's used in useEffect
  const getOtherParticipantId = (conversation: ConversationData) => {
    if (!conversation || !conversation.participants || !user) return null;
    return conversation.participants.find(id => id !== user.uid) || null;
  };

  // Add a function to check the other participant's role
  const checkOtherParticipantRole = useCallback(async (participantId: string | null | undefined) => {
    if (!participantId) return null;
    
    try {
      const { db } = await initializeFirebase();
      if (!db) return null;
      
      const { doc, getDoc } = await import("firebase/firestore");
      const userDoc = await getDoc(doc(db, "users", participantId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setOtherParticipantRole(userData.role || null);
        return userData.role || null;
      }
      
      return null;
    } catch (error) {
      console.error("Error checking participant role:", error);
      return null;
    }
  }, []);

  // Add an effect to check the other participant's role when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const otherParticipantId = getOtherParticipantId(selectedConversation);
      checkOtherParticipantRole(otherParticipantId);
    }
  }, [selectedConversation, checkOtherParticipantRole, getOtherParticipantId]);

  // Check if user is a provider
  useEffect(() => {
    if (!user) return;
    setIsProvider(user.role === 'provider');
  }, [user]);

  // Monitor window width for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial window width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mobile navigation based on window width
  useEffect(() => {
    if (windowWidth < 768) {
      // On mobile, set the appropriate tab when conversation is selected
      if (selectedConversation) {
        setActiveMobileTab('chat');
        setShowConversationList(false);
      } else {
        setActiveMobileTab('conversations');
      }
    } else {
      // On desktop, always show conversation list
      setShowConversationList(true);
    }
  }, [selectedConversation, windowWidth]);

  // Function to determine role-based text for displaying user info
  const getRoleBasedText = (otherUserIsProvider: boolean | undefined) => {
    return {
      title: otherUserIsProvider ? "About Provider" : "About Client",
      roleLabel: otherUserIsProvider ? "Service Provider" : "Client"
    };
  };

  // Get role info for the current conversation partner
  const getOtherUserRoleInfo = () => {
    if (!selectedConversation || !selectedConversation.otherParticipantId) {
      return getRoleBasedText(false);
    }
    
    // Since we don't have role info directly in the conversation data,
    // assume the other user is a client if current user is a provider, and vice versa
    return getRoleBasedText(!isProvider);
  };

  const roleText = getOtherUserRoleInfo();

  // Handle payment confirmation
  const handleConfirmPayment = async (message: any) => {
    if (!user || !isProvider || !message || !message.id) return;
    
    try {
      const { db } = await initializeFirebase();
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        });
        return;
      }
      
      // First update the message to mark payment as confirmed
      const messageRef = doc(db, "messages", message.id);
      await updateDoc(messageRef, {
        paymentConfirmed: true
      });
      
      // Find the transaction related to this payment proof
      // Search by paymentProofUrl, serviceId, and the involved users
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("paymentProofUrl", "==", message.paymentProof),
        where("status", "==", "pending")
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      let transactionId = "";
      const paymentAmount = message.paymentAmount || 0;
      const serviceTitle = message.serviceTitle || "Service";
      const serviceId = message.serviceId || "";
      
      // If no transaction found, create one
      if (transactionsSnapshot.empty) {
        // If no transaction exists, we create one
        const transactionData = {
          userId: message.senderId,
          providerId: user.uid,
          serviceId: serviceId,
          serviceTitle: serviceTitle,
          amount: paymentAmount,
          status: "confirmed",
          paymentProofUrl: message.paymentProof,
          paymentMethod: "gcash", // Default to gcash if not specified
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          conversationId: message.conversationId,
          cloudinaryId: message.cloudinaryId || "", // May be empty
          rated: false
        };
        
        // Add the new transaction using the already imported addDoc
        const transactionRef = await addDoc(collection(db, "transactions"), transactionData);
        transactionId = transactionRef.id;
        
        // Update provider's revenue records in both revenue collection and users collection
        const revenueRef = doc(db, "revenue", user.uid);
        const revenueDoc = await getDoc(revenueRef);
        
        // For numeric safety, ensure payment amount is a number
        const numericAmount = Number(paymentAmount) || 0;
        
        if (revenueDoc.exists()) {
          await updateDoc(revenueRef, {
            totalRevenue: increment(numericAmount),
            transactionCount: increment(1),
            updatedAt: new Date().toISOString()
          });
        } else {
          // Create new revenue record if none exists
          await setDoc(revenueRef, {
            providerId: user.uid,
            totalRevenue: numericAmount,
            transactionCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        // Also update the revenue data in the user document for dashboard stats
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentRevenue = userData.totalRevenue || 0;
          const currentTransactions = userData.totalTransactions || 0;
          
          await updateDoc(userRef, {
            totalRevenue: currentRevenue + numericAmount,
            totalTransactions: currentTransactions + 1,
            lastTransactionDate: new Date().toISOString()
          });
        }
      } else {
        // Update existing transaction to confirmed
        const transaction = transactionsSnapshot.docs[0];
        transactionId = transaction.id;
        const transactionData = transaction.data();
        
        await updateDoc(doc(db, "transactions", transaction.id), {
          status: "confirmed",
          updatedAt: new Date().toISOString(),
          rated: false,
          serviceTitle: serviceTitle, // Ensure service title is updated
          amount: paymentAmount // Ensure amount is updated
        });
        
        // Update provider's revenue
        const revenueRef = doc(db, "revenue", user.uid);
        const numericAmount = Number(transactionData.amount) || 0;
        
        await updateDoc(revenueRef, {
          totalRevenue: increment(numericAmount),
          transactionCount: increment(1),
          updatedAt: new Date().toISOString()
        });
        
        // Also update user document revenue stats
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentRevenue = userData.totalRevenue || 0;
          const currentTransactions = userData.totalTransactions || 0;
          
          await updateDoc(userRef, {
            totalRevenue: currentRevenue + numericAmount,
            totalTransactions: currentTransactions + 1,
            lastTransactionDate: new Date().toISOString()
          });
        }
      }
      
      // Get provider name for the notification
      const providerDoc = await getDoc(doc(db, "users", user.uid));
      const providerData = providerDoc.data() || {};
      const providerName = providerData.displayName || providerData.name || user.displayName || "Service Provider";
      
      // Create notification for the user to rate the service
      const notificationData = {
        userId: message.senderId,
        type: "payment_confirmed_rating", // Special type to trigger rating dialog
        title: `Payment Confirmed: ${serviceTitle} - ₱${typeof paymentAmount === 'number' ? paymentAmount.toLocaleString() : paymentAmount}`,
        description: `Your payment of ₱${typeof paymentAmount === 'number' ? paymentAmount.toLocaleString() : paymentAmount} for ${serviceTitle} has been confirmed. Please rate your experience.`,
        timestamp: serverTimestamp(),
        read: false,
        data: {
          conversationId: message.conversationId,
          messageId: message.id,
          serviceId: serviceId,
          serviceTitle: serviceTitle,
          providerId: user.uid,
          providerName: providerName,
          transactionId: transactionId,
          requiresRating: true,
          amount: paymentAmount
        }
      };
      
      await addDoc(collection(db, "notifications"), notificationData);
      
      toast({
        title: "Success",
        description: `Payment of ₱${paymentAmount} has been confirmed successfully`,
      });
      
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    }
  };
  
  // Check for payment confirmation notifications that need rating
  useEffect(() => {
    if (!user) return;
    
    async function checkForRatingNotifications() {
      if (!user) return;
      try {
        const { db } = await initializeFirebase();
        if (!db) return;
        
        const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
        
        // Find recent unread payment confirmation notifications
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user?.uid),
          where("type", "==", "payment_confirmed_rating"),
          where("read", "==", false),
          limit(1)
        );
        
        const snapshot = await getDocs(notificationsQuery);
        
        if (!snapshot.empty) {
          const notification = snapshot.docs[0];
          const data = notification.data();
          
          // Show rating dialog
          if (data.data && data.data.requiresRating) {
            setRatingService({
              serviceId: data.data.serviceId || "",
              serviceTitle: data.data.serviceTitle || "Service",
              providerId: data.data.providerId || "",
              providerName: data.data.providerName || "Provider",
              transactionId: data.data.transactionId || ""
            });
            setRatingDialogOpen(true);
            
            // Mark the notification as read
            const { updateDoc, doc } = await import("firebase/firestore");
            await updateDoc(doc(db, "notifications", notification.id), {
              read: true
            });
          }
        }
      } catch (error) {
        console.error("Error checking for rating notifications:", error);
      }
    }
    
    checkForRatingNotifications();
  }, [user, messages]); // Check when messages update too, as this might indicate a new notification

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load conversations - Now with grouping
  useEffect(() => {
    async function fetchConversations() {
      if (authLoading || !user) return

      try {
        const { db } = await initializeFirebase()
        if (!db) return

        const { collection, query, where, onSnapshot, orderBy } = await import("firebase/firestore")
        
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTime", "desc")
        )

        return onSnapshot(q, (snapshot) => {
          const conversationsData: ConversationData[] = []
          const userConversationsMap = new Map<string, ConversationData>()
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const conversationData: ConversationData = {
              id: doc.id,
              participants: Array.isArray(data.participants) ? data.participants : [],
              lastMessage: data.lastMessage,
              lastMessageTime: data.lastMessageTime,
              lastSenderId: data.lastSenderId,
              lastSenderName: data.lastSenderName,
              lastSenderAvatar: data.lastSenderAvatar,
              serviceId: data.serviceId,
              serviceTitle: data.serviceTitle,
              servicePrice: data.servicePrice
            }
            
            // Get the other participant's ID
            const otherParticipantId = conversationData.participants.find((id: string) => id !== user.uid)
            
            if (!otherParticipantId) return
            
            // Check if we already have a conversation with this user
            if (userConversationsMap.has(otherParticipantId)) {
              const existingConversation = userConversationsMap.get(otherParticipantId)
              
              if (!existingConversation) {
                userConversationsMap.set(otherParticipantId, conversationData)
                return
              }
              
              // Keep the most recent conversation as the main one
              if (
                conversationData.lastMessageTime && 
                existingConversation.lastMessageTime && 
                conversationData.lastMessageTime.toDate() > existingConversation.lastMessageTime.toDate()
              ) {
                // Store the old conversation ID and service info for reference
                if (!existingConversation.relatedConversations) {
                  existingConversation.relatedConversations = []
                }
                
                existingConversation.relatedConversations.push({
                  id: existingConversation.id,
                  serviceId: existingConversation.serviceId,
                  serviceTitle: existingConversation.serviceTitle,
                  lastMessageTime: existingConversation.lastMessageTime
                })
                
                // Update with the newer conversation
                userConversationsMap.set(otherParticipantId, conversationData)
              } else {
                // Add this conversation as a related one to the main conversation
                if (!existingConversation.relatedConversations) {
                  existingConversation.relatedConversations = []
                }
                
                existingConversation.relatedConversations.push({
                  id: conversationData.id,
                  serviceId: conversationData.serviceId,
                  serviceTitle: conversationData.serviceTitle,
                  lastMessageTime: conversationData.lastMessageTime
                })
              }
            } else {
              // First conversation with this user
              conversationData.otherParticipantId = otherParticipantId
              userConversationsMap.set(otherParticipantId, conversationData)
            }
          })
          
          // Convert the map to an array and sort by last message time
          const groupedConversations = Array.from(userConversationsMap.values())
          groupedConversations.sort((a, b) => {
            if (!a.lastMessageTime || !b.lastMessageTime) return 0
            return b.lastMessageTime.toDate().getTime() - a.lastMessageTime.toDate().getTime()
          })
          
          setConversations(groupedConversations)
          setLoading(false)
          
          // Check if there's a conversation ID in sessionStorage from a notification
          const preselectedConversationId = sessionStorage.getItem('selectedConversationId')
          const preselectedServiceId = sessionStorage.getItem('selectedServiceId')
          const fromNotification = sessionStorage.getItem('fromNotification')
          
          if (preselectedConversationId) {
            // Find by direct ID or within related conversations
            let targetConversation = groupedConversations.find(c => c.id === preselectedConversationId)
            
            // If not found directly, look for it in related conversations
            if (!targetConversation) {
              for (const conversation of groupedConversations) {
                if (conversation.relatedConversations) {
                  const relatedConv = conversation.relatedConversations.find(
                    (rc: any) => rc.id === preselectedConversationId
                  )
                  
                  if (relatedConv) {
                    targetConversation = conversation
                    
                    // Set the active service for this conversation
                    if (preselectedServiceId) {
                      setActiveService(preselectedServiceId)
                    } else if (relatedConv.serviceId) {
                      setActiveService(relatedConv.serviceId)
                    }
                    
                    break
                  }
                }
              }
            }
            
            if (targetConversation) {
              setSelectedConversation(targetConversation);
              setShowUserInfo(true);
              
              // Add this to indicate we came from a notification
              sessionStorage.setItem('fromNotification', 'true');
              
              // If we have additional sender information, update the conversation
              const senderName = sessionStorage.getItem('senderName');
              const senderAvatar = sessionStorage.getItem('senderAvatar');
              
              if (senderName && targetConversation.otherParticipantId) {
                // Use this to fix the "Unknown User" issue for the selected conversation
                if (!targetConversation.participantNames) {
                  targetConversation.participantNames = {};
                }
                targetConversation.participantNames[targetConversation.otherParticipantId] = senderName;
                
                if (senderAvatar) {
                  if (!targetConversation.participantAvatars) {
                    targetConversation.participantAvatars = {};
                  }
                  targetConversation.participantAvatars[targetConversation.otherParticipantId] = senderAvatar;
                }
                
                // Update the state with the enhanced conversation data
                setSelectedConversation({...targetConversation});
              }
            }
            
            // Clear the sessionStorage
            sessionStorage.removeItem('selectedConversationId');
            sessionStorage.removeItem('selectedServiceId');
            sessionStorage.removeItem('senderName');
            sessionStorage.removeItem('senderAvatar');
          }
        })
      } catch (error) {
        console.error("Error fetching conversations:", error)
        setLoading(false)
      }
    }

    const unsubscribe = fetchConversations()
    return () => {
      unsubscribe?.then(unsub => unsub && unsub())
    }
  }, [user, authLoading])

  
  
  // Load messages for selected conversation - Now with full message history across services
  useEffect(() => {
    if (!selectedConversation || !user) return;

    async function fetchMessages() {
      try {
        const { db } = await initializeFirebase();
        if (!db) return;

        const { collection, query, where, orderBy, onSnapshot, limit, or, and } = await import("firebase/firestore");

        // Find the correct conversation ID and service ID based on active service
        let targetConversationId = selectedConversation!.id;
        
        if (activeService && activeService !== selectedConversation!.serviceId) {
          const relatedConv = selectedConversation!.relatedConversations?.find(
            (conv) => conv.serviceId === activeService
          );
          if (relatedConv) {
            targetConversationId = relatedConv.id;
          }
        }

        const q = query(
          collection(db, "messages"),
          and(
            where("conversationId", "==", targetConversationId),
            or(
              where("senderId", "==", user!.uid),
              where("receiverId", "==", user!.uid)
            )
          ),
          orderBy("timestamp", "asc"),
          limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messagesData: Message[] = [];
          snapshot.forEach((doc) => {
            messagesData.push({
              id: doc.id,
              ...doc.data(),
            } as Message);
          });
          setMessages(messagesData);
          setTimeout(() => scrollToBottom(), 100);
        });

        setUnsubscribeMessages(() => unsubscribe);

        // Set initial active service if none is selected
        if (activeService === null && selectedConversation?.serviceId) {
          setActiveService(selectedConversation.serviceId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      }
    }

    fetchMessages();
    setTimeout(() => scrollToBottom(), 100);

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [selectedConversation, user, activeService]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mark messages as read
  useEffect(() => {
    async function markMessagesAsRead() {
      if (!selectedConversation || !user) return

      try {
        const { db } = await initializeFirebase()
        if (!db) return

        const { collection, query, where, getDocs, doc, updateDoc, writeBatch } = await import("firebase/firestore")
        
        const q = query(
          collection(db, "messages"),
          where("conversationId", "==", selectedConversation.id),
          where("receiverId", "==", user.uid),
          where("read", "==", false)
        )

        const snapshot = await getDocs(q)
        if (snapshot.empty) return

        const batch = writeBatch(db)
        
        snapshot.forEach((doc) => {
          batch.update(doc.ref, { read: true })
        })
        
        await batch.commit()
      } catch (error) {
        console.error("Error marking messages as read:", error)
      }
    }

    markMessagesAsRead()
  }, [selectedConversation, user, messages])

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user) return

    // Scroll immediately when sending
    scrollToBottom()
    
    const otherParticipantId = getOtherParticipantId(selectedConversation)
    if (!otherParticipantId) return

    try {
      const { db } = await initializeFirebase()
      if (!db) return

      const { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } = await import("firebase/firestore")
      
      // Get current user's profile
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data() || {}
      const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous"
      const userAvatar = userData?.profilePicture || userData?.avatar || user.photoURL || null
      
      // Update the conversation's participant info to ensure proper display
      if (selectedConversation && selectedConversation.id) {
        // Get the other participant's info to ensure it's properly set
        const otherUserDoc = await getDoc(doc(db, "users", otherParticipantId))
        const otherUserData = otherUserDoc.data() || {}
        const otherUserName = otherUserData?.displayName || otherUserData?.name || "User"
        const otherUserAvatar = otherUserData?.profilePicture || otherUserData?.avatar || null
        
        // Update the conversation with both participants' display info
        await updateDoc(doc(db, "conversations", selectedConversation.id), {
          [`participantNames.${user.uid}`]: userName,
          [`participantAvatars.${user.uid}`]: userAvatar,
          [`participantNames.${otherParticipantId}`]: otherUserName,
          [`participantAvatars.${otherParticipantId}`]: otherUserAvatar,
        });
      }
      
      // Determine which conversation to use
      let targetConversationId = selectedConversation.id
      let serviceId = selectedConversation.serviceId
      let serviceTitle = selectedConversation.serviceTitle
      
      // If user has selected a different service, use that conversation instead
      if (activeService && activeService !== selectedConversation.serviceId) {
        // Find the related conversation with this service
        const relatedConversation = selectedConversation.relatedConversations?.find(
          (conv: any) => conv.serviceId === activeService
        )
        
        if (relatedConversation) {
          targetConversationId = relatedConversation.id
          serviceId = relatedConversation.serviceId
          serviceTitle = relatedConversation.serviceTitle
        }
      }
      
      // Prepare message data
      const messageData: any = {
        conversationId: targetConversationId,
        senderId: user.uid,
        senderName: userName,
        senderAvatar: userAvatar,
        receiverId: otherParticipantId,
        text: newMessage,
        timestamp: serverTimestamp(),
        read: false,
      }
      
      // Include service info if available
      if (serviceId) {
        messageData.serviceId = serviceId
        messageData.serviceTitle = serviceTitle
      }
      
      // Add message
      await addDoc(collection(db, "messages"), messageData)
      
      // Update conversation
      await updateDoc(doc(db, "conversations", targetConversationId), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid,
        lastSenderName: userName,
        lastSenderAvatar: userAvatar,
      })
      
      // Create notification for recipient
      const notificationData: any = {
        userId: otherParticipantId,
        type: "message",
        title: "New Message",
        description: `${userName}: ${newMessage.length > 50 ? newMessage.substring(0, 50) + '...' : newMessage}`,
        timestamp: serverTimestamp(),
        read: false,
        data: {
          conversationId: targetConversationId,
          senderId: user.uid,
          senderName: userName,
          messageText: newMessage,
        }
      }
      
      // Include service info in notification if available
      if (serviceId) {
        notificationData.data.serviceId = serviceId
        notificationData.data.serviceTitle = serviceTitle
      }
      
      await addDoc(collection(db, "notifications"), notificationData)
      
      // Clear input
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  // Add updateConversationInfo function
  const updateConversationInfo = useCallback((id: string, name: string, avatar?: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          otherParticipantName: name,
          otherParticipantAvatar: avatar
        };
      }
      return c;
    }));
  }, []);

  // Add function to go back to conversation list on mobile
  const showConversationsList = () => {
    if (windowWidth < 768) {
      setActiveMobileTab('conversations');
    }
    setSelectedConversation(null);
    setShowConversationList(true);
  }
  
  // Modify setSelectedConversation calls to also handle mobile view
  const selectConversation = (conversation: ConversationData) => {
    setSelectedConversation(conversation);
    
    // On mobile, update the tab and hide the conversation list
    if (windowWidth < 768) {
      setActiveMobileTab('chat');
      setShowConversationList(false);
    }
  };

  // Handle sending a payment proof
  const handleSendPaymentProof = async (paymentInfo: {
    text: string;
    paymentProof: string;
    serviceId?: string;
    serviceTitle?: string;
    paymentAmount?: number;
  }) => {
    if (!selectedConversation || !user) return;
    
    const otherParticipantId = getOtherParticipantId(selectedConversation);
    if (!otherParticipantId) return;

    try {
      const { db } = await initializeFirebase();
      if (!db) return;

      const { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } = await import("firebase/firestore");
      
      // Get current user's profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() || {};
      const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous";
      const userAvatar = userData?.profilePicture || userData?.avatar || user.photoURL || null;
      
      // Determine which conversation to use
      let targetConversationId = selectedConversation.id;
      let serviceId = paymentInfo.serviceId || selectedConversation.serviceId;
      let serviceTitle = paymentInfo.serviceTitle || selectedConversation.serviceTitle;
      
      // If user has selected a different service, use that conversation instead
      if (activeService && activeService !== selectedConversation.serviceId) {
        // Find the related conversation with this service
        const relatedConversation = selectedConversation.relatedConversations?.find(
          (conv: any) => conv.serviceId === activeService
        );
        
        if (relatedConversation) {
          targetConversationId = relatedConversation.id;
          serviceId = relatedConversation.serviceId;
          serviceTitle = relatedConversation.serviceTitle;
        }
      }
      
      // Prepare message data with payment proof
      const messageData: any = {
        conversationId: targetConversationId,
        senderId: user.uid,
        senderName: userName,
        senderAvatar: userAvatar,
        receiverId: otherParticipantId,
        text: paymentInfo.text,
        timestamp: serverTimestamp(),
        read: false,
        paymentProof: paymentInfo.paymentProof,
        paymentAmount: paymentInfo.paymentAmount || 0
      };
      
      // Include service info if available
      if (serviceId) {
        messageData.serviceId = serviceId;
        messageData.serviceTitle = serviceTitle;
      }
      
      // Add message
      await addDoc(collection(db, "messages"), messageData);
      
      // Update conversation
      await updateDoc(doc(db, "conversations", targetConversationId), {
        lastMessage: "Payment proof sent",
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid,
        lastSenderName: userName,
        lastSenderAvatar: userAvatar
      });
      
      // Create notification for recipient about payment proof
      const paymentAmount = paymentInfo.paymentAmount 
        ? (typeof paymentInfo.paymentAmount === 'number' 
          ? paymentInfo.paymentAmount.toLocaleString() 
          : paymentInfo.paymentAmount) 
        : "0";
        
      const notificationData: any = {
        userId: otherParticipantId,
        type: "payment_proof",
        title: `Payment Proof: ${serviceTitle || "Service"} - ₱${paymentAmount}`,
        description: `${userName} has sent a payment proof of ₱${paymentAmount} for ${serviceTitle || "your service"}`,
        timestamp: serverTimestamp(),
        read: false,
        data: {
          conversationId: targetConversationId,
          senderId: user.uid,
          senderName: userName,
          messageText: paymentInfo.text,
          paymentProof: true,
          paymentAmount: paymentInfo.paymentAmount,
          serviceTitle: serviceTitle,
          serviceId: serviceId
        }
      };
      
      // Include service info in notification if available
      if (serviceId) {
        notificationData.data.serviceId = serviceId;
        notificationData.data.serviceTitle = serviceTitle;
      }
      
      await addDoc(collection(db, "notifications"), notificationData);
      
      // Scroll to bottom to show new message
      setTimeout(() => scrollToBottom(), 100);
      
      toast({
        title: "Success",
        description: "Payment proof sent successfully",
      });
    } catch (error) {
      console.error("Error sending payment proof:", error);
      toast({
        title: "Error",
        description: "Failed to send payment proof",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="mb-4 text-center">
            <p>Please login to view your messages</p>
          </div>
          <Button onClick={() => router.push("/login")}>Login</Button>
        </CardContent>
      </Card>
    )
  }

  // Get user display info for conversation list
  const getConversationDisplayInfo = async (conversation: ConversationData) => {
    if (!user) return { name: 'Unknown', avatar: null }
    
    const otherParticipantId = getOtherParticipantId(conversation)
    if (!otherParticipantId) return { name: 'Unknown', avatar: null }
    
    // Check if we have participant info in the conversation
    if (conversation.participantNames && conversation.participantNames[otherParticipantId]) {
      return {
        name: conversation.participantNames[otherParticipantId],
        avatar: conversation.participantAvatars?.[otherParticipantId] || null
      }
    }
    
    // Fallback to other fields
    let name = conversation.otherParticipantName || 'Unknown User'
    let avatar = conversation.otherParticipantAvatar
    
    try {
      const { db } = await initializeFirebase()
      if (db) {
        const { doc, getDoc, updateDoc } = await import("firebase/firestore")
        
        // Get current user's role
        const currentUserDoc = await getDoc(doc(db, "users", user.uid))
        const currentUserData = currentUserDoc.data() || {}
        const isProvider = currentUserData.role === 'provider'
        
        // Get other participant's data
        const otherUserDoc = await getDoc(doc(db, "users", otherParticipantId))
        if (otherUserDoc.exists()) {
          const otherUserData = otherUserDoc.data()
          
          // Get the name and avatar from user data
          name = otherUserData.displayName || otherUserData.name || otherUserData.email?.split('@')[0] || 'Unknown User'
          avatar = otherUserData.profilePicture || otherUserData.avatar
          
          // Update the conversation with participant info for future use
          if (conversation.id) {
            try {
              await updateDoc(doc(db, "conversations", conversation.id), {
                [`participantNames.${otherParticipantId}`]: name,
                [`participantAvatars.${otherParticipantId}`]: avatar || null,
              });
            } catch (error) {
              console.error("Error updating conversation participant info:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
    }
    
    return { name, avatar }
  }
  
  // Service selector component 
  const ServiceSelector = () => {
    if (!selectedConversation) return null;
    
    // Create a list of all services from main and related conversations
    const allServices = [
      { 
        id: selectedConversation.serviceId,
        title: selectedConversation.serviceTitle,
        price: selectedConversation.servicePrice,
        conversationId: selectedConversation.id
      },
      ...(selectedConversation.relatedConversations?.map((conv) => ({
        id: conv.serviceId,
        title: conv.serviceTitle,
        conversationId: conv.id,
        price: conv.price || 0
      })) || [])
    ].filter(service => service.id && service.title); // Filter out undefined services
    
    // Find the currently active service
    const currentService = allServices.find(service => service.id === activeService) || allServices[0];
    
    if (!currentService) return null;

    return (
      <div className="px-4 py-1 border-b bg-muted/10">
        {allServices.length > 1 && (
          <>
            <div className="text-xs text-muted-foreground mb-1">Switch Service:</div>
            <div className="flex flex-wrap gap-1">
              {allServices.map(service => (
                <Badge
                  key={service.id}
                  variant={service.id === activeService ? "default" : "outline"}
                  className="cursor-pointer text-xs hover:bg-muted"
                  onClick={() => {
                    if (service.id) {
                      setActiveService(service.id);
                    }
                  }}
                >
                  {service.title}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-12rem)] overflow-hidden border rounded-xl bg-background/90 backdrop-blur-md shadow-sm">
      {/* Top navigation bar - removed completely for mobile */}
      
      {/* Mobile Tab Navigation - Always visible on mobile */}
      <div className="flex border-b md:hidden bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <Button 
          variant="ghost" 
          className={`flex-1 rounded-none ${activeMobileTab === 'conversations' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
          onClick={() => {
            setActiveMobileTab('conversations');
            setShowConversationList(true);
          }}
        >
          Conversations
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 rounded-none ${activeMobileTab === 'chat' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
          onClick={() => {
            setActiveMobileTab('chat');
            if (selectedConversation) {
              setShowConversationList(false);
            }
          }}
          disabled={!selectedConversation}
        >
          Chat
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 rounded-none ${activeMobileTab === 'info' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
          onClick={() => {
            setActiveMobileTab('info');
            setShowUserInfo(true);
          }}
          disabled={!selectedConversation}
        >
          Info
        </Button>
      </div>

      <div className={cn(
        "grid h-full",
        showUserInfo && selectedConversation 
          ? "md:grid-cols-[260px_1fr_300px]" 
          : "grid-cols-1 md:grid-cols-[260px_1fr]"
      )}>
        {/* Conversations List - Hide on mobile when not on conversations tab */}
        {(showConversationList || activeMobileTab === 'conversations') && (
          <div className={`border-r flex flex-col h-full overflow-hidden bg-white/70 backdrop-blur-sm ${(windowWidth < 768 && activeMobileTab !== 'conversations') ? 'hidden' : 'block'}`}>
            <div className="p-4 border-b bg-background/80 backdrop-blur-sm hidden md:block">
              <h2 className="font-medium text-base tracking-tight">Your Conversations</h2>
            </div>
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <div className="p-2">
                {loading ? (
                  <div className="p-3 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 mb-2 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-2.5 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  conversations.length === 0 ? (
                    <div className="text-center py-6 px-4 text-muted-foreground text-sm">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-500">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1 px-1 py-2">
                      {conversations.map((conversation) => {
                        const otherParticipantId = getOtherParticipantId(conversation)
                        const isSelected = selectedConversation?.id === conversation.id || 
                                          selectedConversation?.otherParticipantId === otherParticipantId
                        
                        return (
                          <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isSelected={isSelected}
                            onSelect={(conversation) => {
                              selectConversation(conversation);
                              if (windowWidth < 768) {
                                setActiveMobileTab('chat');
                              }
                            }}
                            user={user}
                            getOtherParticipantId={(conv) => getOtherParticipantId(conv)}
                            getConversationDisplayInfo={getConversationDisplayInfo}
                            updateConversationInfo={updateConversationInfo}
                          />
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area - Show based on mobile tab or desktop mode */}
        {((!showConversationList || activeMobileTab === 'chat') && (windowWidth < 768 ? activeMobileTab === 'chat' : true)) && (
          <div className="flex flex-col h-full overflow-hidden bg-white/60 backdrop-blur-sm">
            {!selectedConversation ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gradient-to-b from-gray-50/80 to-white/60">
                <div className="max-w-md mx-auto p-6">
                  <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-12 w-12 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-gray-800 tracking-tight">No conversation selected</h3>
                  <p className="text-gray-500">Select a conversation from the list to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {messages.length === 0 ? (
                  <div className="flex flex-col h-full">
                    {/* Conversation Header */}
                    <div className="p-4 border-b flex justify-between items-center bg-white/80 backdrop-blur-md md:sticky md:top-0 static z-5 mt-[40px] md:mt-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-2 ring-white/90 shadow-sm">
                            <AvatarImage 
                              src={selectedConversation.otherParticipantAvatar || 
                                  (selectedConversation.otherParticipantId && 
                                  selectedConversation.participantAvatars?.[selectedConversation.otherParticipantId]) || 
                                  "/person-male-1.svg?height=32&width=32"} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                              {(selectedConversation.otherParticipantName?.[0] || 
                                (selectedConversation.otherParticipantId && 
                                selectedConversation.participantNames?.[selectedConversation.otherParticipantId]?.[0])) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium tracking-tight text-gray-900">
                              {selectedConversation.otherParticipantName || 
                                (selectedConversation.otherParticipantId && 
                                selectedConversation.participantNames?.[selectedConversation.otherParticipantId]) || 
                                "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedConversation.serviceTitle ? `About: ${selectedConversation.serviceTitle}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Show user info button - hidden on mobile */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setShowUserInfo(!showUserInfo);
                            if (windowWidth < 768) {
                              setActiveMobileTab('info');
                            }
                          }}
                          className={cn("rounded-full md:flex hidden", showUserInfo ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100/80")}
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Empty Messages Display */}
                    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-gray-50/80 to-white/60">
                      <div className="text-center w-full max-w-md mx-auto px-8">
                        <div className="w-24 h-24 rounded-full bg-blue-50 mx-auto mb-6 flex items-center justify-center">
                          <MessageSquare className="h-12 w-12 text-blue-300" />
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-gray-800 tracking-tight">No messages yet</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                          Send a message to start the conversation with {selectedConversation.otherParticipantName || 'this user'}
                        </p>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white/80 backdrop-blur-md">
                      <form onSubmit={handleSendMessage} className="flex items-start space-x-2">
                        {/* Add payment proof button - only show if both users are providers */}
                        {selectedConversation && user?.role === 'provider' && otherParticipantRole === 'provider' && (
                          <UploadPaymentProofDialog
                            onUpload={(imageUrl, serviceId, amount) => {
                              // Create a message with payment proof
                              const paymentMessage = {
                                text: "I've sent the payment.",
                                paymentProof: imageUrl,
                                serviceId: serviceId || selectedConversation.serviceId || activeService || undefined,
                                serviceTitle: selectedConversation.serviceTitle || "Service",
                                paymentAmount: amount || 0
                              };
                              
                              // Add the payment proof to the message
                              handleSendPaymentProof(paymentMessage);
                            }}
                            providerId={getOtherParticipantId(selectedConversation) || undefined}
                            services={
                              // Create services array for the dialog
                              [
                                // Add the main service
                                selectedConversation.serviceId && selectedConversation.serviceTitle ? {
                                  id: selectedConversation.serviceId,
                                  title: selectedConversation.serviceTitle,
                                  price: selectedConversation.servicePrice
                                } : null,
                                // Add related services
                                ...(selectedConversation.relatedConversations?.map(conv => 
                                  conv.serviceId && conv.serviceTitle ? {
                                    id: conv.serviceId,
                                    title: conv.serviceTitle,
                                    price: conv.price
                                  } : null
                                ) || [])
                              ].filter(Boolean) as Array<{id: string, title: string, price?: number | string}>
                            }
                          />
                        )}
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="resize-none min-h-[50px] flex-1 rounded-2xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          disabled={!newMessage.trim()} 
                          className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm transition-all"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  // Normal conversation with messages
                  <>
                    {/* Fixed Header */}
                    <div className="border-b bg-white/90 backdrop-blur-md md:sticky md:top-0 static z-5 mt-[40px] md:mt-0">
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-white/90 shadow-sm">
                              <AvatarImage 
                                src={selectedConversation.otherParticipantAvatar || 
                                    (selectedConversation.otherParticipantId && 
                                    selectedConversation.participantAvatars?.[selectedConversation.otherParticipantId]) || 
                                    "/person-male-1.svg?height=32&width=32"} 
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                                {(selectedConversation.otherParticipantName?.[0] || 
                                  (selectedConversation.otherParticipantId && 
                                  selectedConversation.participantNames?.[selectedConversation.otherParticipantId]?.[0])) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium tracking-tight text-gray-900">
                                {selectedConversation.otherParticipantName || 
                                  (selectedConversation.otherParticipantId && 
                                  selectedConversation.participantNames?.[selectedConversation.otherParticipantId]) || 
                                  "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedConversation.serviceTitle ? `About: ${selectedConversation.serviceTitle}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Show user info button - hidden on mobile */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setShowUserInfo(!showUserInfo);
                              if (windowWidth < 768) {
                                setActiveMobileTab('info');
                              }
                            }}
                            className={cn("rounded-full md:flex hidden", showUserInfo ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100/80")}
                          >
                            <Info className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      {activeService && <ServiceSelector />}
                    </div>

                    {/* Scrollable messages area - Improve message bubble layout */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide bg-gradient-to-b from-gray-50/50 to-white/80">
                      <div className="p-4 space-y-4">
                        {messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No messages yet</p>
                          </div>
                        ) : (
                          messages.map((message, index) => {
                            const isMe = message.senderId === user.uid;
                            
                            // Add safety check for timestamps
                            const showServiceContext = index === 0 || 
                              (messages[index-1].serviceId !== message.serviceId) ||
                              (message.timestamp && messages[index-1].timestamp && 
                                new Date(message.timestamp.toDate()).getTime() - 
                                new Date(messages[index-1].timestamp.toDate()).getTime() > 3600000);
                          
                            return (
                              <React.Fragment key={message.id}>
                                {showServiceContext && message.serviceId && message.serviceTitle && (
                                  <></>
                                )}
                                
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[70%]">
                                    {!isMe && (
                                      <Avatar className="h-9 w-9 mt-1 flex-shrink-0 ring-2 ring-white/90 shadow-sm">
                                        <AvatarImage src={message.senderAvatar || "/person-male-1.svg?height=32&width=32"} />
                                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-white text-gray-600">{message.senderName?.[0] || "?"}</AvatarFallback>
                                      </Avatar>
                                    )}
                                    
                                    <div className={`space-y-1 ${isMe ? 'order-first mr-2' : ''}`}>
                                      {!isMe && (
                                        <p className="text-xs text-gray-500 font-medium ml-1">
                                          {message.senderName}
                                        </p>
                                      )}
                                      
                                      <div 
                                        className={cn(
                                          "rounded-2xl px-4 py-3 text-sm break-words shadow-sm",
                                          isMe 
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                                            : "bg-white border border-gray-100"
                                        )}
                                      >
                                        {message.text}
                                        
                                        {message.paymentProof && (
                                          <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                              <p className={`text-xs font-semibold ${isMe ? 'text-blue-100' : 'text-gray-700'}`}>Payment Proof:</p>
                                              {message.paymentConfirmed && (
                                                <Badge variant="success" className="text-xs bg-green-500 text-white">Confirmed</Badge>
                                              )}
                                            </div>
                                            
                                            {/* Service and amount info - Enhanced display */}
                                            <div className={`mb-2 p-2 rounded-md ${isMe ? 'bg-blue-400/20' : 'bg-gray-50'}`}>
                                              {message.serviceTitle && (
                                                <div className="mb-1 text-xs">
                                                  <span className={`font-medium ${isMe ? 'text-blue-100' : 'text-gray-700'}`}>Service:</span> 
                                                  <span className={isMe ? 'text-white' : 'text-gray-800'}> {message.serviceTitle}</span>
                                                </div>
                                              )}
                                              
                                              {message.paymentAmount && (
                                                <div className="text-xs font-semibold">
                                                  <span className={`font-medium ${isMe ? 'text-blue-100' : 'text-gray-700'}`}>Amount:</span> 
                                                  <span className={isMe ? 'text-white' : 'text-green-600'}> ₱{typeof message.paymentAmount === 'number' 
                                                    ? message.paymentAmount.toLocaleString() 
                                                    : message.paymentAmount}</span>
                                                </div>
                                              )}
                                            </div>
                                            
                                            <img 
                                              src={message.paymentProof} 
                                              alt="Payment Proof" 
                                              className="max-h-40 w-full object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-gray-200" 
                                              onClick={() => setPreviewImage(message.paymentProof)}
                                            />
                                            
                                            {/* Payment confirmation buttons for provider */}
                                            {isProvider && !message.paymentConfirmed && (
                                              <div className="mt-3 flex gap-2">
                                                <Button 
                                                  size="sm" 
                                                  variant="default"
                                                  className="flex-1 h-9 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm transition-all"
                                                  onClick={() => handleConfirmPayment(message)}
                                                >
                                                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                                  Confirm Payment
                                                  <span className="ml-1 font-bold text-white">
                                                    (₱{typeof message.paymentAmount === 'number' 
                                                      ? message.paymentAmount.toLocaleString() 
                                                      : message.paymentAmount})
                                                  </span>
                                                </Button>
                                              </div>
                                            )}
                                            
                                            {/* Payment confirmed indicator */}
                                            {message.paymentConfirmed && (
                                              <div className={`mt-2 flex items-center gap-1 text-xs ${isMe ? 'text-blue-100' : 'text-green-600'}`}>
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                <span>{isMe ? 'Your payment was confirmed!' : 'Payment confirmed'}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className={`text-xs text-gray-400 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                        {message.time}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Message Input Area */}
                    <div className="p-4 border-t bg-white/90 backdrop-blur-md">
                      <form onSubmit={handleSendMessage} className="flex items-start space-x-2">
                        {/* Add payment proof button - only show if both users are providers */}
                        {selectedConversation && user?.role === 'provider' && otherParticipantRole === 'provider' && (
                          <UploadPaymentProofDialog
                            onUpload={(imageUrl, serviceId, amount) => {
                              // Create a message with payment proof
                              const paymentMessage = {
                                text: "I've sent the payment.",
                                paymentProof: imageUrl,
                                serviceId: serviceId || selectedConversation.serviceId || activeService || undefined,
                                serviceTitle: selectedConversation.serviceTitle || "Service",
                                paymentAmount: amount || 0
                              };
                              
                              // Add the payment proof to the message
                              handleSendPaymentProof(paymentMessage);
                            }}
                            providerId={getOtherParticipantId(selectedConversation) || undefined}
                            services={
                              // Create services array for the dialog
                              [
                                // Add the main service
                                selectedConversation.serviceId && selectedConversation.serviceTitle ? {
                                  id: selectedConversation.serviceId,
                                  title: selectedConversation.serviceTitle,
                                  price: selectedConversation.servicePrice
                                } : null,
                                // Add related services
                                ...(selectedConversation.relatedConversations?.map(conv => 
                                  conv.serviceId && conv.serviceTitle ? {
                                    id: conv.serviceId,
                                    title: conv.serviceTitle,
                                    price: conv.price
                                  } : null
                                ) || [])
                              ].filter(Boolean) as Array<{id: string, title: string, price?: number | string}>
                            }
                          />
                        )}
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="resize-none min-h-[50px] flex-1 rounded-2xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          disabled={!newMessage.trim()} 
                          className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm transition-all"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
        
        {/* User Info Panel - Shown based on mobile tab or desktop mode */}
        {showUserInfo && selectedConversation && (windowWidth < 768 ? activeMobileTab === 'info' : true) && (
          <div className={`border-l flex-col h-full overflow-hidden ${windowWidth < 768 ? 'block' : 'hidden sm:flex'}`}>
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <div className="p-4">
                {/* Mobile-only back button */}
                {windowWidth < 768 && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">
                      {otherParticipantRole === 'provider' ? 'About Provider' : 'About Client'}
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setActiveMobileTab('chat');
                      }}
                      className="md:hidden"
                    >
                      Back to Chat
                    </Button>
                  </div>
                )}
                
                {/* User profile section */}
                <div className="text-center mb-4">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage
                      src={selectedConversation.otherParticipantAvatar || 
                          (selectedConversation.otherParticipantId && 
                          selectedConversation.participantAvatars?.[selectedConversation.otherParticipantId]) || 
                          "/person-male-1.svg?height=64&width=64"}
                      alt={selectedConversation.otherParticipantName || "User"}
                    />
                    <AvatarFallback>
                      {(selectedConversation.otherParticipantName?.[0] || 
                        (selectedConversation.otherParticipantId && 
                        selectedConversation.participantNames?.[selectedConversation.otherParticipantId]?.[0])) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mt-3">
                    {selectedConversation.otherParticipantName || 
                      (selectedConversation.otherParticipantId && 
                      selectedConversation.participantNames?.[selectedConversation.otherParticipantId]) || 
                      "Unknown User"}
                  </h3>
                  
                  {/* Display role badge */}
                  <Badge variant="outline" className="mt-2">
                    {otherParticipantRole === 'provider' ? 'Service Provider' : 'Client'}
                  </Badge>
                </div>

                <ConversationInfo 
                  userId={getOtherParticipantId(selectedConversation) || ""}
                  serviceId={activeService || selectedConversation?.serviceId}
                  isVisible={true}
                  onClose={() => {
                    setShowUserInfo(false);
                    if (windowWidth < 768) {
                      setActiveMobileTab('chat');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {previewImage && (
        <ImagePreviewDialog
          src={previewImage}
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
      
      {/* Rating Dialog */}
      {ratingService && (
        <RatingDialog
          isOpen={ratingDialogOpen}
          onClose={() => {
            setRatingDialogOpen(false);
            setRatingService(null);
          }}
          serviceId={ratingService.serviceId}
          serviceTitle={ratingService.serviceTitle}
          providerId={ratingService.providerId}
          providerName={ratingService.providerName}
          transactionId={ratingService.transactionId}
        />
      )}
    </div>
  )
}