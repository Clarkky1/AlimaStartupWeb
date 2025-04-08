import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, isToday, isYesterday } from 'date-fns'
import { Circle } from 'lucide-react'

interface MessageListProps {
  conversations: any[]
  userId: string
  emptyMessage?: string
}

export default function MessageList({ conversations, userId, emptyMessage = "No messages found" }: MessageListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    )
  }

  // Function to format timestamp
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) {
      return ''
    }
    
    const date = timestamp.toDate()
    
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="flex flex-col divide-y">
        {conversations.map((conversation) => {
          const isUnread = conversation.unread?.[userId] > 0
          const otherUserId = conversation.participants.find((id: string) => id !== userId)
          const messagePreview = conversation.lastMessage || "No messages yet"
          
          // Get other user's name and avatar from the conversation data
          let otherUserName = 'Unknown User'
          let otherUserAvatar = '/placeholder-user.jpg'
          
          // Try to find the other user's profile from different possible fields
          if (conversation.participantsInfo && conversation.participantsInfo[otherUserId]) {
            const otherUserInfo = conversation.participantsInfo[otherUserId]
            otherUserName = otherUserInfo.name || otherUserInfo.displayName || 'Unknown User'
            otherUserAvatar = otherUserInfo.profilePicture || otherUserInfo.avatar || '/placeholder-user.jpg'
          } else if (conversation.participantProfiles && conversation.participantProfiles[otherUserId]) {
            const otherUserInfo = conversation.participantProfiles[otherUserId]
            otherUserName = otherUserInfo.name || otherUserInfo.displayName || 'Unknown User'
            otherUserAvatar = otherUserInfo.profilePicture || otherUserInfo.avatar || '/placeholder-user.jpg'
          } else if (conversation.otherUserInfo) {
            otherUserName = conversation.otherUserInfo.name || conversation.otherUserInfo.displayName || 'Unknown User'
            otherUserAvatar = conversation.otherUserInfo.profilePicture || conversation.otherUserInfo.avatar || '/placeholder-user.jpg'
          } else if (otherUserId === conversation.providerId && conversation.providerName) {
            otherUserName = conversation.providerName
            otherUserAvatar = conversation.providerAvatar || '/placeholder-user.jpg'
          } else if (otherUserId !== userId && conversation.lastSenderId === otherUserId) {
            // If all else fails, use the last sender's info if they are the other user
            otherUserName = conversation.lastSenderName || 'Unknown User'
            otherUserAvatar = conversation.lastSenderAvatar || '/placeholder-user.jpg'
          }
          
          return (
            <Link 
              key={conversation.id} 
              href={`/dashboard/chat/${otherUserId}`}
              className="block hover:bg-muted/50 transition-colors"
            >
              <div className="p-3 sm:p-4 flex items-center gap-3 relative">
                {/* Avatar */}
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarImage 
                    src={otherUserAvatar} 
                    alt={otherUserName} 
                  />
                  <AvatarFallback>
                    {otherUserName[0]}
                  </AvatarFallback>
                </Avatar>
                
                {/* Message preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <h3 className={`font-medium text-sm sm:text-base truncate ${isUnread ? 'font-semibold' : ''}`}>
                      {otherUserName}
                    </h3>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      {formatMessageTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-xs sm:text-sm text-muted-foreground truncate ${isUnread ? 'text-foreground font-medium' : ''}`}>
                      {messagePreview}
                    </p>
                    
                    {isUnread && (
                      <Badge className="ml-2 h-5 w-5 text-[10px] rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground flex-shrink-0">
                        {conversation.unread?.[userId] > 9 ? '9+' : conversation.unread?.[userId]}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Service info if available */}
                  {conversation.serviceTitle && (
                    <div className="mt-1 bg-primary/5 text-[10px] sm:text-xs rounded-sm py-1 px-2 inline-block max-w-full truncate">
                      <span className="font-medium">{conversation.serviceTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )
} 