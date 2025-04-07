import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { MessageCircle, Bell, Link, LogOut, AlertCircle } from "lucide-react"
import { usePathname } from 'next/navigation'
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
  
  // Safely handle pathname using try-catch to prevent React hook errors
  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch (error) {
    console.error("Error getting pathname:", error);
    // Fallback to window.location if available
    pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  }
  
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
      href: "/dashboard/messages",
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out from your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowSignOutDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleSignOut}
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