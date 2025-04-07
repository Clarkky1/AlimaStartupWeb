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

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [selectedTab, setSelectedTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchConversations = async () => {
      if (authLoading || !isClient) return

      // Redirect if not authenticated
      if (!user) {
        router.push("/login")
        return
      }

      try {
        setLoading(true)
        const { db } = await initializeFirebase()
        
        // Check if db is null before proceeding
        if (!db) {
          console.error("Database not initialized")
          setLoading(false)
          return
        }
        
        const { collection, query, where, onSnapshot, orderBy } = await import("firebase/firestore")

        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTime", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const conversationData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setConversations(conversationData)
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching conversations:", error)
        setLoading(false)
      }
    }

    fetchConversations()
  }, [user, authLoading, router, isClient])

  // Only execute client-side code
  if (!isClient) {
    return <DashboardLayout>
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </DashboardLayout>
  }

  // Filter conversations based on search query and selected tab
  const filteredConversations = conversations.filter((conversation) => {
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        conversation.lastSenderName?.toLowerCase().includes(searchLower) ||
        conversation.lastMessage?.toLowerCase().includes(searchLower)
      )
    }

    // Apply tab filter
    if (selectedTab === "unread" && user?.uid) {
      return conversation.unread?.[user.uid] > 0
    }

    return true
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="border-b px-2 sm:px-4 py-2 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled>
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold">Messages</h1>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-[260px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-9 h-9 text-xs sm:text-sm w-full"
                  disabled
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" disabled>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-b px-2 sm:px-4 py-1 pb-2">
            <div className="grid w-full grid-cols-2 h-10 bg-muted rounded-md p-1 mb-2">
              <div className="flex items-center justify-center">
                <div className="h-4 w-24 bg-muted-foreground/20 rounded-md animate-pulse"></div>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-4 w-24 bg-muted-foreground/20 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 divide-y">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-3 sm:p-4 flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted-foreground/20 animate-pulse"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="h-4 w-32 bg-muted-foreground/20 rounded-md animate-pulse"></div>
                    <div className="h-3 w-10 bg-muted-foreground/20 rounded-md animate-pulse"></div>
                  </div>
                  <div className="h-3 w-full bg-muted-foreground/10 rounded-md animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
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
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9 h-9 text-xs sm:text-sm w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col" onValueChange={setSelectedTab}>
          <div className="border-b px-2 sm:px-4 py-1 pb-2">
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 mb-2">
              <TabsTrigger value="all" className="text-xs sm:text-sm flex items-center justify-center">All Messages</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs sm:text-sm flex items-center justify-center">
                <Circle className="mr-1 h-2 w-2 fill-current text-red-500" />
                Unread
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="flex-1 p-0 pb-16 m-0">
            <MessageList 
              conversations={filteredConversations} 
              userId={user?.uid || ""} 
              emptyMessage="No messages found."
            />
          </TabsContent>
          
          <TabsContent value="unread" className="flex-1 p-0 pb-16 m-0">
            <MessageList 
              conversations={filteredConversations} 
              userId={user?.uid || ""} 
              emptyMessage="No unread messages."
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}


