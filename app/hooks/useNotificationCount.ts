import { useState, useEffect } from 'react'
import { initializeFirebase } from '@/app/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

export function useNotificationCount(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const fetchUnreadCount = async () => {
      const { db } = await initializeFirebase()
      if (!db) return

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )

      return onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size)
      })
    }

    const unsubscribe = fetchUnreadCount()
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub && unsub())
      }
    }
  }, [userId])

  return unreadCount
}
