"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Home, Settings, MessageSquare, Bell, Wallet, Menu, LogOut, User, LayoutDashboard, ListIcon, X } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  path: string
  icon: React.ReactElement
  badge?: number
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    title: "Services",
    path: "/dashboard/services",
    icon: <ListIcon className="h-5 w-5" />
  },
  {
    title: "Messages",
    path: "/dashboard/chat",
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    title: "Notifications", 
    path: "/dashboard/notifications",
    icon: <Bell className="h-5 w-5" />
  },
  {
    title: "Settings",
    path: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />
  }
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState<string>("")
  
  // Remove direct usePathname usage and ensure all pathname handling is client-side
  const [pathname, setPathname] = useState<string>('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSignoutDialogOpen, setIsSignoutDialogOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { messageCounts, notificationCounts } = useUnreadCounts(user?.uid)

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
    // Only access pathname on the client side
    try {
      const path = window.location.pathname
      setPathname(path)
      setCurrentPath(path)
    } catch (e) {
      console.error("Path detection error:", e);
    }
  }, [])

  // Update pathname when route changes
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const handleRouteChange = () => {
        const path = window.location.pathname
        setPathname(path)
        setCurrentPath(path)
      }
      
      window.addEventListener('popstate', handleRouteChange)

      // Force content refresh when paths don't match
      if (pathname !== window.location.pathname) {
        handleRouteChange()
      }
      
      // Handle navigation from Link components
      const handleClick = () => {
        setTimeout(() => {
          if (pathname !== window.location.pathname) {
            handleRouteChange()
            // Force re-render of children components
            router.refresh()
          }
        }, 0)
      }
      
      // Add click event listener to all Next.js Link components
      const linkElements = document.querySelectorAll('a[href^="/"]')
      linkElements.forEach(link => {
        link.addEventListener('click', handleClick)
      })
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange)
        linkElements.forEach(link => {
          link.removeEventListener('click', handleClick)
        })
      }
    }
  }, [isClient, pathname, router])

  // Add badge counts to the navItems
  const navItemsWithCounts = navItems.map(item => {
    if (item.title === "Messages") {
      return { ...item, badge: messageCounts > 0 ? messageCounts : undefined };
    }
    if (item.title === "Notifications") {
      return { ...item, badge: notificationCounts > 0 ? notificationCounts : undefined };
    }
    return item;
  });

  const handleSignOut = async () => {
    setIsSignoutDialogOpen(true)
  }

  const confirmSignOut = async () => {
    await logout()
    router.push("/")
  }

  // Render a minimal layout until client-side code is running
  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Mobile Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 md:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 border-0">
              <div className="flex h-full flex-col bg-[rgba(255,255,255,0.9)] backdrop-blur-xl dark:bg-[rgba(20,20,24,0.85)]">
                <div className="p-6 relative overflow-hidden">
                  {/* Premium gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-white/90 to-gray-50/80 dark:from-gray-900/60 dark:via-gray-800/60 dark:to-gray-900/60">
                  </div>
                  
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-5 mix-blend-overlay" 
                       style={{ 
                         backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h40v40H0z\" fill=\"none\"%3E%3C/path%3E%3Cpath d=\"M0 20h40M20 0v40\" stroke=\"%23000\" stroke-opacity=\".1\" stroke-width=\".5\"%3E%3C/path%3E%3C/svg%3E')",
                         backgroundSize: "40px 40px" 
                       }}>
                  </div>
                  
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 font-semibold relative z-10"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      // Navigate directly to home page
                      window.location.href = "/";
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-sm">
                      <img src="/AlimaLOGO.svg" alt="Alima" className="h-6 w-auto" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-gray-900 dark:text-white tracking-tight">Alima</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">Dashboard</span>
                    </div>
                  </Link>
                </div>
                
                <ScrollArea className="flex-1 px-3 pt-3">
                  <div className="mb-2 px-3 py-1">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide letter-spacing-wide">Menu</h3>
                  </div>
                  <nav className="grid gap-1">
                    {navItemsWithCounts.map((item) => {
                      const isActive = currentPath === item.path
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive 
                              ? "bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/70 text-gray-900 dark:text-white shadow-sm" 
                              : "text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/40"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isActive 
                              ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400" 
                              : "bg-gray-100/80 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400"
                          )}>
                            {item.icon}
                          </div>
                          <span className="font-normal">{item.title}</span>
                          {item.badge && (
                            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                              {item.badge}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                  
                  <div className="mt-6 mb-2 px-3 py-1">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide letter-spacing-wide">Account</h3>
                  </div>
                  
                  <div className="px-3 pb-4">
                    <div className="rounded-2xl bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/40 dark:to-gray-900/40 backdrop-blur-sm p-3 shadow-sm border border-gray-100/80 dark:border-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-full ring-2 ring-white/90 dark:ring-gray-800 shadow-sm">
                          <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || "User"} />
                          <AvatarFallback className="rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-700">{user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="border-t border-gray-200/50 dark:border-gray-800/40 p-4">
                  <Button 
                    variant="destructive" 
                    className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm transition-all duration-200" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">
              {user?.name || "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuItem disabled className="opacity-50 truncate">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed hidden h-screen w-64 flex-col border-r border-gray-200/70 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md md:flex">
        <div className="flex h-16 items-center border-b border-gray-200/70 dark:border-gray-800/50 px-6">
          <Link 
            href="/" 
            className="flex items-center gap-3 font-medium"
            onClick={(e) => {
              e.preventDefault();
              // Force a hard navigation to home page
              window.location.href = "/";
            }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-sm">
              <img src="/AlimaLOGO.svg" alt="Alima" className="h-5 w-auto" />
            </div>
            <span className="tracking-tight text-gray-900 dark:text-white">Alima Dashboard</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-6">
          <div className="mb-2 px-6 py-1">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Menu</h3>
          </div>
          <nav className="grid gap-1 px-3">
            {navItemsWithCounts.map((item) => {
              const isActive = currentPath === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                    isActive 
                      ? "bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/70 font-medium text-gray-900 dark:text-white shadow-sm" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/40 font-normal"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isActive 
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400" 
                      : "bg-gray-100/80 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400"
                  )}>
                    {item.icon}
                  </div>
                  {item.title}
                  {item.badge && (
                    <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                      {item.badge}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-gray-200/70 dark:border-gray-800/50 p-4 mx-3 mb-3">
          <div className="flex items-center gap-3 p-2 mb-4 rounded-xl bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/40 dark:to-gray-900/40 backdrop-blur-sm shadow-sm border border-gray-100/80 dark:border-gray-800/50">
            <Avatar className="h-9 w-9 rounded-full ring-2 ring-white/90 dark:ring-gray-800 shadow-sm">
              <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || "User"} />
              <AvatarFallback className="rounded-full bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-700">{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="destructive" className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm transition-all duration-200" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        <div className="container mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      <Dialog open={isSignoutDialogOpen} onOpenChange={setIsSignoutDialogOpen}>
        <DialogContent className="w-[95%] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Confirm Sign Out</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to sign out? This will end your current session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsSignoutDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmSignOut}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
