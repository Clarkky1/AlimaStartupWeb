"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Menu, Bell, LogOut, X, ArrowLeft } from "lucide-react"
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
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Add a global scrollToTop function to ensure it's accessible from anywhere
export function scrollToTopOfPage() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Global function for scroll prevention, accessible to any component
export function preventScrollEvent(e: React.MouseEvent | React.KeyboardEvent | MouseEvent) {
  if (e) {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();
  }
  return false;
}

export function Navbar({ showBackButton = false }: { showBackButton?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { messageCounts, notificationCounts } = useUnreadCounts(user?.uid)
  
  // Function to handle navigation to the home page
  const navigateToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (pathname === "/") {
      // If already on home page, just scroll to top
      scrollToTopOfPage();
    } else {
      // If on another page, use router for navigation
      router.push("/");
    }
  };
  
  const handleLogout = async () => {
    await logout()
    router.push("/")
  }
  
  // Function to fetch the most recent conversation and navigate to it
  const fetchRecentConversation = async () => {
    if (!user) return;
    
    try {
      const { db } = await initializeFirebase();
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        });
        return;
      }
      
      // Query to find the most recent conversation
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageTime", "desc"),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // No conversations found, show message
        toast({
          title: "No conversations",
          description: "You don't have any conversations yet.",
        });
        return;
      }
      
      // Get the other participant (not the current user)
      const conversationData = snapshot.docs[0].data();
      const otherUserId = conversationData.participants.find((id: string) => id !== user.uid);
      
      // Navigate to the conversation
      router.push(`/message/${otherUserId}`);
      
    } catch (error) {
      console.error("Error fetching recent conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load your conversations",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Apply for Services", href: "/services/apply" }
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
    // Handle root path specifically
    if (href === "/") {
      return pathname === "/";
    }

    // For other links, check for exact match or if pathname starts with href for nested routes (excluding hash links)
    if (href.includes('#')) {
      return false; // Do not highlight hash links based on pathname
    }

    // Special handling for services pages
    if (href === "/services") {
      return pathname === "/services" || pathname?.startsWith("/services/");
    }

    // For other pages, check exact match
    return pathname === href;
  }

  // Function to handle the logout button click in dropdown
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  // Dedicated handler for dropdown menu to prevent scrolling
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Make sure any scroll event doesn't propagate
    const root = document.documentElement;
    const scrollY = root.scrollTop;
    
    // Temporarily disable scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    
    // Re-enable scroll after dropdown action completes
    setTimeout(() => {
      document.body.style.position = '';
      document.body.style.top = '';
      root.scrollTop = scrollY;
    }, 10);
    
    return false;
  };

  return (
    <div className="sticky top-0 z-50 w-full py-6 px-4 md:px-0">
      <header className="mx-auto max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/5 text-foreground shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]">
        <div className="flex h-14 items-center justify-between px-6">
          {showBackButton && (
            <Button
              variant="outline"
              size="icon"
              className="mr-4 h-8 w-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-foreground/80" />
            </Button>
          )}
        {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center" 
              onClick={navigateToHome}
            >
              <img 
                src="/AlimaLOGO.svg" 
                alt="Alima Logo" 
                className="h-8 w-auto object-contain drop-shadow-[0_0_3px_rgba(59,130,246,0.3)]"
              />
              <span className="hidden md:block ml-2 text-xl font-bold text-foreground/90">Alima</span>
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
                    onClick={(e) => {
                      if (item.href === "/") {
                        navigateToHome(e);
                      } else if (item.href.startsWith('/#')) {
                        handleAnchorClick(e, item.href);
                      }
                    }}
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
                  <div 
                    className="relative dropdown-trigger" 
                    onClick={handleDropdownClick}
                    onMouseDown={preventScrollEvent}
                  >
                    <Button 
                      variant="ghost" 
                      className="h-10 w-10 rounded-full p-0 overflow-hidden"
                      onClick={preventScrollEvent}
                    >
                      <Avatar className="h-10 w-10 border border-white/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <AvatarImage
                          src={user.avatar || user.profilePicture || user.photoURL || '/default-avatar.png'}
                          alt="User avatar"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                    {(messageCounts > 0 || notificationCounts > 0) && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                        variant="destructive"
                      >
                        {messageCounts + notificationCounts}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="mt-1 bg-background/80 backdrop-blur-md border border-white/10"
                  onClick={preventScrollEvent} 
                  onMouseDown={preventScrollEvent}
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name || user.displayName}</span>
                      <span className="text-xs text-muted-foreground">{user.role || 'User'}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/pending-items')}>
                    Pending Connections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => user.role === "provider" ? router.push('/dashboard/notifications') : router.push('/notifications')} className="relative">
                    <span className="flex items-center">
                      Notifications
                      {notificationCounts > 0 && (
                        <Badge 
                          className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                          variant="destructive"
                        >
                          {notificationCounts}
                        </Badge>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/messages')}>
                    <span className="flex items-center">
                      Messages
                      {messageCounts > 0 && (
                        <Badge 
                          className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                          variant="destructive"
                        >
                          {messageCounts}
                        </Badge>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/payment-history')}>
                    Payment History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogoutClick} className="text-destructive">
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
                  className="hidden md:inline-flex text-sm font-medium text-foreground/80 hover:text-foreground/95 hover:bg-white/10"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  className="hidden md:inline-flex text-sm bg-primary/80 hover:bg-primary/90 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
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
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-x-0 top-[5.5rem] p-2 px-4 md:px-2 md:hidden z-50">
          <div className="w-full mx-auto max-w-md rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-white/20 dark:border-white/10 shadow-lg overflow-hidden">
            <div className="px-3 py-3 sm:px-4 sm:py-4">
              <nav className="flex flex-col space-y-1.5 sm:space-y-2">
                {navItems.map((item) => (
                    <Link
                    key={item.name}
                      href={item.href}
                    className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                        isActive(item.href)
                        ? "bg-white/15 text-foreground shadow-sm" 
                        : "text-foreground/90 hover:bg-white/10 hover:text-foreground"
                      }`}
                      onClick={(e) => {
                        if (item.href === "/") {
                          navigateToHome(e);
                          setIsMenuOpen(false);
                          return;
                        }
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
                  <div className="flex flex-col space-y-1.5 sm:space-y-2 pt-2 mt-1 border-t border-white/10 dark:border-white/5">
                    {user.role === "provider" && (
                      <Link
                        href="/dashboard"
                        className="text-sm font-medium px-3 py-2 rounded-lg transition-all text-foreground/90 hover:bg-white/10 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href={user.role === "provider" ? "/dashboard/notifications" : "/notifications"}
                      className="flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-all text-foreground/90 hover:bg-white/10 hover:text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center">
                        Notifications
                        {notificationCounts > 0 && (
                          <Badge 
                            className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white" 
                            variant="destructive"
                          >
                            {notificationCounts}
                          </Badge>
                        )}
                      </span>
                    </Link>
                    <Link
                      href={user.role === "provider" ? "/dashboard/chat" : "#"}
                      className="flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-all text-foreground/90 hover:bg-white/10 hover:text-foreground"
                      onClick={(e) => {
                        if (user.role !== "provider") {
                          e.preventDefault();
                          fetchRecentConversation();
                        }
                        setIsMenuOpen(false);
                      }}
                    >
                      <span className="flex items-center">
                        Messages
                        {messageCounts > 0 && (
                          <Badge 
                            className="ml-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white" 
                            variant="destructive"
                          >
                            {messageCounts}
                          </Badge>
                        )}
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 pt-2 mt-1 border-t border-white/10 dark:border-white/5">
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push('/login');
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-center bg-white/5 border-white/20 text-foreground hover:bg-white/10"
                    >
                      Log in
                    </Button>
                  <Button 
                    onClick={() => {
                        router.push('/signup');
                        setIsMenuOpen(false);
                    }}
                      className="w-full justify-center"
                  >
                      Sign up
                  </Button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowLogoutConfirm(false);
                handleLogout();
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}