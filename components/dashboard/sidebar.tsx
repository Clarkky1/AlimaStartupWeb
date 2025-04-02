import { useUnreadCounts } from "@/app/hooks/useUnreadCounts"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { MessageCircle, Bell, Link, LogOut } from "lucide-react"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { signOut, getAuth } from "firebase/auth"
// ...existing imports...
export function Sidebar() {
  const auth = getAuth();
  const { user } = useAuth()
  const { messageCounts, notificationCounts } = useUnreadCounts(user?.uid)
  const pathname = usePathname()
  
  const navigation = [
    // ...existing navigation items...
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: MessageCircle,
      badge: messageCounts > 0 ? messageCounts : undefined
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: notificationCounts > 0 ? notificationCounts : undefined
    },
    // ...other navigation items...
  ]

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
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
          {item.badge && (
            <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
      {/* ...existing code... */}
      <Button
        variant="destructive"  // Change this line to use destructive variant
        onClick={() => signOut(auth)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
      {/* ...existing code... */}
    </aside>
  )
}