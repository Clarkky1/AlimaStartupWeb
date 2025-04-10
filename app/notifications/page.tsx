"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check } from "lucide-react"
import { initializeFirebase } from "@/app/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

export default function UserNotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { notificationCounts, refreshCounts } = useUnreadCounts(user?.uid)
  const { toast } = useToast()
  const [markingAsRead, setMarkingAsRead] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleMarkAllAsRead = async () => {
    if (!user) return
    
    try {
      setMarkingAsRead(true)
      const { db } = await initializeFirebase()
      if (!db) throw new Error("Failed to initialize Firebase")
      
      const { collection, query, where, getDocs, writeBatch, doc } = await import("firebase/firestore")
      
      // Get all unread notifications for the user
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      )
      
      const snapshot = await getDocs(notificationsQuery)
      
      // Use a batch to update all notifications
      if (!snapshot.empty) {
        const batch = writeBatch(db)
        
        snapshot.docs.forEach((notification) => {
          batch.update(doc(db, "notifications", notification.id), {
            read: true
          })
        })
        
        await batch.commit()
        
        // Refresh the unread counts
        refreshCounts()
        
        toast({
          title: "Notifications cleared",
          description: `Marked ${snapshot.size} notifications as read`,
        })
      } else {
        toast({
          title: "No unread notifications",
          description: "You don't have any unread notifications",
        })
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="loader">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-full sm:max-w-4xl mx-auto py-6 sm:py-10 px-4 md:px-6">
      <div className="mx-auto">
        <div className="mb-4 sm:mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2 p-2" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Notifications</h1>
              {notificationCounts > 0 && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  {notificationCounts} new
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={notificationCounts === 0 || markingAsRead}
              className="flex items-center gap-1"
            >
              {markingAsRead ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Mark all as read</span>
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            Stay updated with your latest notifications and activity
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0 sm:p-6">
            <NotificationCenter userOnly={true} onNotificationRead={() => refreshCounts()} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 