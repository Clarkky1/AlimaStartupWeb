"use client"

import React, { useRef, useEffect } from "react"
import { useState, useEffect as useEffectState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, ArrowLeft, Upload, X, Phone, Mail, MapPin, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { initializeFirebase } from "@/app/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"

export default function MessagePage({ params }: { params: { providerId: string } }) {
  const { providerId } = params;
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [provider, setProvider] = useState<any>(null)
  const [providerServices, setProviderServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100) // Add small delay to ensure content is rendered
  }

  // Add this useEffect for auto-scrolling
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffectState(() => {
    async function fetchProviderData() {
      if (authLoading) return

      if (!user) {
        // Skip provider data fetching - we'll show login UI instead
        setLoading(false)
        return
      }

      // Check if user is trying to message themselves
      if (user.uid === providerId) {
        toast({
          title: "Action not allowed",
          description: "You cannot message yourself",
          variant: "destructive",
        })
        router.push("/dashboard")
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
          return
        }

        const { doc, getDoc, collection, getDocs, query, where } = await import("firebase/firestore")
        
        // Fetch provider profile
        const providerDoc = await getDoc(doc(db, "users", providerId))
        if (providerDoc.exists()) {
          setProvider({
            id: providerDoc.id,
            ...providerDoc.data(),
          })
          
          // Fetch provider's services
          const servicesQuery = query(
            collection(db, "services"), 
            where("providerId", "==", providerId),
            where("active", "==", true)
          )
          
          const servicesSnapshot = await getDocs(servicesQuery)
          const servicesData: any[] = []
          
          servicesSnapshot.forEach((doc) => {
            servicesData.push({
              id: doc.id,
              ...doc.data(),
            })
          })
          
          setProviderServices(servicesData)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching provider data:", error)
        toast({
          title: "Error",
          description: "Failed to load provider information",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchProviderData()
  }, [providerId, authLoading, user])

  useEffectState(() => {
    async function fetchMessages() {
      if (authLoading) return;
      
      if (!user || !providerId) {
        // Skip fetching messages if user is not logged in
        return;
      }

      try {
        const { db } = await initializeFirebase();
        if (!db) throw new Error("Failed to initialize Firebase");
        
        const { collection, query, where, orderBy, onSnapshot, doc, getDoc } = await import("firebase/firestore");

        const participants = [user.uid, providerId].sort();
        const conversationId = participants.join('_');

        const messagesQuery = query(
          collection(db, "messages"),
          where("conversationId", "==", conversationId),
          orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
          const messagesList: any[] = [];
          for (const messageDoc of snapshot.docs) {
            const messageData = messageDoc.data();
            const senderId = messageData.senderId;
            
            // Get sender's profile data
            const senderDocRef = doc(db, "users", senderId);
            const senderDoc = await getDoc(senderDocRef);
            const senderData = senderDoc.data() || {};
            
            // Determine if sender is provider or client
            const isProvider = senderData.role === 'provider';
            
            messagesList.push({
              id: messageDoc.id,
              ...messageData,
              timestamp: messageData.timestamp?.toDate(),
              senderName: isProvider ? 
                (senderData.name || senderData.displayName || "Provider") : 
                (senderData.name || senderData.displayName || "Client"),
              senderAvatar: senderData.profilePicture || senderData.avatar || null
            });
          }
          setMessages(messagesList);
          scrollToBottom();
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    fetchMessages();
  }, [user, providerId, authLoading]);

  // Fetch user's conversations
  useEffectState(() => {
    async function fetchContacts() {
      if (!user || authLoading) return
      
      try {
        const { db } = await initializeFirebase()
        if (!db) throw new Error("Failed to initialize Firebase")
        
        const { collection, query, where, orderBy, onSnapshot, doc, getDoc } = await import("firebase/firestore")
        
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTime", "desc")
        )
        
        const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
          const contactsList: any[] = []
          
          for (const convDoc of snapshot.docs) {
            const convData = convDoc.data()
            
            // Find the other participant (not the current user)
            const otherUserId = convData.participants.find((id: string) => id !== user.uid)
            
            // Get other user's profile
            const userDocRef = doc(db, "users", otherUserId)
            const userDoc = await getDoc(userDocRef)
            const userData = userDoc.data() || {}
            
            contactsList.push({
              id: convDoc.id,
              ...convData,
              contactId: otherUserId,
              contactName: userData.name || userData.displayName || "User",
              contactAvatar: userData.profilePicture || userData.avatar || null,
              lastMessageTime: convData.lastMessageTime?.toDate()
            })
          }
          
          setContacts(contactsList)
        })
        
        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching contacts:", error)
      }
    }
    
    fetchContacts()
  }, [user, authLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!message.trim() && !paymentProofUrl) || !user) return

    // Another check to prevent self-messaging
    if (user.uid === providerId) {
      toast({
        title: "Action not allowed",
        description: "You cannot message yourself",
        variant: "destructive",
      })
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
        return
      }

      const { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } = await import("firebase/firestore")

      // Get user profile data first
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data() || {}
      const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous"

      // Create conversation ID and participants array
      const participants = [user.uid, providerId].sort()
      const conversationId = participants.join('_')
      const timestamp = serverTimestamp()

      // Create/update conversation data with service information if available
      const conversationData: any = {
        participants,
        lastMessage: paymentProofUrl ? "Payment proof attached" : message,
        lastMessageTime: timestamp,
        lastSenderId: user.uid,
        lastSenderName: userName,
        lastSenderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
      }
      
      // Include service info if available
      if (selectedService) {
        conversationData.serviceId = selectedService.id
        conversationData.serviceTitle = selectedService.title
        conversationData.servicePrice = selectedService.price
      }
      
      await setDoc(doc(db, "conversations", conversationId), conversationData, { merge: true })

      // Add the message
      const messageData: any = {
        conversationId,
        senderId: user.uid,
        senderName: userName,
        senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
        receiverId: providerId,
        text: message.trim() ? message : "Payment proof attached",
        timestamp,
        read: false,
      }
      
      if (paymentProofUrl) {
        messageData.paymentProof = paymentProofUrl
      }
      
      if (selectedService) {
        messageData.serviceId = selectedService.id
        messageData.serviceTitle = selectedService.title
      }
      
      await addDoc(collection(db, "messages"), messageData)

      // Create notification for provider
      const notificationData: any = {
        userId: providerId,
        type: paymentProofUrl ? "payment_proof" : "message",
        title: paymentProofUrl ? "Payment Proof Received" : "New Message",
        description: paymentProofUrl 
          ? `${userName} sent you a payment proof`
          : `${userName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
        timestamp,
        read: false,
        data: {
          conversationId,
          senderId: user.uid,
          senderName: userName,
          senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
          messageText: message,
        }
      }
      
      if (paymentProofUrl) {
        notificationData.data.paymentProofUrl = paymentProofUrl
      }
      
      if (selectedService) {
        notificationData.data.serviceId = selectedService.id
        notificationData.data.serviceTitle = selectedService.title
      }
      
      await addDoc(collection(db, "notifications"), notificationData)

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })

      // Clear the message and payment proof after sending
      setMessage("")
      setPaymentProofUrl(null)
      
      // Remove the router.push to stay on the current page
      // router.push("/dashboard/messages") // This line should be removed
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handlePaymentProofUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', `payment-proofs/${user?.uid || "unknown"}`)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setPaymentProofUrl(data.secure_url)
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading payment proof:', error)
      toast({
        title: "Error",
        description: "Failed to upload payment proof",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  if (loading || authLoading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="h-8 px-2 mb-4 flex items-center" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>
              Please log in or create an account to message this service provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img src="/AlimaLOGO.svg" alt="Alima Logo" className="h-16 w-16 mb-4" />
            <p className="text-center mb-6">
              Connecting with service providers requires an account to ensure secure and reliable communications.
            </p>
            <div className="flex gap-4 w-full">
              <Button 
                className="flex-1" 
                onClick={() => router.push(`/login?returnUrl=/message/${providerId}`)}
              >
                Login
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push(`/signup?returnUrl=/message/${providerId}`)}
              >
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Provider Not Found</h2>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return ""
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="container mx-auto px-0 py-10">
      <div className="flex justify-start mb-3 mt-4 -ml-2">
        <Button variant="ghost" className="h-8 px-2 flex items-center" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-5 overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-base">Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {contacts.length > 0 ? (
                  <div className="divide-y">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id}
                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors ${
                          contact.contactId === providerId ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => router.push(`/message/${contact.contactId}`)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.contactAvatar || "/person-male-1.svg"} />
                          <AvatarFallback>{contact.contactName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.contactName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lastMessage || "No messages yet"}
                          </p>
                          {contact.lastMessageTime && (
                            <p className="text-xs opacity-70">
                              {contact.lastMessageTime.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {contact.serviceTitle && (
                          <Badge variant="outline" className="text-xs hidden sm:block">
                            {contact.serviceTitle.substring(0, 10)}
                            {contact.serviceTitle.length > 10 ? '...' : ''}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Card */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card>
            <CardHeader className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={provider?.avatar || provider?.profilePicture || "/person-male-1.svg"}
                      alt={provider?.name || "Provider"}
                    />
                    <AvatarFallback>{provider?.name?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{provider?.name || provider?.displayName || "Service Provider"}</CardTitle>
                    <CardDescription>{provider?.title || provider?.bio?.substring(0, 60) || "Service Provider"}</CardDescription>
                  </div>
                </div>
                
                {selectedService && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Current Service</Badge>
                      <span className="font-medium">{selectedService.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedService.category && (
                        <Badge variant="outline" className="text-xs">
                          {formatCategoryName(selectedService.category)}
                        </Badge>
                      )}
                      <Badge variant="default" className="text-xs">₱{selectedService.price}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-center bg-muted/30 py-2 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Welcome to your conversation! You can now message this service provider directly.
                </p>
              </div>
              <div className="mb-2 h-[calc(100vh-500px)] overflow-y-auto border rounded-md p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={msg.senderAvatar || "/person-male-1.svg"} />
                          <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{msg.senderName}</span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                      {msg.paymentProof && (
                        <img 
                          src={msg.paymentProof} 
                          alt="Payment Proof" 
                          className="mt-2 max-h-40 rounded-md"
                        />
                      )}
                      <span className="text-xs opacity-70 block mt-1">
                        {msg.timestamp?.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="space-y-2">
                {providerServices.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Service</label>
                    <div className="flex flex-wrap gap-2">
                      {providerServices.map((service) => (
                        <Badge
                          key={service.id}
                          variant={selectedService?.id === service.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedService(service)}
                        >
                          {service.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Textarea
                      placeholder="Write your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[60px] flex-1"
                    />
                    <Button 
                      type="submit" 
                      onClick={handleSendMessage} 
                      disabled={!message.trim() && !paymentProofUrl} 
                      className="h-12 w-12 flex-shrink-0 rounded-md p-0"
                      aria-label="Send Message"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Payment proof upload button */}
                  {(!user?.role || user?.role !== 'provider') && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="flex items-center self-start">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Payment Proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Payment Proof</DialogTitle>
                          <DialogDescription>
                            Upload an image that shows your payment transaction details.
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
                                handlePaymentProofUpload(file)
                              }
                            }}
                            disabled={isUploading}
                          />
                          {isUploading && (
                            <div className="flex justify-center mt-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {paymentProofUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Payment Proof:</p>
                    <div className="relative">
                      <img 
                        src={paymentProofUrl} 
                        alt="Payment Proof" 
                        className="max-h-40 rounded-md border" 
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={() => setPaymentProofUrl(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Provider Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="p-3">
              <CardTitle>About Provider</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-4">
                <div className="text-center mb-3">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage
                      src={provider?.avatar || provider?.profilePicture || "/person-male-1.svg"}
                      alt={provider?.name || "Provider"}
                    />
                    <AvatarFallback>{provider?.name?.charAt(0) || "P"}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mt-3">{provider?.name || provider?.displayName}</h3>
                  {provider?.title && <p className="text-sm text-muted-foreground">{provider.title}</p>}
                </div>

                {provider?.rating && (
                  <div className="flex items-center justify-center gap-1 text-sm my-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(provider.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1">{provider.rating.toFixed(1)}</span>
                  </div>
                )}

                {provider?.bio && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-1">Bio</h4>
                    <p className="text-sm text-muted-foreground">{provider.bio}</p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                  <div className="space-y-2">
                    {provider?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.email}</span>
                      </div>
                    )}
                    {provider?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    {provider?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add selected service card here - after Contact Info */}
                {selectedService && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-2">Selected Service</h4>
                    <div className="rounded-md border overflow-hidden bg-muted/10">
                      <div className="p-3 flex flex-col sm:flex-row gap-3">
                        {selectedService.image && (
                          <div className="sm:w-1/4">
                            <img 
                              src={selectedService.image} 
                              alt={selectedService.title} 
                              className="h-full w-full object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg"
                                e.currentTarget.onerror = null
                              }}
                            />
                          </div>
                        )}
                        <div className="sm:w-3/4">
                          <h3 className="font-medium">{selectedService.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{selectedService.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">₱{selectedService.price}</span>
                            {selectedService.category && (
                              <Badge variant="outline" className="text-xs">
                                {formatCategoryName(selectedService.category)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {provider?.specialties && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedService && providerServices.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-2">Services</h4>
                    <div className="space-y-2">
                      {providerServices.slice(0, 3).map((service) => (
                        <div 
                          key={service.id} 
                          className="p-2 rounded-md border cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedService(service)}
                        >
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{service.title}</p>
                            <span className="text-sm">₱{service.price}</span>
                          </div>
                          {service.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {formatCategoryName(service.category)}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {providerServices.length > 3 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{providerServices.length - 3} more services
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
