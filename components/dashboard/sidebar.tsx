import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { MessageCircle, Bell, Link, LogOut, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut, getAuth } from "firebase/auth"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// ...existing imports...
export function Sidebar() {
  const auth = getAuth();
  const { user } = useAuth()
  const { messageCounts, notificationCounts } = useUnreadCounts(user?.uid)
  
  // Replace direct usePathname with a safe client-side alternative
  const [pathname, setPathname] = useState('')
  const [isClient, setIsClient] = useState(false)
  
  // Initialize pathname safely on client side
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
    }
  }, [])
  
  // Update pathname when route changes (client-side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const handleRouteChange = () => {
        setPathname(window.location.pathname)
      }
      
      window.addEventListener('popstate', handleRouteChange)
      return () => window.removeEventListener('popstate', handleRouteChange)
    }
  }, [isClient])
  
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [hasPulsedMessages, setHasPulsedMessages] = useState(false)
  const [hasPulsedNotifications, setHasPulsedNotifications] = useState(false)
  
  // Reset the pulse effect when counts change
  useEffect(() => {
    if (messageCounts > 0 && !hasPulsedMessages) {
      setHasPulsedMessages(true)
      setTimeout(() => setHasPulsedMessages(false), 2000)
    }
  }, [messageCounts])
  
  useEffect(() => {
    if (notificationCounts > 0 && !hasPulsedNotifications) {
      setHasPulsedNotifications(true)
      setTimeout(() => setHasPulsedNotifications(false), 2000)
    }
  }, [notificationCounts])

  const navigation = [
    // ...existing navigation items...
    {
      name: "Messages",
      href: "/dashboard/chat",
      icon: MessageCircle,
      badge: messageCounts > 0 ? messageCounts : undefined,
      hasPulsed: hasPulsedMessages
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: notificationCounts > 0 ? notificationCounts : undefined,
      hasPulsed: hasPulsedNotifications
    },
    // ...other navigation items...
  ]

  const handleSignOut = () => {
    signOut(auth)
  }

  return (
    <aside className="...">
      {/* ...existing code... */}
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
            pathname === item.href && "text-gray-900 dark:text-gray-50"
          )}
        >
          <item.icon className={cn("h-4 w-4", item.hasPulsed && "text-primary animate-pulse")} />
          <span>{item.name}</span>
          {item.badge && (
            <span className={cn(
              "ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground",
              item.hasPulsed && "animate-bounce"
            )}>
              {item.badge}
            </span>
          )}
        </Link>
      ))}
      {/* ...existing code... */}
      <Button
        variant="destructive"
        onClick={() => setShowSignOutDialog(true)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
      
      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="w-[95%] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to sign out from your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2 sm:mt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowSignOutDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ...existing code... */}
    </aside>
  )
}