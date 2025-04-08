"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import { Badge } from "../ui/badge"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { RatingModal } from "@/components/messages/rating-modal"

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
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
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const { db } = await initializeFirebase()
        if (!db) return

        const { collection, query, where, orderBy, limit, onSnapshot, getDocs, writeBatch, doc } = await import("firebase/firestore")
        
        // Query notifications for the current user, sorted by timestamp
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(20)
        )

        // Set up a real-time listener for notifications
        return onSnapshot(q, (querySnapshot) => {
          const notificationsData: any[] = []
          let count = 0

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            notificationsData.push({
              id: doc.id,
              ...data,
              // Format the timestamp for display
              timeFormatted: data.timestamp ? formatDistanceToNow(data.timestamp.toDate()) : '',
            })
            // Count unread notifications
            if (!data.read) count++
          })

          setNotifications(notificationsData)
          setUnreadCount(count)
        })
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    const unsubscribe = fetchNotifications()
    return () => {
      unsubscribe?.then(unsub => unsub && unsub())
    }
  }, [user])

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return ''
    
    const date = timestamp.toDate()
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const markAsRead = async (notification: any) => {
    if (!user || notification.read) return
    
    try {
      const { db } = await initializeFirebase()
      if (!db) return
      
      const { doc, updateDoc } = await import("firebase/firestore")
      await updateDoc(doc(db, "notifications", notification.id), {
        read: true
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return
    
    try {
      const { db } = await initializeFirebase()
      if (!db) return
      
      const { writeBatch, doc } = await import("firebase/firestore")
      const batch = writeBatch(db)
      
      // Find all unread notifications
      const unreadNotifications = notifications.filter(n => !n.read)
      
      // Update each notification in a batch
      unreadNotifications.forEach(notification => {
        batch.update(doc(db, "notifications", notification.id), {
          read: true
        })
      })
      
      // Commit the batch
      await batch.commit()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read first
    await markAsRead(notification)
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
      case 'payment_proof':
        if (notification.data?.conversationId) {
          // If we have sender info, go to the reply page
          if (notification.data?.senderId) {
            // Store conversation ID in sessionStorage so the messages page can load it
            sessionStorage.setItem('selectedConversationId', notification.data.conversationId);
            
            // Store additional helpful information
            if (notification.data.serviceId) {
              sessionStorage.setItem('selectedServiceId', notification.data.serviceId);
            }
            
            if (notification.data.senderName) {
              sessionStorage.setItem('senderName', notification.data.senderName);
            }
            
            if (notification.data.senderAvatar) {
              sessionStorage.setItem('senderAvatar', notification.data.senderAvatar);
            }
            
            // Set a flag to indicate we're coming from a notification
            sessionStorage.setItem('fromNotification', 'true');
            
            // Navigate to chat page
            router.push(`/dashboard/chat`);
          } else {
            router.push(`/dashboard/chat`)
          }
        }
        break
      case 'service_booked':
      case 'booking_confirmed':
      case 'booking_canceled':
        router.push('/dashboard/bookings')
        break
      case 'review':
        if (notification.data?.serviceId) {
          router.push(`/services/${notification.data.serviceId}`)
        }
        break
      case 'payment_confirmed':
        router.push('/dashboard/transactions')
        break
      case 'payment_confirmed_rating':
        // Show the rating dialog
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
        break
      default:
        router.push('/dashboard')
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬'
      case 'payment_proof':
        return '💳'
      case 'payment_confirmed':
        return '✅'
      case 'service_booked':
        return '📅'
      case 'booking_confirmed':
        return '👍'
      case 'booking_canceled':
        return '❌'
      case 'review':
        return '⭐'
      default:
        return '🔔'
    }
  }

  // Visual indicator that shows we have notifications
  const hasUnread = unreadCount > 0
  
  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-primary justify-center items-center text-[10px] text-white font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="end">
          <div className="flex justify-between items-center border-b p-3">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {hasUnread && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                Mark all as read
              </Button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-muted/20' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-medium text-sm">{notification.title}</h5>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.timeFormatted}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      
                      {/* Show additional context for messages */}
                      {(notification.type === 'message' || notification.type === 'payment_proof') && notification.data?.senderName && (
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={notification.data.senderAvatar || "/placeholder.svg?height=24&width=24"} />
                            <AvatarFallback>{notification.data.senderName[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="text-xs">
                            From: <span className="font-medium">{notification.data.senderName}</span>
                            {notification.data.serviceTitle && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                {notification.data.serviceTitle}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Show payment proof thumbnail */}
                      {notification.type === 'payment_proof' && notification.data?.paymentProofUrl && (
                        <div className="mt-2">
                          <img 
                            src={notification.data.paymentProofUrl} 
                            alt="Payment Proof" 
                            className="h-16 object-cover rounded-md border"
                          />
                        </div>
                      )}
                      
                      {!notification.read && (
                        <div className="mt-1">
                          <Badge variant="default" className="text-[10px]">New</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      
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