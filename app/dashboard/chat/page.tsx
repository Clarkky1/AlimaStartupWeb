"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, MessageCircle, Circle, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import MessageList from "@/components/messages/message-list"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MessageCenter } from "@/components/dashboard/message-center"

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Only execute client-side code
  if (!isClient) {
    return <DashboardLayout>
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="border-b px-2 sm:px-4 py-2 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold">Messages</h1>
          </div>
        </div>
        
        <div className="flex-1">
          <MessageCenter />
        </div>
      </div>
    </DashboardLayout>
  )
} 