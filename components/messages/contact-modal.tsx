// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Textarea } from "@/components/ui/textarea"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
// import { DialogClose } from "@radix-ui/react-dialog"
// import { Send } from "lucide-react"
// import { useToast } from "@/components/ui/use-toast"
// import { useAuth } from "@/app/context/auth-context"
// import { useRouter } from "next/navigation"
// import { initializeFirebase } from "@/app/lib/firebase"
// import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from "firebase/firestore"

// interface ContactModalProps {
//   providerId: string
//   providerName: string
//   providerAvatar: string
//   trigger?: React.ReactNode
//   open?: boolean
//   onOpenChange?: (open: boolean) => void
//   dialogName?: string
// }

//  function ContactModal({
//   providerId,
//   providerName,
//   providerAvatar,
//   trigger,
//   open,export
//   onOpenChange,
//   dialogName = "default-contact-modal"
// }: ContactModalProps) {
//   const [message, setMessage] = useState("")
//   const [isSending, setIsSending] = useState(false)
//   const { toast } = useToast()
//   const { user } = useAuth()
//   const router = useRouter()

//   const handleSendMessage = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!message.trim() || !user) {
//       if (!user) {
//         toast({
//           title: "Authentication required",
//           description: "Please log in to send messages",
//           variant: "destructive",
//         })
//         router.push("/login")
//       }
//       return
//     }

//     try {
//       setIsSending(true)
//       const { db } = await initializeFirebase()
//       if (!db) return

//       // Get user profile data first
//       const userDoc = await getDoc(doc(db, "users", user.uid))
//       const userData = userDoc.data() || {}
//       const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous"

//       // Log to confirm user data
//       console.log("User Data:", userData)

//       // Create consistent conversation ID and participants array
//       const participants = [user.uid, providerId].sort()
//       const conversationId = participants.join('_')
//       const timestamp = serverTimestamp()

//       // Log to confirm conversation ID
//       console.log("Conversation ID:", conversationId)

//       // Check if conversation exists
//       const conversationRef = doc(db, "conversations", conversationId)
//       const conversationSnap = await getDoc(conversationRef)

//       // Log if conversation exists or not
//       console.log("Conversation exists:", conversationSnap.exists())

//       // Create conversation with proper structure if it doesn't exist
//       if (!conversationSnap.exists()) {
//         await setDoc(conversationRef, {
//           id: conversationId,
//           participants: participants,
//           createdAt: timestamp,
//           updatedAt: timestamp,
//           lastMessage: message,
//           lastMessageTime: timestamp,
//           lastSenderId: user.uid,
//           lastSenderName: userName,
//           lastSenderAvatar: user.photoURL || userData?.profilePicture || null,
//           unread: {
//             [providerId]: 1
//           },
//           metadata: {
//             type: "client_provider",
//             status: "active"
//           }
//         })
//       }

//       // Add the message to Firestore
//       const messageRef = await addDoc(collection(db, "messages"), {
//         conversationId,
//         senderId: user.uid,
//         receiverId: providerId,
//         text: message,
//         timestamp,
//         senderName: userName,
//         senderAvatar: user.photoURL || userData?.profilePicture || null,
//         read: false,
//         createdAt: timestamp,
//         metadata: {
//           type: "client_message",
//           status: "sent"
//         }
//       })

//       // Create notification for provider
//       await addDoc(collection(db, "notifications"), {
//         userId: providerId,
//         type: "message",
//         title: "New Client Message",
//         description: `${userName} sent you a message: "${message.length > 50 ? message.substring(0, 50) + '...' : message}"`,
//         timestamp,
//         read: false,
//         data: {
//           conversationId,
//           messageId: messageRef.id,
//           senderId: user.uid,
//           senderName: userName,
//           senderAvatar: user.photoURL || userData?.profilePicture || null,
//           messageText: message,
//           type: 'client_inquiry'
//         }
//       })

//       toast({
//         title: "Message sent",
//         description: "Your message has been sent successfully"
//       })

//       setMessage("")

//       // After successful message send, redirect to messages page
//       router.push(`/message/${providerId}`)

//       if (onOpenChange) {
//         onOpenChange(false)
//       }
//     } catch (error) {
//       console.error("Error sending message:", error)
//       toast({
//         title: "Error",
//         description: error instanceof Error ? error.message : "Failed to send message",
//         variant: "destructive"
//       })
//     } finally {
//       setIsSending(false)
//     }
//   }

//   // Ensure each dialog has a unique ID to prevent conflicts
//   const modalId = `contact-modal-${providerId}-${dialogName}`

//   const dialogProps = open !== undefined ? { open, onOpenChange } : {}

//   return (
//     <Dialog {...dialogProps} key={modalId}>
//       {trigger && <DialogTrigger asChild key={`trigger-${modalId}`}>{trigger}</DialogTrigger>}
//       <DialogContent 
//         className="sm:max-w-md z-50" 
//         data-dialog-name={dialogName || modalId}
//         key={`content-${modalId}`}
//         onPointerDownOutside={(e) => {
//           e.stopPropagation();
//         }}
//       >
//         <DialogHeader key={`header-${modalId}`}>
//           <DialogTitle key={`title-${modalId}`}>Contact Service Provider</DialogTitle>
//           <DialogDescription key={`desc-${modalId}`}>
//             Send a message to this service provider to inquire about their services.
//           </DialogDescription>
//         </DialogHeader>
//         <div className="flex items-center gap-4 mb-4" key={`provider-info-${modalId}`}>
//           <Avatar className="h-10 w-10" key={`avatar-${modalId}`}>
//             <AvatarImage src={providerAvatar || "/person-male-1.svg"} alt={providerName} key={`avatar-img-${modalId}`} />
//             <AvatarFallback key={`avatar-fallback-${modalId}`}>{providerName?.charAt(0) || "P"}</AvatarFallback>
//           </Avatar>
//           <div key={`provider-details-${modalId}`}>
//             <h4 className="font-semibold" key={`provider-name-${modalId}`}>{providerName || "Service Provider"}</h4>
//             <p className="text-sm text-muted-foreground" key={`provider-title-${modalId}`}>Service Provider</p>
//           </div>
//         </div>
//         <form onSubmit={handleSendMessage} className="space-y-4" key={`form-${modalId}`}>
//           <Textarea
//             placeholder="Type your message here..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             className="min-h-[100px]"
//             key={`textarea-${modalId}`}
//           />
//           <div className="flex justify-end gap-2" key={`button-group-${modalId}`}>
//             <DialogClose asChild>
//               <Button type="button" variant="outline" key={`cancel-button-${modalId}`}>Cancel</Button>
//             </DialogClose>
//             <Button type="submit" disabled={!message.trim() || isSending} key={`send-button-${modalId}`}>
//               {isSending ? "Sending..." : "Send Message"}
//               <Send className="ml-2 h-4 w-4" key={`send-icon-${modalId}`} />
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"
import { Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { getFirestoreDB } from "@/app/lib/firebase" // Update import

interface ContactModalProps {
  providerId: string
  providerName: string
  providerAvatar: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  dialogName?: string
}

export function ContactModal({
  providerId,
  providerName,
  providerAvatar,
  trigger,
  open,
  onOpenChange,
  dialogName = "default-contact-modal"
}: ContactModalProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth() // Removed db from context since we now use getFirestoreDB
  const router = useRouter()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || !user) {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to send messages",
          variant: "destructive",
        })
        router.push("/login")
      }
      return
    }

    try {
      setIsSending(true)
      const db = getFirestoreDB() // Use the new getter

      if (!db || !user.uid) {
        toast({
          title: "Error",
          description: "Database connection failed",
          variant: "destructive"
        })
        return
      }

      // Get user profile data first
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data() || {}
      const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous"

      // Create consistent conversation ID and participants array
      const participants = [user.uid, providerId].sort()
      const conversationId = participants.join('_')
      const timestamp = serverTimestamp()

      // Check if conversation exists
      const conversationRef = doc(db, "conversations", conversationId)
      const conversationSnap = await getDoc(conversationRef)

      // Create conversation if it doesn't exist
      if (!conversationSnap.exists()) {
        await setDoc(conversationRef, {
          id: conversationId,
          participants: participants,
          createdAt: timestamp,
          updatedAt: timestamp,
          lastMessage: message,
          lastMessageTime: timestamp,
          lastSenderId: user.uid,
          lastSenderName: userName,
          lastSenderAvatar: user.photoURL || userData?.profilePicture || null,
          unread: {
            [providerId]: 1
          },
          metadata: {
            type: "client_provider",
            status: "active"
          }
        })
      }

      // Add the message to Firestore
      const messageRef = await addDoc(collection(db, "messages"), {
        conversationId,
        senderId: user.uid,
        receiverId: providerId,
        text: message,
        timestamp,
        senderName: userName,
        senderAvatar: user.photoURL || userData?.profilePicture || null,
        read: false,
        createdAt: timestamp,
        metadata: {
          type: "client_message",
          status: "sent"
        }
      })

      // Create notification for provider
      await addDoc(collection(db, "notifications"), {
        userId: providerId,
        type: "message",
        title: "New Client Message",
        description: `${userName} sent you a message: "${message.length > 50 ? message.substring(0, 50) + '...' : message}"`,
        timestamp,
        read: false,
        data: {
          conversationId,
          messageId: messageRef.id,
          senderId: user.uid,
          senderName: userName,
          senderAvatar: user.photoURL || userData?.profilePicture || null,
          messageText: message,
          type: 'client_inquiry'
        }
      })

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      })

      setMessage("")
      router.push(`/message/${providerId}`)
      if (onOpenChange) onOpenChange(false)

    } catch (error) {
      console.error("Full error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const modalId = `contact-modal-${providerId}-${dialogName}`
  const dialogProps = open !== undefined ? { open, onOpenChange } : {}

  return (
    <Dialog {...dialogProps} key={modalId}>
      {trigger && <DialogTrigger asChild key={`trigger-${modalId}`}>{trigger}</DialogTrigger>}
      <DialogContent 
        className="sm:max-w-md z-50" 
        data-dialog-name={dialogName || modalId}
        key={`content-${modalId}`}
        onPointerDownOutside={(e) => e.stopPropagation()}
      >
        <DialogHeader key={`header-${modalId}`}>
          <DialogTitle>Contact Service Provider</DialogTitle>
          <DialogDescription>
            Send a message to this service provider to inquire about their services.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={providerAvatar || "/person-male-1.svg"} alt={providerName} />
            <AvatarFallback>{providerName?.charAt(0) || "P"}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{providerName || "Service Provider"}</h4>
            <p className="text-sm text-muted-foreground">Service Provider</p>
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-4">
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!message.trim() || isSending}>
              {isSending ? "Sending..." : "Send Message"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
