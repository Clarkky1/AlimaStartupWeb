"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Send, Upload, X } from "lucide-react"
import { initializeFirebase } from "@/app/lib/firebase"
import { useAuth } from "@/app/context/auth-context"
import { Badge } from "../ui/badge"

type ContactModalProps = {
  isOpen: boolean
  onClose: () => void
  provider: {
    id: string
    name: string
    avatar?: string
    profilePicture?: string
    title?: string
  }
  service?: {
    id: string
    title: string
    price: number
    description?: string
    image?: string
    category?: string
  }
}

export function ContactModal({ isOpen, onClose, provider, service }: ContactModalProps) {
  const [message, setMessage] = useState("")
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const [isSending, setIsSending] = useState(false)

  // Clear form when dialog is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setMessage("")
      setPaymentProofUrl(null)
    }
  }, [isOpen])

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return ""
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handlePaymentProofUpload = async (file: File) => {
    // Prevent uploads over 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5MB",
        variant: "destructive",
      })
      return
    }

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!message.trim() && !paymentProofUrl) || !user) {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to send messages",
          variant: "destructive",
        })
      }
      return
    }

    // Prevent self-messaging
    if (user.uid === provider.id) {
      toast({
        title: "Action not allowed",
        description: "You cannot message yourself",
        variant: "destructive",
      })
      onClose()
      return
    }

    try {
      setIsSending(true)
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
      const participants = [user.uid, provider.id].sort()
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
      if (service) {
        conversationData.serviceId = service.id
        conversationData.serviceTitle = service.title
        conversationData.servicePrice = service.price
      }
      
      await setDoc(doc(db, "conversations", conversationId), conversationData, { merge: true })

      // Add the message
      const messageData: any = {
        conversationId,
        senderId: user.uid,
        senderName: userName,
        senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
        receiverId: provider.id,
        text: message.trim() ? message : "Payment proof attached",
        timestamp,
        read: false,
      }
      
      if (paymentProofUrl) {
        messageData.paymentProof = paymentProofUrl
      }
      
      if (service) {
        messageData.serviceId = service.id
        messageData.serviceTitle = service.title
      }
      
      await addDoc(collection(db, "messages"), messageData)

      // Create notification for provider
      const notificationData: any = {
        userId: provider.id,
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
      
      if (service) {
        notificationData.data.serviceId = service.id
        notificationData.data.serviceTitle = service.title
      }
      
      await addDoc(collection(db, "notifications"), notificationData)

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })

      // Close the modal instead of redirecting
      onClose()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Service Provider</DialogTitle>
          <DialogDescription>
            Send a message to inquire about this service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          {/* Provider info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={provider.avatar || provider.profilePicture || "/placeholder.svg?height=48&width=48"} 
                alt={provider.name} 
              />
              <AvatarFallback>{provider.name?.[0] || "P"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{provider.name}</h3>
              {provider.title && <p className="text-sm text-muted-foreground">{provider.title}</p>}
            </div>
          </div>
          
          {/* Service info if available */}
          {service && (
            <div className="rounded-md border overflow-hidden bg-muted/10">
              <div className="p-3 flex flex-col sm:flex-row gap-3">
                {service.image && (
                  <div className="sm:w-1/4">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="h-full w-full object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.jpg"
                        e.currentTarget.onerror = null
                      }}
                    />
                  </div>
                )}
                <div className="sm:w-3/4">
                  <h3 className="font-medium">{service.title}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                  )}
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
          )}

          {/* Message form */}
          <form onSubmit={handleSendMessage}>
            <div className="space-y-4">
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                disabled={isSending}
              />
              
              {paymentProofUrl && (
                <div className="relative">
                  <p className="text-sm font-medium mb-2">Payment Proof:</p>
                  <img 
                    src={paymentProofUrl} 
                    alt="Payment Proof" 
                    className="max-h-40 rounded-md border" 
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2" 
                    onClick={() => setPaymentProofUrl(null)}
                    disabled={isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div>
                  <input
                    type="file"
                    id="payment-proof"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handlePaymentProofUpload(file)
                      }
                    }}
                    disabled={isSending || isUploading}
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('payment-proof')?.click()}
                    disabled={isSending || isUploading}
                    className="flex items-center"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload Payment Proof'}
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={(!message.trim() && !paymentProofUrl) || authLoading || isSending || isUploading}
                  className="flex items-center"
                >
                  {isSending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 