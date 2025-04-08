"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Bell, LogOut } from "lucide-react"
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

// Import Firebase directly at the top level
import { initializeFirebase } from "@/app/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore"

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
        
        // Use the imported initializeFirebase function
        const { db } = await initializeFirebase();
        if (!db) {
          console.error("Firebase DB not initialized");
          setIsLoading(false);
          return;
        }
        
        // Use the imported Firebase functions directly
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
        }, (error) => {
          // Handle any errors in the snapshot listener
          console.error("Error in notification snapshot:", error);
          setIsLoading(false);
        });
        
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
      }
    };
    
    // Use a more reliable approach for initialization
    if (user) {
      fetchNotifications();
    }
    
    // Clean up the listener when component unmounts
    return () => {
      try {
        if (unsubscribe) {
          unsubscribe();
        }
      } catch (e) {
        console.error("Error unsubscribing from notifications:", e);
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
      // Use the imported initializeFirebase function
      const { db } = await initializeFirebase();
      if (!db) {
        console.error("Firebase DB not initialized");
        return;
      }
      
      // Use the imported updateDoc directly
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
    { name: "About", href: "/about" },
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
                      <div className="p-4 flex justify-center items-center h-[300px]">
                        <style jsx>{`
                          /* From Uiverse.io by vinodjangid07 */ 
                          .loader {
                            width: fit-content;
                            height: fit-content;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                          }

                          .truckWrapper {
                            width: 150px;
                            height: 80px;
                            display: flex;
                            flex-direction: column;
                            position: relative;
                            align-items: center;
                            justify-content: flex-end;
                            overflow-x: hidden;
                          }
                          /* truck upper body */
                          .truckBody {
                            width: 100px;
                            height: fit-content;
                            margin-bottom: 6px;
                            animation: motion 1s linear infinite;
                          }
                          /* truck suspension animation*/
                          @keyframes motion {
                            0% {
                              transform: translateY(0px);
                            }
                            50% {
                              transform: translateY(3px);
                            }
                            100% {
                              transform: translateY(0px);
                            }
                          }
                          /* truck's tires */
                          .truckTires {
                            width: 100px;
                            height: fit-content;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 0px 10px 0px 15px;
                            position: absolute;
                            bottom: 0;
                          }
                          .truckTires svg {
                            width: 20px;
                          }

                          .road {
                            width: 100%;
                            height: 1.5px;
                            background-color: #282828;
                            position: relative;
                            bottom: 0;
                            align-self: flex-end;
                            border-radius: 3px;
                          }
                          .road::before {
                            content: "";
                            position: absolute;
                            width: 20px;
                            height: 100%;
                            background-color: #282828;
                            right: -50%;
                            border-radius: 3px;
                            animation: roadAnimation 1.4s linear infinite;
                            border-left: 10px solid white;
                          }
                          .road::after {
                            content: "";
                            position: absolute;
                            width: 10px;
                            height: 100%;
                            background-color: #282828;
                            right: -65%;
                            border-radius: 3px;
                            animation: roadAnimation 1.4s linear infinite;
                            border-left: 4px solid white;
                          }

                          .lampPost {
                            position: absolute;
                            bottom: 0;
                            right: -90%;
                            height: 70px;
                            animation: roadAnimation 1.4s linear infinite;
                          }

                          @keyframes roadAnimation {
                            0% {
                              transform: translateX(0px);
                            }
                            100% {
                              transform: translateX(-350px);
                            }
                          }
                        `}</style>

                        <div className="loader">
                          <div className="truckWrapper">
                            <div className="truckBody">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 198 93"
                                className="trucksvg"
                              >
                                <path
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#F83D3D"
                                  d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
                                ></path>
                                <path
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#7D7C7C"
                                  d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
                                ></path>
                                <path
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#282828"
                                  d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
                                ></path>
                                <rect
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#FFFCAB"
                                  rx="1"
                                  height="7"
                                  width="5"
                                  y="63"
                                  x="187"
                                ></rect>
                                <rect
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#282828"
                                  rx="1"
                                  height="11"
                                  width="4"
                                  y="81"
                                  x="193"
                                ></rect>
                                <rect
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#DFDFDF"
                                  rx="2.5"
                                  height="90"
                                  width="121"
                                  y="1.5"
                                  x="6.5"
                                ></rect>
                                <rect
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#DFDFDF"
                                  rx="2"
                                  height="4"
                                  width="6"
                                  y="84"
                                  x="1"
                                ></rect>
                              </svg>
                            </div>
                            <div className="truckTires">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 30 30"
                                className="tiresvg"
                              >
                                <circle
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#282828"
                                  r="13.5"
                                  cy="15"
                                  cx="15"
                                ></circle>
                                <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                              </svg>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 30 30"
                                className="tiresvg"
                              >
                                <circle
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#282828"
                                  r="13.5"
                                  cy="15"
                                  cx="15"
                                ></circle>
                                <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                              </svg>
                            </div>
                            <div className="road"></div>

                            <svg
                              xmlSpace="preserve"
                              viewBox="0 0 453.459 453.459"
                              xmlns="http://www.w3.org/2000/svg"
                              id="Capa_1"
                              version="1.1"
                              fill="#000000"
                              className="lampPost"
                            >
                              <path
                                d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993
                                c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514
                                c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16
                                c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914
                                h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75
                                v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795
                                V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z
                                M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017
                                h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
                              ></path>
                            </svg>
                          </div>
                        </div>
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative overflow-hidden p-0 h-10 w-10 rounded-full border-0">
                      <img 
                        src={user.profilePicture || user.avatar || "/person-male-1.svg"} 
                        alt={user.displayName || user.name || "User"} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.displayName || user.name || "Account"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <Button 
                  variant="outline"
                  onClick={() => {
                    router.push("/profile")
                    setIsMenuOpen(false)
                  }}
                >
                  Profile
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
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
