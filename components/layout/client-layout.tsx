"use client"

import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Force a soft navigation when the pathname changes
    if (pathname) {
      router.refresh()
    }
  }, [pathname, router])

  return (
    <div key={pathname}>
      {children}
    </div>
  )
} 