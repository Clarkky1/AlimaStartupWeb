"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"

export default function UserNotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { notificationCounts } = useUnreadCounts(user?.uid)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Notifications</h1>
            {notificationCounts > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {notificationCounts} new
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Stay updated with your latest notifications and activity
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0 sm:p-6">
            <NotificationCenter userOnly={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 