"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@/app/types/user"
import { getDefaultAvatar, createImageErrorHandler } from "@/app/lib/avatar-utils"

interface UserAvatarProps {
  user: Partial<User>
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function UserAvatar({ user, className = "", size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }
  
  // Get consistent default avatar based on user ID
  const defaultAvatar = user?.uid ? getDefaultAvatar(user.uid) : "/illustrations/person-default.svg"
  
  // Get initials for the fallback
  const initials = user?.name 
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() 
    : "U"

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={user?.avatar || defaultAvatar} 
        alt={user?.name || "User"} 
        onError={user?.uid ? createImageErrorHandler(user.uid) : undefined}
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
