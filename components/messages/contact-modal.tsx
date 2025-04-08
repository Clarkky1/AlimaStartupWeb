"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"
import { Send, AlertCircle, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc, query, where, getDocs, updateDoc, increment } from "firebase/firestore"
import { getFirestoreDB } from "@/app/lib/firebase"
import { initializeFirebase } from "@/app/lib/firebase"

interface ContactModalProps {
  providerId: string
  providerName: string
  providerAvatar: string
  serviceId?: string
  serviceTitle?: string
  serviceDescription?: string
  servicePrice?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  dialogName?: string
}

export function ContactModal({
  providerId,
  providerName,
  providerAvatar,
  serviceId,
  serviceTitle,
  serviceDescription,
  servicePrice,
  trigger,
  open,
  onOpenChange,
  dialogName = "default-contact-modal"
}: ContactModalProps) {
  const [message, setMessage] = useState("")
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const db = await getFirestoreDB()
        if (!db) throw new Error("Failed to initialize database")

        const servicesRef = collection(db, "services")
        const q = query(servicesRef, where("providerId", "==", providerId))
        const querySnapshot = await getDocs(q)
        
        const servicesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setServices(servicesData)
      } catch (error) {
        console.error("Error fetching services:", error)
        toast({
          title: "Error",
          description: "Failed to load services",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [providerId, toast])

  // Clear form when dialog is opened/closed
  useEffect(() => {
    if (!open) {
      setMessage("")
      setPaymentProofUrl(null)
    }
  }, [open])

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
        
        // Get current URL to redirect back after login
        const returnUrl = window.location.pathname + window.location.search;
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }
      return
    }

    // Prevent self-messaging
    if (user.uid === providerId) {
      toast({
        title: "Action not allowed",
        description: "You cannot message yourself",
        variant: "destructive",
      })
      onOpenChange?.(false)
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

      // Get user profile data first or create one if it doesn't exist
      let userDoc, userData, userName
      
      try {
        userDoc = await getDoc(doc(db, "users", user.uid))
        userData = userDoc.data() || {}
      } catch (error) {
        console.error("Error fetching user data:", error)
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || "User"
        }
        
        try {
          await setDoc(doc(db, "users", user.uid), userData, { merge: true })
        } catch (saveError) {
          console.error("Error saving user data:", saveError)
        }
      }
      
      userName = userData?.displayName || userData?.name || user.displayName || user.email?.split('@')[0] || "Anonymous"

      // Create conversation ID and participants array
      const participants = [user.uid, providerId].sort()
      const conversationId = participants.join('_')
      const timestamp = serverTimestamp()

      // Create/update conversation data
      const conversationData: any = {
        participants,
          participantIds: {
          [user.uid]: true,
          [providerId]: true
        },
        lastMessage: paymentProofUrl ? "Payment proof attached" : message,
        lastMessageTime: timestamp,
        lastSenderId: user.uid,
        lastSenderName: userName,
        lastSenderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      
      // Include provider data for easy access
      conversationData.providerName = providerName
      conversationData.providerAvatar = providerAvatar
      conversationData.providerId = providerId
      
      // Include user data for easy access
      conversationData.userName = userName
      conversationData.userAvatar = user.photoURL || userData?.profilePicture || userData?.avatar || null
      conversationData.userId = user.uid
      
      // Include service info if available
      if (serviceId && serviceTitle) {
        conversationData.serviceId = serviceId
        conversationData.serviceTitle = serviceTitle
        conversationData.servicePrice = servicePrice
      }
      
      // Create the conversation document with merge option to update if it exists
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
      
      if (serviceId && serviceTitle) {
        messageData.serviceId = serviceId
        messageData.serviceTitle = serviceTitle
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
      
      if (serviceId && serviceTitle) {
        notificationData.data.serviceId = serviceId
        notificationData.data.serviceTitle = serviceTitle
      }
      
      await addDoc(collection(db, "notifications"), notificationData)

      // Set success state
      setIsSending(false)
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })

      // Show confirmation or navigate directly to chat
      if (showConfirmation) {
        setShowConfirmation(false)
        onOpenChange?.(false)
        router.push(`/message/${providerId}`)
      } else {
        setShowConfirmation(true)
        setTimeout(() => {
          onOpenChange?.(false)
          router.push(`/message/${providerId}`)
        }, 2000)
      }

      return true; // Return true on success for the confirmation dialog handler
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      })
      setIsSending(false)
      return false; // Return false on error
    }
  }

  // Ensure each dialog has a unique ID to prevent conflicts
  const modalId = `contact-modal-${providerId}-${dialogName}`

  const dialogProps = open !== undefined ? { open, onOpenChange } : {}

  return (
    <Dialog {...dialogProps} key={modalId}>
      {trigger && <DialogTrigger asChild key={`trigger-${modalId}`}>{trigger}</DialogTrigger>}
      <DialogContent 
        className="sm:max-w-md z-50 max-h-[85vh] w-[95%] overflow-y-auto" 
        data-dialog-name={dialogName || modalId}
        key={`content-${modalId}`}
        onPointerDownOutside={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader key={`header-${modalId}`}>
          <DialogTitle key={`title-${modalId}`}>Contact Service Provider</DialogTitle>
          <DialogDescription key={`description-${modalId}`}>
            Service Provider
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 mb-4" key={`provider-info-${modalId}`}>
          <Avatar className="h-10 w-10" key={`avatar-${modalId}`}>
            <AvatarImage src={providerAvatar || "/person-male-1.svg"} alt={providerName} key={`avatar-img-${modalId}`} />
            <AvatarFallback key={`avatar-fallback-${modalId}`}>{providerName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div key={`provider-details-${modalId}`}>
            <h4 className="font-semibold" key={`provider-name-${modalId}`}>{providerName || "Service Provider"}</h4>
            <p className="text-sm text-muted-foreground" key={`provider-title-${modalId}`}>
              {user?.uid === providerId ? "Service Provider" : "Client"}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-4">
          <div className="flex flex-col space-y-1.5 p-4">
            <div className="text-xl font-semibold leading-none tracking-tight">About Provider</div>
          </div>
          <div className="p-4 pt-0">
            <div className="space-y-3">
              <div className="text-center mb-3">
                <span className="relative flex shrink-0 overflow-hidden rounded-full h-20 w-20 mx-auto">
                  <img className="aspect-square h-full w-full" alt={providerName} src={providerAvatar || "/person-male-1.svg"} />
                </span>
                <h3 className="font-semibold mt-2">{providerName}</h3>
              </div>
              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold mb-1">Bio</h4>
                <p className="text-sm text-muted-foreground">Wannabe</p>
              </div>
              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm break-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-mail h-4 w-4 flex-shrink-0 text-muted-foreground">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                    <span>clarkperez906@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-phone h-4 w-4 flex-shrink-0 text-muted-foreground">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>09106789795</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-map-pin h-4 w-4 flex-shrink-0 text-muted-foreground">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Cebu City </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-3" key={`form-${modalId}`}>
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] text-sm"
            key={`textarea-${modalId}`}
          />
          {paymentProofUrl && (
            <div className="relative">
              <p className="text-xs font-medium mb-1">Payment Proof:</p>
              <img 
                src={paymentProofUrl} 
                alt="Payment Proof" 
                className="max-h-32 rounded-md border" 
              />
              <Button 
                type="button"
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2" 
                onClick={() => setPaymentProofUrl(null)}
                disabled={isSending || isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2" key={`button-group-${modalId}`}>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" key={`cancel-button-${modalId}`} className="w-full sm:w-auto">Cancel</Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={() => {
                if (!user) {
                  // If not logged in, redirect to login with return URL
                  const returnUrl = window.location.pathname + window.location.search;
                  router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                  return;
                }
                // If logged in, show confirmation dialog
                setShowConfirmation(true);
              }}
              disabled={(!message.trim() && !paymentProofUrl) || authLoading || isSending || isUploading} 
              key={`send-button-${modalId}`}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isSending ? (
                <>
                  <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-3 w-3" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="w-[95%] max-w-[350px] p-4 sm:p-5">
            <DialogHeader className="space-y-1 sm:space-y-2 pb-2">
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Confirm Message
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to send this message to {providerName}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConfirmation(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={async (e) => {
                  if (!user) {
                    // If not logged in, redirect to login
                    const returnUrl = window.location.pathname + window.location.search;
                    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                    return;
                  }
                  
                  await handleSendMessage(e as React.FormEvent);
                  
                  // Explicitly navigate to the message page after sending
                  router.push(`/message/${providerId}`);
                }} 
                disabled={isSending}
                className="w-full sm:w-auto"
              >
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
