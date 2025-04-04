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

export default function MessagePage({ params }: { params: { providerId: string } }) {
  // Create a properly typed version of params to use with React.use()
  const unwrappedParams = React.use(params as unknown as Promise<{ providerId: string }>);
  const { providerId } = unwrappedParams;
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
        toast({
          title: "Authentication required",
          description: "Please log in to send messages",
          variant: "destructive",
        })
        // Remove the router.push("/login") to prevent navigation when already logged in
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
              ...doc.data()
            })
          })
          
          setProviderServices(servicesData)
          
          // Check if there's a service associated with an existing conversation
          const participants = [user.uid, providerId].sort()
          const conversationId = participants.join('_')
          const conversationDoc = await getDoc(doc(db, "conversations", conversationId))
          
          if (conversationDoc.exists() && conversationDoc.data().serviceId) {
            const serviceId = conversationDoc.data().serviceId
            const serviceDoc = await getDoc(doc(db, "services", serviceId))
            
            if (serviceDoc.exists()) {
              setSelectedService({
                id: serviceDoc.id,
                ...serviceDoc.data()
              })
            }
          } else if (servicesData.length > 0) {
            // Default to first service if no service is associated with conversation
            setSelectedService(servicesData[0])
          }
        } else {
          toast({
            title: "Provider not found",
            description: "The service provider you're trying to contact doesn't exist",
            variant: "destructive",
          })
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching provider data:", error)
        toast({
          title: "Error",
          description: "Failed to load provider information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProviderData()
  }, [providerId, user, authLoading, router, toast])

  useEffectState(() => {
    async function fetchMessages() {
      if (!user || !providerId) return;

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
  }, [user, providerId]);

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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
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
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-4 flex items-center" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Message Card */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="space-y-4">
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
              <div className="mb-4 h-[400px] overflow-y-auto border rounded-md p-4">
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
                <div ref={messagesEndRef} /> {/* Add this div at the end of messages */}
              </div>
              <form onSubmit={handleSendMessage} className="space-y-4">
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
                
                {selectedService && (
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
                )}

                <div>
                  <Textarea
                    placeholder="Write your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                  />
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
                
                <div className="flex justify-between items-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="flex items-center">
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
                  
                  <Button type="submit" onClick={handleSendMessage} disabled={!message.trim() && !paymentProofUrl} className="flex items-center">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Provider Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>About Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Avatar className="h-24 w-24 mx-auto">
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
