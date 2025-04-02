"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, MessageSquare, Star, DollarSign, Info, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, writeBatch, Timestamp } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Notification {
  id: string
  type: "message" | "review" | "payment" | "system" | "payment_proof"
  title: string
  description: string
  timestamp: any
  read: boolean
  data?: {
    userId?: string
    serviceId?: string
    amount?: number
    paymentProofUrl?: string
    transactionId?: string
    conversationId?: string
    messageId?: string
    senderId?: string
    senderName?: string
    senderAvatar?: string
    messageText?: string
    type?: string
  }
}

export function NotificationCenter() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return

      try {
        const { db } = await initializeFirebase()
        if (!db) return

        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        )

        // Set up real-time listener for notifications
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          if (!isMounted.current) return
          
          const notifs: Notification[] = []
          
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data()
            
            // For messages and payment proofs, get sender details if not already included
            if ((data.type === 'message' || data.type === 'payment_proof') && 
                data.data?.senderId && 
                (!data.data.senderName || !data.data.senderAvatar)) {
              try {
                const senderDocRef = doc(db, "users", data.data.senderId)
                const senderDocSnap = await getDoc(senderDocRef)
                
                if (senderDocSnap.exists()) {
                  const senderData = senderDocSnap.data()
                  data.data.senderName = senderData.displayName || senderData.name || "Unknown User"
                  data.data.senderAvatar = senderData.profilePicture || senderData.avatar || null
                }
              } catch (error) {
                console.error("Error fetching sender data:", error)
              }
            }
            
            notifs.push({
              id: docSnap.id,
              type: data.type,
              title: data.title,
              description: data.description,
              timestamp: data.timestamp,
              read: data.read,
              data: data.data,
            })
          }
          
          if (isMounted.current) {
            setNotifications(notifs)
            setLoading(false)
          }
        }, (error) => {
          console.error("Error in notification snapshot:", error)
          if (isMounted.current) {
            setLoading(false)
            toast({
              title: "Error",
              description: "Failed to load notifications",
              variant: "destructive",
            })
          }
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching notifications:", error)
        if (isMounted.current) {
          toast({
            title: "Error",
            description: "Failed to load notifications",
            variant: "destructive",
          })
          setLoading(false)
        }
      }
    }

    fetchNotifications()
  }, [user, toast])

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return ""
    
    let date: Date
    try {
      if (timestamp instanceof Date) {
        date = timestamp
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate()
      } else {
        return ""
      }
      
      // Validate that date is valid
      if (isNaN(date.getTime())) {
        return ""
      }
      
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffMinutes < 1) return "Just now"
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' })
      return date.toLocaleDateString()
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { db } = await initializeFirebase()
      if (!db) return

      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter(n => !n.read)

      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, { read: true })
      })

      await batch.commit()

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return

    try {
      // Mark as read if not already
      if (!notification.read) {
        const { db } = await initializeFirebase()
        if (!db) return

        const notificationRef = doc(db, "notifications", notification.id)
        await updateDoc(notificationRef, { read: true })

        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        )
      }

      // Handle navigation based on notification type
      if (notification.type === "message" && notification.data?.conversationId) {
        const otherUserId = notification.data.senderId
        if (otherUserId) {
          router.push(`/message/${otherUserId}`)
        }
      } else if (notification.type === "payment_proof" && notification.data?.conversationId) {
        const otherUserId = notification.data.senderId
        if (otherUserId) {
          router.push(`/message/${otherUserId}`)
        }
      } else if (notification.type === "review" && notification.data?.serviceId) {
        router.push(`/services/${notification.data.serviceId}`)
      }
    } catch (error) {
      console.error("Error handling notification click:", error)
      toast({
        title: "Error",
        description: "Failed to handle notification",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'review':
        return <Star className="h-4 w-4" />
      case 'payment':
      case 'payment_proof':
        return <DollarSign className="h-4 w-4" />
      case 'system':
        return <Bell className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  const hasUnread = notifications.some(notification => !notification.read)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
          <TabsTrigger value="payment_proof">Payments</TabsTrigger>
          <TabsTrigger value="review">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[72px] w-full" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border bg-muted/50">
              <p className="text-center text-muted-foreground">
                No notifications to display
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex cursor-pointer items-start gap-4 p-4 hover:bg-muted ${
                    !notification.read ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-2 rounded-full ${
                    !notification.read ? 'bg-primary/20 text-primary' : 'bg-muted'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className={`font-medium leading-none ${!notification.read ? "font-semibold text-primary" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <div className="flex justify-end">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
