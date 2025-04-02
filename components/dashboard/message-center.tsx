"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Image, DollarSign, X, Upload, ArrowLeft, Info, Phone, MapPin, ChevronLeft, Star, Mail, MessageSquare } from "lucide-react"
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
}

interface RelatedConversation {
  id: string;
  serviceId?: string;
  serviceTitle?: string;
  lastMessageTime?: any;
}

// Mock data for initial render
const mockUsers: User[] = [
  {
    id: "user1",
    name: "Kin Clark",
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

const UploadPaymentProofDialog = ({ onUpload, providerId }: { onUpload: (imageUrl: string) => void; providerId?: string }) => {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

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
      onUpload(data.secure_url);
      
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
      onUpload('/peace-hand.svg');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Upload Payment Proof
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Upload a screenshot of your payment receipt
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <label htmlFor="payment-proof">
            Upload payment proof image
          </label>
          <input
            id="payment-proof"
            type="file"
            accept="image/*"
            className="w-full"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleUpload(file)
              }
            }}
            disabled={isUploading}
          />
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
          setUser({
            id: userDoc.id,
            ...userDoc.data()
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
    <div className="border-l h-full overflow-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Profile Information</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {loading ? (
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center justify-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-32 mt-4" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {user && (
            <>
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage
                    src={user.avatar || user.profilePicture || "/person-male-1.svg?height=96&width=96"}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold mt-3">{user.name || user.displayName}</h3>
                {user.title && <p className="text-sm text-muted-foreground">{user.title}</p>}
                {user.role && (
                  <Badge variant="outline" className="mt-2">
                    {user.role === 'provider' ? 'Service Provider' : 'Client'}
                  </Badge>
                )}
              </div>

              {user.rating && (
                <div className="flex items-center justify-center gap-1 text-sm my-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(user.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-1">{user.rating.toFixed(1)}</span>
                </div>
              )}

              {user.bio && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-1">Bio</h4>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              )}

              <div className="border-t pt-3">
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
                <div className="border-t pt-3">
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
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold mb-2">Service Information</h4>
              <div className="rounded-md border overflow-hidden bg-muted/10">
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
                      <span className="text-sm font-bold">₱{service.price}</span>
                      {service.category && (
                        <Badge variant="outline" className="text-xs">
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
  
  // Move the useEffect into this component
  useEffect(() => {
    if (!conversation.otherParticipantName && otherParticipantId) {
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
        <AvatarImage src={conversation.otherParticipantAvatar || "/person-male-1.svg?height=40&width=40"} />
        <AvatarFallback>{conversation.otherParticipantName?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <div className="space-y-1 flex-1 overflow-hidden">
        <div className="flex justify-between">
          <p className="font-medium text-sm">
            {conversation.otherParticipantName || 'Loading...'}
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full max-h-[80vh] overflow-auto">
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
              setSelectedConversation(targetConversation)
              setShowUserInfo(true) // Show user info when coming from notification
            }
            
            // Clear the sessionStorage
            sessionStorage.removeItem('selectedConversationId')
            sessionStorage.removeItem('selectedServiceId')
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
        let targetConversationId = selectedConversation.id;
        
        if (activeService && activeService !== selectedConversation.serviceId) {
          const relatedConv = selectedConversation.relatedConversations?.find(
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
              where("senderId", "==", user.uid),
              where("receiverId", "==", user.uid)
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

  const getOtherParticipantId = (conversation: ConversationData) => {
    if (!user) return null
    return conversation.otherParticipantId || conversation.participants.find((id: string) => id !== user.uid)
  }

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user) return
    
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
        senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
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
        lastSenderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
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
    
    let name = conversation.otherParticipantName || 'Unknown User'
    let avatar = conversation.otherParticipantAvatar
    
    // If the conversation has the lastSenderName and it's not the current user, use that
    if (conversation.lastSenderName && conversation.lastSenderId !== user.uid) {
      name = conversation.lastSenderName
      avatar = conversation.lastSenderAvatar
    }
    
    // If we don't have a name yet, try to fetch from users collection
    if (name === 'Unknown User') {
      try {
        const { db } = await initializeFirebase()
        if (db) {
          const { doc, getDoc } = await import("firebase/firestore")
          const userDoc = await getDoc(doc(db, "users", otherParticipantId))
          if (userDoc.exists()) {
            name = userDoc.data().displayName || userDoc.data().name || 'Unknown User'
            avatar = userDoc.data().profilePicture || userDoc.data().avatar
          }
        }
      } catch (error) {
        console.error("Error fetching user details:", error)
      }
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
        price: conv.price
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
                  onClick={() => setActiveService(service.id)}
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
    <div className="h-[calc(100vh-12rem)] overflow-hidden border rounded-lg bg-background">
      <div className={cn(
        "grid h-full",
        showUserInfo && selectedConversation 
          ? "grid-cols-[260px_1fr_300px]" 
          : "grid-cols-[260px_1fr]"
      )}>
        {/* Conversations List */}
        <div className="border-r flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b bg-background">
            <h2 className="font-semibold">Your Conversations</h2>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            <div className="p-2">
              {loading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-2 mb-1">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-2 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                conversations.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => {
                      const otherParticipantId = getOtherParticipantId(conversation)
                      const isSelected = selectedConversation?.id === conversation.id || 
                                        selectedConversation?.otherParticipantId === otherParticipantId
                      
                      return (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isSelected={isSelected}
                          onSelect={setSelectedConversation}
                          user={user}
                          getOtherParticipantId={getOtherParticipantId}
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

        {/* Messages Area */}
        <div className="flex flex-col h-full overflow-hidden">
          {!selectedConversation ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="max-w-md mx-auto">
                <MessageSquare className="h-20 w-20 mb-4 mx-auto text-primary/20" />
                <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                <p className="text-muted-foreground">Select a conversation from the list to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="flex flex-col h-full">
                  {/* Conversation Header */}
                  <div className="p-3 border-b flex justify-between items-center bg-muted/10">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={selectedConversation.otherParticipantAvatar || "/person-male-1.svg?height=32&width=32"} 
                          />
                          <AvatarFallback>{selectedConversation.otherParticipantName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {selectedConversation.otherParticipantName || getOtherParticipantId(selectedConversation)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowUserInfo(true)}
                      className={showUserInfo ? "text-primary" : ""}
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Empty Messages Display */}
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center w-full max-w-md mx-auto px-8">
                      <MessageSquare className="h-24 w-24 mb-6 mx-auto text-muted-foreground/10" />
                      <h3 className="text-xl font-medium mb-3 text-foreground">No messages yet</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Send a message to start the conversation with {selectedConversation.otherParticipantName || 'this user'}</p>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex items-start space-x-2"> {/* Added items-start */}
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="resize-none min-h-[50px] flex-1"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!newMessage.trim()} 
                        className="mt-1" // Added mt-1 for fine-tuning position
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
                  <div className="border-b bg-background sticky top-0 z-10">
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={selectedConversation.otherParticipantAvatar || "/person-male-1.svg?height=32&width=32"} 
                            />
                            <AvatarFallback>{selectedConversation.otherParticipantName?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {selectedConversation.otherParticipantName || getOtherParticipantId(selectedConversation)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowUserInfo(true)}
                        className={showUserInfo ? "text-primary" : ""}
                      >
                        <Info className="h-5 w-5" />
                      </Button>
                    </div>
                    {activeService && <ServiceSelector />}
                  </div>

                  {/* Scrollable messages area */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                                <div className="flex items-start gap-2 max-w-[75%]">
                                  {!isMe && (
                                    <Avatar className="h-8 w-8 mt-1">
                                      <AvatarImage src={message.senderAvatar || "/person-male-1.svg?height=32&width=32"} />
                                      <AvatarFallback>{message.senderName?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  
                                  <div className={`space-y-1 ${isMe ? 'order-first mr-2' : ''}`}>
                                    {!isMe && (
                                      <p className="text-xs text-muted-foreground">
                                        {message.senderName}
                                      </p>
                                    )}
                                    
                                    <div 
                                      className={cn(
                                        "rounded-lg px-3 py-2 text-sm",
                                        isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                      )}
                                    >
                                      {message.text}
                                      
                                      {message.paymentProof && (
                                        <div className="mt-2">
                                          <p className="text-xs mb-1">Payment Proof:</p>
                                          <img 
                                            src={message.paymentProof} 
                                            alt="Payment Proof" 
                                            className="max-h-40 rounded-md cursor-pointer hover:opacity-90 transition-opacity" 
                                            onClick={() => setPreviewImage(message.paymentProof)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className={`flex text-xs text-muted-foreground ${isMe ? 'justify-end' : ''}`}>
                                      {message.timestamp && (
                                        <span>
                                          {new Date(message.timestamp.toDate()).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      )}
                                      {isMe && (
                                        <span className="ml-2">
                                          {message.read ? "Read" : "Sent"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isMe && (
                                    <Avatar className="h-8 w-8 mt-1">
                                      <AvatarImage src={message.senderAvatar || "/person-male-1.svg?height=32&width=32"} />
                                      <AvatarFallback>{message.senderName?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              </div>
                            </React.Fragment>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="border-t bg-background p-3 sticky bottom-0">
                    <form onSubmit={handleSendMessage} className="flex items-start space-x-2"> {/* Added items-start */}
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="resize-none min-h-[50px] flex-1"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!newMessage.trim()} 
                        className="mt-1" // Added mt-1 for fine-tuning position
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
        
        {/* Info Panel - Only visible when showUserInfo is true */}
        {showUserInfo && selectedConversation && (
          <div className="border-l flex flex-col h-full overflow-hidden">
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <ConversationInfo 
                userId={getOtherParticipantId(selectedConversation) || ""}
                serviceId={activeService || selectedConversation?.serviceId}
                isVisible={true}
                onClose={() => setShowUserInfo(false)}
              />
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
    </div>
  )
}