"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeSwitcher } from "@/components/theme-switcher"

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  data?: {
    messageId?: string;
    conversationId?: string;
    senderId?: string;
    providerId?: string;
    serviceId?: string;
    [key: string]: any;
  };
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Fetch notifications when user is logged in
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Dynamic import of Firebase to prevent circular dependencies
        const { initializeFirebase } = await import("@/app/lib/firebase");
        const { db } = await initializeFirebase();
        if (!db) return;
        
        const { collection, query, where, orderBy, limit, onSnapshot } = await import("firebase/firestore");
        
        // Query for user's notifications
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        
        // Set up real-time listener
        unsubscribe = onSnapshot(q, (snapshot) => {
          const notificationsData: Notification[] = [];
          let unread = 0;
          
          snapshot.docs.forEach((doc) => {
            const data = doc.data() as Omit<Notification, "id">;
            
            if (!data.read) {
              unread++;
            }
            
            notificationsData.push({
              id: doc.id,
              ...data
            });
          });
          
          setNotifications(notificationsData);
          setUnreadCount(unread);
          setIsLoading(false);
        });
        
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
      }
    };
    
    // Delay fetching notifications to ensure components are fully loaded
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        fetchNotifications();
      }, 100);
    }
    
    // Clean up the listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;
    
    try {
      // Dynamic import of Firebase to prevent circular dependencies
      const { initializeFirebase } = await import("@/app/lib/firebase");
      const { db } = await initializeFirebase();
      if (!db) return;
      
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "notifications", notification.id), {
        read: true
      });
      
      // Navigate based on notification type
      if (notification.type === 'message' || notification.type === 'payment_confirmed') {
        // Navigate to the message page with the provider
        if (notification.data?.senderId) {
          router.push(`/message/${notification.data.senderId}`);
        } else if (notification.data?.providerId) {
          router.push(`/message/${notification.data.providerId}`);
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    let date: Date;
    try {
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        return "";
      }
      
      // Validate that date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffMins < 1440) {
        return `${Math.floor(diffMins / 60)}h ago`;
      } else {
        return `${Math.floor(diffMins / 1440)}d ago`;
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'payment_confirmed':
        return '💰';
      case 'payment_proof':
        return '🧾';
      default:
        return '🔔';
    }
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Popular Today", href: "/popular-today" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/AlimaLOGO.svg?height=32&width=32" alt="Logo" className="h-8 w-8" />
          <span className="ml-2 text-xl font-bold text-gray">Alima</span>
        </Link>

        {/* Nav Items */}
        <div className="flex items-center space-x-6">
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center justify-center text-sm font-medium px-6 py-2 transition-colors ${
                      pathname === item.href ? "text-black" : "text-gray-700 hover:text-primary"
                    }`}
                    style={{
                      height: "40px",
                      minWidth: "120px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "transparent",
                      borderRadius: "8px",
                      borderWidth: pathname === item.href ? "3px" : "0",
                      borderStyle: "solid",
                      borderImage: pathname === item.href ? "linear-gradient(to right, #00258E, #4EBF03) 1" : "none",
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Authentication Buttons */}
          <div className="hidden items-center space-x-4 md:flex">
            {/* Theme Switcher */}
            {/* <ThemeSwitcher /> */}
            
            {user ? (
              <>
                {/* Notification Bell */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white" 
                          variant="destructive"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="end">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {isLoading ? (
                      <div className="p-4 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      <ScrollArea className="h-80">
                        <div className="divide-y">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-4 cursor-pointer hover:bg-muted ${!notification.read ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`text-lg ${!notification.read ? 'text-primary' : ''}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <p className={`font-medium ${!notification.read ? 'font-bold text-primary' : ''}`}>
                                      {notification.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(notification.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {notification.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </PopoverContent>
                </Popover>

                {user.role === "provider" && (
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </Button>
                )}
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button
                  className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 transition rounded-lg"
                  onClick={() => router.push("/login")}
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="block md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="container mx-auto px-4 pb-4 md:hidden">
          <nav>
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`block text-sm font-medium px-3 py-1 rounded-lg transition-colors border-2 ${
                      pathname === item.href
                        ? "border-transparent bg-gradient-to-r from-[#00258E] to-[#4EBF03] bg-clip-border text-black"
                        : "border-gray-500 text-gray-700 hover:border-primary"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6 flex flex-col space-y-3">
            {/* Theme Switcher in mobile menu */}
            {/* <div className="flex justify-center mb-2">
              <ThemeSwitcher />
            </div> */}
            
            {user ? (
              <>
                {user.role === "provider" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/dashboard")
                      setIsMenuOpen(false)
                    }}
                  >
                    Dashboard
                  </Button>
                )}
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button
                  className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 transition rounded-lg"
                  onClick={() => {
                    router.push("/login")
                    setIsMenuOpen(false)
                  }}
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
