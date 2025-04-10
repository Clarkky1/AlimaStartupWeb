import { useState, useEffect, useCallback } from 'react'
import { initializeFirebase } from '@/app/lib/firebase'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'

export function useUnreadCounts(userId: string | undefined) {
  const [messageCounts, setMessageCounts] = useState(0)
  const [notificationCounts, setNotificationCounts] = useState(0)

  const refreshCounts = useCallback(async () => {
    if (!userId) return
    
    try {
      const { db } = await initializeFirebase()
      if (!db) return
      
      // Query for unread messages
      const messagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId),
        where('read', '==', false)
      )
      
      // Query for unread notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )
      
      const messageSnapshot = await getDocs(messagesQuery)
      const notificationSnapshot = await getDocs(notificationsQuery)
      
      setMessageCounts(messageSnapshot.size)
      setNotificationCounts(notificationSnapshot.size)
    } catch (error) {
      console.error("Error refreshing unread counts:", error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const fetchCounts = async () => {
      const { db } = await initializeFirebase()
      if (!db) return

      // Query for unread messages
      const messagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId),
        where('read', '==', false)
      )

      // Query for unread notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )

      const messageUnsub = onSnapshot(messagesQuery, (snapshot) => {
        setMessageCounts(snapshot.size)
      })

      const notificationUnsub = onSnapshot(notificationsQuery, (snapshot) => {
        setNotificationCounts(snapshot.size)
      })

      return () => {
        messageUnsub()
        notificationUnsub()
      }
    }

    const unsubscribe = fetchCounts()
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub && unsub())
      }
    }
  }, [userId])

  return { messageCounts, notificationCounts, refreshCounts }
}
