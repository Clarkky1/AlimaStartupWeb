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
import { formatDistanceToNow } from "date-fns"
import { RatingModal } from "@/components/messages/rating-modal"

interface Notification {
  id: string
  type: "message" | "review" | "payment" | "system" | "payment_proof" | "rating" | "payment_confirmed_rating"
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
    rating?: number
    feedback?: string
    providerId?: string
    providerName?: string
  }
}

interface NotificationCenterProps {
  userOnly?: boolean
}

export function NotificationCenter({ userOnly = false }: NotificationCenterProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  // Rating dialog state
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [ratingData, setRatingData] = useState<{
    providerId: string;
    providerName: string;
    serviceId: string;
  }>({
    providerId: '',
    providerName: '',
    serviceId: ''
  })

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
                  data.data.senderName = senderData.name || "Unknown User"
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
      } else if (notification.type === "rating" && notification.data?.serviceId) {
        router.push(`/services/${notification.data.serviceId}`)
      } else if (notification.type === "payment_confirmed_rating") {
        // Show the rating dialog for confirmed payments
        if (notification.data?.providerId && notification.data?.serviceId) {
          setRatingData({
            providerId: notification.data.providerId,
            providerName: notification.data.providerName || 'Service Provider',
            serviceId: notification.data.serviceId
          })
          setShowRatingDialog(true)
        } else {
          // Fallback to transaction page if missing data
          router.push('/dashboard/transactions')
        }
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
    if (userOnly && (notification.type === "payment_proof" || notification.type === "review" || notification.type === "rating")) {
      return false
    }
    return notification.type === activeTab
  })

  const hasUnread = notifications.some(notification => !notification.read)

  return (
    <>
      <div className="space-y-4 px-4 sm:px-0 py-4 sm:py-0">
        <div className="flex items-center justify-between">
          {!userOnly && (
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          )}
          {hasUnread && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className={userOnly ? "ml-auto" : ""}>
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {userOnly ? (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs sm:text-sm">Unread</TabsTrigger>
              <TabsTrigger value="message" className="text-xs sm:text-sm">Messages</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs sm:text-sm">Unread</TabsTrigger>
              <TabsTrigger value="message" className="text-xs sm:text-sm">Messages</TabsTrigger>
              <TabsTrigger value="payment_proof" className="text-xs sm:text-sm">Payments</TabsTrigger>
              <TabsTrigger value="review" className="text-xs sm:text-sm">Reviews</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 border-b last:border-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex items-start space-x-3 p-3 sm:p-4 border-b last:border-0 transition-colors ${
                    notification.read ? "bg-background" : "bg-accent/10"
                  } hover:bg-accent/20 cursor-pointer relative`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.read && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  )}
                  <div className="h-10 w-10 flex-shrink-0">
                    {notification.data?.senderAvatar ? (
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={notification.data.senderAvatar} alt={notification.data.senderName || ""} />
                        <AvatarFallback>
                          {notification.data.senderName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm leading-tight truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1.5 sm:block hidden" />
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No notifications to display</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Rating Dialog */}
      <RatingModal 
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        providerId={ratingData.providerId}
        providerName={ratingData.providerName}
        serviceId={ratingData.serviceId}
      />
    </>
  )
}
