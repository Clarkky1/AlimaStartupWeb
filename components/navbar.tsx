"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Menu, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Fetch unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const { db } = await initializeFirebase()
        if (!db) return

        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          where("read", "==", false)
        )

        // Set up a real-time listener for unread notifications
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          setUnreadCount(querySnapshot.size)
        })

        // Clean up the listener when component unmounts
        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching unread notifications:", error)
      }
    }

    fetchUnreadCount()
  }, [user])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Popular Today", href: "/popular-today" },
  ]
  
  // Handle smooth scrolling for anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only handle anchor links on the same page
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Close mobile menu if open
        if (isMenuOpen) setIsMenuOpen(false);
        
        // Scroll to the target element
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  // Check if the current path matches the nav item (including partial matches for sub-routes)
  const isActive = (href: string) => {
    // Handle root path
    if (href === "/" && pathname === "/") return true;
    if (href === "/" && pathname !== "/") return false;
    
    // Don't highlight special navigation items like hash links
    if (href.includes('#')) return false;
    
    // Check if current path starts with the href (for nested routes)
    if (href !== "/" && pathname?.startsWith(href)) return true;
    
    return false;
  }

  return (
    <div className="sticky top-0 z-50 w-full py-6">
      <header className="mx-auto max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/5 text-foreground shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]">
        <div className="flex h-14 items-center justify-between px-6">
        {/* Logo */}
          <div className="flex-shrink-0">
        <Link href="/" className="flex items-center">
              <img 
                src="/AlimaLOGO.svg" 
                alt="Alima Logo" 
                className="h-8 w-auto object-contain drop-shadow-[0_0_3px_rgba(59,130,246,0.3)]"
              />
              <span className="ml-2 text-xl font-bold text-foreground/90">Alima</span>
        </Link>
          </div>

          {/* Center Nav Items */}
          <nav className="hidden md:flex justify-center flex-1">
            <ul className="flex space-x-10">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors relative px-1 py-1 ${
                      isActive(item.href) 
                        ? "text-primary drop-shadow-[0_0_3px_rgba(59,130,246,0.3)]" 
                        : "text-foreground/70 hover:text-foreground/90"
                    }`}
                    onClick={(e) => handleAnchorClick(e, item.href)}
                  >
                    {item.name}
                    {isActive(item.href) && (
                      <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden">
                    <Avatar className="h-10 w-10 border border-white/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                      <AvatarImage
                        src={user.avatar || user.profilePicture || user.photoURL || '/default-avatar.png'}
                        alt="User avatar"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                        variant="destructive"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-1 bg-background/80 backdrop-blur-md border border-white/10">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name || user.displayName}</span>
                      <span className="text-xs text-muted-foreground">{user.role || 'User'}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')} className="relative">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge 
                        className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white" 
                        variant="destructive"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                    Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/login')}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground/95 hover:bg-white/10"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  className="text-sm bg-primary/80 hover:bg-primary/90 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                >
                  Sign up
                </Button>
              </>
            )}

            {/* Mobile menu button - only show on smaller screens */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden mx-auto max-w-3xl mt-2 rounded-xl bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-[0_0_15px_rgba(38,100,245,0.05)] dark:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                  <Link
                  key={item.name}
                    href={item.href}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                      isActive(item.href)
                      ? "bg-white/10 text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]" 
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground/90"
                    }`}
                    onClick={(e) => {
                      handleAnchorClick(e, item.href);
                      if (!item.href.startsWith('/#')) {
                        setIsMenuOpen(false);
                      }
                    }}
                  >
                    {item.name}
                  </Link>
              ))}
              
              {user ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium px-4 py-2 rounded-lg transition-all text-foreground/70 hover:bg-white/5 hover:text-foreground/90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    className="flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-all text-foreground/70 hover:bg-white/5 hover:text-foreground/90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <Badge 
                        className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white" 
                        variant="destructive"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push('/login');
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-center border-white/10 text-foreground/80 hover:text-foreground/95"
                  >
                    Log in
                  </Button>
                <Button 
                  onClick={() => {
                      router.push('/signup');
                      setIsMenuOpen(false);
                  }}
                    className="w-full justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                >
                    Sign up
                </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}