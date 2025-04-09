'use client'

import { usePathname } from 'next/navigation'
import { ChatButton } from './chat-button'

export function ChatButtonWrapper() {
  const pathname = usePathname()
  // Only show chat button on home page
  const isHomePage = pathname === '/'

  if (!isHomePage) return null
  
  return <ChatButton />
} 