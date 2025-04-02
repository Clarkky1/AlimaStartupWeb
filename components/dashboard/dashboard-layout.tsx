"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
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
import { Home, Settings, MessageSquare, Bell, Wallet, Menu, LogOut, User, LayoutDashboard, ListIcon } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  path: string
  icon: React.ReactElement
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
    path: "/dashboard/messages",
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
  const pathname = usePathname()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await logout()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Mobile Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-full flex-col">
                <div className="border-b p-4">
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <img src="/AlimaLOGO.svg" alt="Alima" className="h-8 w-auto" />
                    <span>Alima Dashboard</span>
                  </Link>
                </div>
                <ScrollArea className="flex-1 overflow-auto py-4">
                  <nav className="grid gap-1 px-2">
                    {navItems.map((item) => {
                      const isActive = pathname === item.path
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                          )}
                        >
                          {item.icon}
                          {item.title}
                        </Link>
                      )
                    })}
                  </nav>
                </ScrollArea>
                <div className="border-t p-4">
                  <div className="flex items-center gap-4 pb-4">
                    <Avatar>
                      <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || "User"} />
                      <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
            <img src="/AlimaLOGO.svg" alt="Alima" className="h-8 w-auto" />
          </Link>
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
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed hidden h-screen w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/AlimaLOGO.svg" alt="Alima" className="h-8 w-auto" />
            <span>Alima Dashboard</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex items-center gap-4 pb-4">
            <Avatar>
              <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || "User"} />
              <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
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
    </div>
  )
}
