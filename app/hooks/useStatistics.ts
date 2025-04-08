import { useState, useEffect } from 'react';
import { initializeFirebase, getFirebaseAuth } from '@/app/lib/firebase';
import { collection, getCountFromServer, query, where, or } from 'firebase/firestore';

export interface Statistics {
  userCount: number;
  serviceCount: number;
  providerCount: number;
  isLoading: boolean;
}

export function useStatistics(): Statistics {
  const [stats, setStats] = useState<Statistics>({
    userCount: 0,
    serviceCount: 0,
    providerCount: 0,
    isLoading: true
  });

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const { db } = await initializeFirebase();
        if (!db) {
          console.error("Firebase DB not initialized");
          setStats(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Fetch active user count - check for users that have logged in within the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const timestamp = thirtyDaysAgo.toISOString();
        
        // Query for active users - users with lastLogin or updatedAt more recent than 30 days ago
        const activeUsersQuery = query(
          collection(db, "users"),
          or(
            where("lastLogin", ">=", timestamp),
            where("updatedAt", ">=", timestamp)
          )
        );
        
        const usersSnapshot = await getCountFromServer(activeUsersQuery);
        let userCount = usersSnapshot.data().count;
        // Ensure at least 1 user is shown
        userCount = userCount > 0 ? userCount : 1;

        // Fetch service count
        const servicesSnapshot = await getCountFromServer(collection(db, "services"));
        let serviceCount = servicesSnapshot.data().count;
        // Ensure at least 1 service is shown
        serviceCount = serviceCount > 0 ? serviceCount : 1;
        
        // Fetch provider count - users with role "provider"
        const providersQuery = query(
          collection(db, "users"),
          where("role", "==", "provider")
        );
        
        const providersSnapshot = await getCountFromServer(providersQuery);
        let providerCount = providersSnapshot.data().count;
        // Ensure at least 1 provider is shown
        providerCount = providerCount > 0 ? providerCount : 1;

        setStats({
          userCount,
          serviceCount: Math.max(0, serviceCount - 1),
          providerCount: Math.max(0, providerCount - 1),
          isLoading: false
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStatistics();
  }, []);

  return stats;
} 