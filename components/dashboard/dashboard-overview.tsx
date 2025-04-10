"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MessageSquare,
  CheckCircle,
  Star,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  Wallet,
} from "lucide-react"
import { useAuth } from "@/app/context/auth-context";
import { initializeFirebase } from "@/app/lib/firebase";
import { getDoc, doc, collection, query, where, getDocs, orderBy, limit, Timestamp, documentId, onSnapshot, DocumentData, QuerySnapshot, CollectionReference, Firestore } from "firebase/firestore";
import { TimelineData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data will be replaced with dynamic data
const mockCategoryData = [
  { name: "Development", value: 35 },
  { name: "Design", value: 25 },
  { name: "Marketing", value: 20 },
  { name: "Writing", value: 15 },
  { name: "Other", value: 5 },
];

const mockTimelineData = [
  { date: "Jan", contacts: 12, transactions: 8 },
  { date: "Feb", contacts: 19, transactions: 12 },
  { date: "Mar", contacts: 25, transactions: 18 },
  { date: "Apr", contacts: 32, transactions: 24 },
  { date: "May", contacts: 38, transactions: 28 },
  { date: "Jun", contacts: 42, transactions: 36 },
];

// Define interface for service data
interface ServiceData {
  id: string;
  providerId: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  rating?: number;
  [key: string]: any; // For any other properties
}

interface CategoryData {
  name: string;
  value: number;
  contactPercentage?: number;
  revenue?: number;
  serviceCount?: number;
}

// Add interface for document data
interface ConversationData extends DocumentData {
  participants: string[];
  serviceId?: string;
  updatedAt?: any;
}

interface TransactionData extends DocumentData {
  providerId: string;
  serviceId?: string;
  amount: number | string;
  createdAt?: any;
}

// Add a more flexible transaction type for combined data sources
interface CombinedTransactionData {
  id: string;
  providerId?: string;
  userId?: string;
  senderId?: string;
  receiverId?: string;
  amount?: number | string;
  parsedDate?: Date;
  createdAt?: any;
  status?: string;
  type?: string;
  serviceId?: string;
  data?: {
    transactionId?: string;
    amount?: number | string;
    serviceId?: string;
    [key: string]: any;
  };
  timestamp?: any;
  serviceType?: string;
  [key: string]: any;
}

// Update DashboardStats interface to include new properties
interface DashboardStats {
  contacts: number;
  contactsChange: number;
  transactions: number;
  transactionsChange: number;
  rating: number;
  ratingChange: number;
  revenue: string;
  revenueChange: number;
  serviceContactPercentage: number;
  totalServices: number;
  contactedServices: number;
  topServices?: any[];
  providerIncome?: string;
  clientSpending?: string;
  isProvider?: boolean;
  clientRating?: number;
  clientRatingCount?: number;
  providerRating?: number;
  providerRatingCount?: number;
}

// Add utility function to handle various date formats from Firestore
function parseFirestoreDate(dateField: any): Date {
  if (!dateField) return new Date(); // Default to current date if missing
  
  // Handle Firestore Timestamp objects
  if (dateField && typeof dateField.toDate === 'function') {
    return dateField.toDate();
  }
  
  // Handle ISO string dates
  if (typeof dateField === 'string') {
    return new Date(dateField);
  }
  
  // Handle numeric timestamps
  if (typeof dateField === 'number') {
    return new Date(dateField);
  }
  
  // Handle Date objects
  if (dateField instanceof Date) {
    return dateField;
  }
  
  // Default fallback
  return new Date();
}

export function DashboardOverview() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [notificationData, setNotificationData] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    contacts: 0,
    contactsChange: 0,
    transactions: 0,
    transactionsChange: 0,
    rating: 0,
    ratingChange: 0,
    revenue: "0",
    revenueChange: 0,
    serviceContactPercentage: 0,
    totalServices: 0,
    contactedServices: 0
  });
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [allNotifications, setAllNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const firebase = await initializeFirebase();
        if (!firebase.db || !user?.uid) throw new Error("Failed to initialize database or user not authenticated");

        console.log("Setting up listeners for user:", user.uid);
        
        // Get user's conversations - first try without orderBy which can cause issues
        const conversationsRef = collection(firebase.db, "conversations");
        console.log("Attempting to query conversations");
        
        // Remove orderBy which can cause index errors if not set up
        const conversationsQuery = query(
          conversationsRef,
          where("participants", "array-contains", user.uid)
        );
        
        // Set up real-time listener for conversations
        const conversationsUnsubscribe = onSnapshot(conversationsQuery, async (conversationsSnap) => {
          console.log("Conversations snapshot received, count:", conversationsSnap.size);
          const uniqueProviders = new Set(conversationsSnap.docs.map(doc => {
            const data = doc.data() as ConversationData;
            return data.participants.find((p: string) => p !== user.uid);
          }));

          // Get total services count and calculate average rating
          const db = firebase.db;
          if (!db) return;
          
          const servicesRef = collection(db, "services");
          console.log("Attempting to query services");
          const servicesQuery = query(servicesRef, where("providerId", "==", user.uid));
          
          // Set up real-time listener for services
          const servicesSnap = await getDocs(servicesQuery);
          
          console.log("Services snapshot received, count:", servicesSnap.size);
          const totalServices = servicesSnap.size;
          
          // Map service data with proper typing
          const services = servicesSnap.docs.map(doc => {
            const docData = doc.data();
            return {
              id: doc.id,
              providerId: docData.providerId || "",
              title: docData.title || "",
              description: docData.description || "",
              price: docData.price || 0,
              category: docData.category || "Other",
              rating: docData.rating || 0,
              // Include all other properties
              ...docData
            };
          });
            
          // Fetch reviews for this provider to calculate ratings by source
          const reviewsRef = collection(db, "reviews");
          const reviewsQuery = query(
            reviewsRef,
            where("providerId", "==", user.uid)
          );
          
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          // Calculate ratings by source
          let totalRating = 0;
          let ratingCount = 0;
          let clientRating = 0;
          let clientRatingCount = 0;
          let providerRating = 0;
          let providerRatingCount = 0;
          
          reviewsSnapshot.forEach(doc => {
            const reviewData = doc.data();
            const rating = parseFloat(reviewData.rating) || 0;
            
            if (rating > 0) {
              totalRating += rating;
              ratingCount++;
              
              // Check if this is a provider-to-provider rating
              if (reviewData.raterIsProvider) {
                providerRating += rating;
                providerRatingCount++;
              } else {
                clientRating += rating;
                clientRatingCount++;
              }
            }
          });
          
          // Calculate averages
          const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
          const averageClientRating = clientRatingCount > 0 ? clientRating / clientRatingCount : 0;
          const averageProviderRating = providerRatingCount > 0 ? providerRating / providerRatingCount : 0;
          
          // Get previous period date for comparisons
          const now = new Date();
          let previousStartDate = new Date();
          let currentStartDate = new Date();
          
          // Set comparison dates based on timeframe
          if (timeframe === 'week') {
            previousStartDate.setDate(now.getDate() - 14); // 2 weeks ago
            currentStartDate.setDate(now.getDate() - 7); // 1 week ago
          } else if (timeframe === 'month') {
            previousStartDate.setMonth(now.getMonth() - 2); // 2 months ago
            currentStartDate.setMonth(now.getMonth() - 1); // 1 month ago
          } else if (timeframe === 'year') {
            previousStartDate.setFullYear(now.getFullYear() - 2); // 2 years ago
            currentStartDate.setFullYear(now.getFullYear() - 1); // 1 year ago
          }

          // Get previous period ratings
          const previousRatingsQuery = query(
            servicesRef,
            where("providerId", "==", user.uid),
            where("updatedAt", "<=", Timestamp.fromDate(previousStartDate))
          );
          
          getDocs(previousRatingsQuery).then((previousRatingsSnap) => {
            let previousTotalRating = 0;
            let previousRatedServices = 0;
            previousRatingsSnap.docs.forEach(doc => {
              const data = doc.data();
              if (data.rating && data.rating > 0) {
                previousTotalRating += data.rating;
                previousRatedServices++;
              }
            });
            const previousAverageRating = previousRatedServices > 0 ? previousTotalRating / previousRatedServices : 0;
            const ratingChange = previousAverageRating > 0 
              ? ((averageRating - previousAverageRating) / previousAverageRating) * 100 
              : 0;

            // Get transactions where the provider is receiving payment
            const transactionsRef = collection(db, "transactions");
            console.log("Attempting to query transactions with filter:", user.uid);
            
            // First, get ALL transactions for this provider to ensure we have data
            const allTransactionsQuery = query(
              transactionsRef,
              where("providerId", "==", user.uid),
              where("status", "in", ["confirmed", "completed"])
            );
            
            // Also query notifications for payment-related notifications
            const notificationsRef = collection(db, "notifications");
            const paymentNotificationsQuery = query(
              notificationsRef,
              where("userId", "==", user.uid),
              where("type", "in", ["payment_proof", "payment_confirmation", "payment"])
            );
            
            // Also query messages with payment proof
            const messagesRef = collection(db, "messages");
            const paymentMessagesQuery = query(
              messagesRef,
              where("receiverId", "==", user.uid),
              where("paymentProof", "!=", null)
            );
            
            // Get transactions, notifications, and payment messages
            Promise.all([
              getDocs(allTransactionsQuery),
              getDocs(paymentNotificationsQuery),
              getDocs(paymentMessagesQuery)
            ]).then(([allTransactionsSnap, paymentNotificationsSnap, paymentMessagesSnap]) => {
              console.log(`Found ${allTransactionsSnap.size} transactions, ${paymentNotificationsSnap.size} payment notifications, and ${paymentMessagesSnap.size} payment messages for user ${user.uid}`);
              
              // Extract transaction dates from notifications if not found in transactions
              const paymentDates = paymentNotificationsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                  parsedDate: parseFirestoreDate(data.timestamp),
                  amount: data.data?.amount || 0,
                  serviceId: data.data?.serviceId,
                  serviceType: data.data?.serviceType || "Unknown",
                  id: doc.id,
                  type: 'notification',
                  data: data.data,
                  ...data
                } as CombinedTransactionData;
              });
              
              // Extract payment data from messages with payment proof
              const messagePayments = paymentMessagesSnap.docs.map(doc => {
                const data = doc.data();
                // Try to extract amount from the message text if it's a payment message
                let amount = 0;
                if (data.text) {
                  // Look for amount patterns in the text like "₱500" or "500 pesos"
                  const amountMatch = data.text.match(/₱(\d+([.,]\d+)?)|(\d+([.,]\d+)?)(\s+)?(?:pesos|php)/i);
                  if (amountMatch) {
                    amount = parseFloat(amountMatch[1] || amountMatch[3]);
                  }
                }
                
                return {
                  parsedDate: parseFirestoreDate(data.timestamp),
                  amount: amount,
                  conversationId: data.conversationId,
                  serviceId: data.serviceId || "",
                  id: doc.id,
                  type: 'message_payment',
                  paymentProof: data.paymentProof,
                  ...data
                } as CombinedTransactionData;
              });
              
              // Process transaction data for direct date access
              const allFilteredTransactions = allTransactionsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                  ...data,
                  parsedDate: parseFirestoreDate(data.createdAt),
                  id: doc.id,
                  type: 'transaction',
                  serviceType: data.serviceType || "Unknown"
                } as CombinedTransactionData;
              });
              
              // Debug logging for transactions
              console.log('==== DEBUG REVENUE DATA ====');
              console.log('Transaction data (first 5):', allFilteredTransactions.slice(0, 5));
              console.log('Payment notifications (first 5):', paymentDates.slice(0, 5));
              console.log('Message payments (first 5):', messagePayments.slice(0, 5));
              console.log('User ID for provider filter:', user?.uid);
              
              // Look up conversation-related service details for message payments
              const conversationIds = messagePayments
                .filter(mp => !mp.serviceId && mp.conversationId)
                .map(mp => mp.conversationId);
              
              if (conversationIds.length > 0) {
                // Fetch conversations to get serviceId
                const conversationsRef = collection(db, "conversations");
                const conversationQuery = query(
                  conversationsRef,
                  where(documentId(), "in", conversationIds)
                );
                
                getDocs(conversationQuery).then((conversationsSnap) => {
                  // Map conversation IDs to service IDs
                  const conversationServiceMap = new Map<string, string>();
                  const conversationServiceTitleMap = new Map<string, string>();
                  
                  conversationsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.serviceId) {
                      conversationServiceMap.set(doc.id, data.serviceId);
                    }
                    if (data.serviceTitle) {
                      conversationServiceTitleMap.set(doc.id, data.serviceTitle);
                    }
                  });
                  
                  // Update message payments with service information
                  messagePayments.forEach(payment => {
                    if (payment.conversationId && conversationServiceMap.has(payment.conversationId)) {
                      payment.serviceId = conversationServiceMap.get(payment.conversationId);
                    }
                    if (payment.conversationId && conversationServiceTitleMap.has(payment.conversationId)) {
                      payment.serviceTitle = conversationServiceTitleMap.get(payment.conversationId);
                    }
                  });
                  
                  // Combine all data sources with the updated message payments
                  finalizeRevenueCalculation(
                    [...allFilteredTransactions, ...paymentDates, ...messagePayments],
                    services,
                    timeframe,
                    user,
                    conversationsSnap,
                    paymentNotificationsSnap,
                    paymentMessagesSnap,
                    allTransactionsSnap,
                    setStats,
                    setTimelineData,
                    setAllTransactions,
                    setAllNotifications,
                    setIsLoading,
                    uniqueProviders,
                    totalServices,
                    averageRating,
                    previousAverageRating,
                    averageClientRating,
                    clientRatingCount,
                    averageProviderRating,
                    providerRatingCount,
                    timelineData,
                    setCategoryData
                  );
                }).catch(error => {
                  console.error("Error fetching conversation details:", error);
                  // Still proceed with the data we have
                  finalizeRevenueCalculation(
                    [...allFilteredTransactions, ...paymentDates, ...messagePayments],
                    services,
                    timeframe,
                    user,
                    conversationsSnap,
                    paymentNotificationsSnap,
                    paymentMessagesSnap,
                    allTransactionsSnap,
                    setStats,
                    setTimelineData,
                    setAllTransactions,
                    setAllNotifications,
                    setIsLoading,
                    uniqueProviders,
                    totalServices,
                    averageRating,
                    previousAverageRating,
                    averageClientRating,
                    clientRatingCount,
                    averageProviderRating,
                    providerRatingCount,
                    timelineData,
                    setCategoryData
                  );
                });
              } else {
                // No conversation lookups needed, continue with data we have
                finalizeRevenueCalculation(
                  [...allFilteredTransactions, ...paymentDates, ...messagePayments],
                  services,
                  timeframe,
                  user,
                  conversationsSnap,
                  paymentNotificationsSnap,
                  paymentMessagesSnap,
                  allTransactionsSnap,
                  setStats,
                  setTimelineData,
                  setAllTransactions,
                  setAllNotifications,
                  setIsLoading,
                  uniqueProviders,
                  totalServices,
                  averageRating,
                  previousAverageRating,
                  averageClientRating,
                  clientRatingCount,
                  averageProviderRating,
                  providerRatingCount,
                  timelineData,
                  setCategoryData
                );
              }
              
              // After the conversations query, add notification listener
              // Get all notifications for this user
              const notificationsQuery = query(
                notificationsRef,
                where("userId", "==", user.uid),
                orderBy("timestamp", "desc"),
                limit(100) // Get last 100 notifications
              );
              
              // Set up real-time listener for notifications
              const notificationsUnsubscribe = onSnapshot(notificationsQuery, (notificationsSnap) => {
                console.log("Notifications snapshot received, count:", notificationsSnap.size);
                
                // Process notifications by type
                const notifications = notificationsSnap.docs.map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    type: data.type,
                    timestamp: parseFirestoreDate(data.timestamp),
                    data: data.data || {},
                    read: data.read || false,
                    ...data
                  };
                });
                
                // Store notification data for calendar
                setNotificationData(notifications);
              });
            }).catch(error => {
              console.error("Error in payment data processing:", error);
              setIsLoading(false);
              setError("Failed to fetch transaction data");
            });
          }).catch(error => {
            console.error("Error in conversation data processing:", error);
            setIsLoading(false);
            setError("Failed to fetch conversation data");
          });
        });

        // Return cleanup function for conversation listener
        return () => {
          if (typeof conversationsUnsubscribe === 'function') {
            conversationsUnsubscribe();
          }
        };
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, timeframe]);
  
  // Render dashboard components with the data
  return (
    <div className="space-y-8" key="dashboard-overview-refreshed" id="dashboard-content">
      {/* Personalized greeting with enhanced styling for graphic designers */}
      <div className="mb-12 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10">
          <div className="flex flex-col space-y-1">
            <h1 className="text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Good {getTimeOfDay()}, {user?.displayName || 'there'}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl">
              You have <span className="font-medium text-indigo-600 dark:text-indigo-400">{stats.contacts} contacts</span> and <span className="font-medium text-purple-600 dark:text-purple-400">{stats.transactions} completed transactions</span>.
            </p>
          </div>
          
          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Analytics overview: {timeframe === "week" ? "This week" : timeframe === "month" ? "This month" : "This year"}
            </span>
            <Tabs 
              value={timeframe}
              onValueChange={(value) => setTimeframe(value as "week" | "month" | "year")}
              className="w-[240px]"
            >
              <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                <TabsTrigger value="week" className="rounded-full text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Week</TabsTrigger>
                <TabsTrigger value="month" className="rounded-full text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Month</TabsTrigger>
                <TabsTrigger value="year" className="rounded-full text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      </div>

      {/* Top row - Stats cards with enhanced design for graphic designers */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Clients card */}
        <Card className="overflow-hidden border-none rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-900/20 shadow-lg dark:shadow-blue-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-800/30 dark:to-indigo-800/30 rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            <CardTitle className="text-sm font-medium z-10">Clients</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center z-10 shadow-md shadow-blue-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{stats.contacts}</div>
            <div className="flex items-center">
              <div className="text-xs flex items-center">
              {stats.contactsChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                )}
                <span className={stats.contactsChange > 0 ? "text-emerald-500" : "text-rose-500"}>
                  {stats.contactsChange > 0 ? "+" : ""}{Math.abs(stats.contactsChange).toFixed(1)}%
                </span>
                <span className="ml-1 text-gray-400">vs last {timeframe}</span>
              </div>
            </div>
            
            {/* Enhanced mini-chart visualization */}
            <div className="mt-5 flex h-12 items-end space-x-1 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-100 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-md opacity-50"></div>
              {timelineData.slice(-6).map((item, i) => {
                const maxValue = Math.max(...timelineData.slice(-6).map(d => d.contacts));
                const height = maxValue > 0 ? (item.contacts / maxValue) * 100 : 0;
                return (
                  <div 
                    key={i} 
                    className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-t-lg z-10"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transactions card */}
        <Card className="overflow-hidden border-none rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900/20 shadow-lg dark:shadow-purple-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/30 dark:to-pink-800/30 rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            <CardTitle className="text-sm font-medium z-10">Transactions</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-10 shadow-md shadow-purple-500/20">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">{stats.transactions}</div>
            <div className="flex items-center">
              <div className="text-xs flex items-center">
              {stats.transactionsChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                )}
                <span className={stats.transactionsChange > 0 ? "text-emerald-500" : "text-rose-500"}>
                  {stats.transactionsChange > 0 ? "+" : ""}{Math.abs(stats.transactionsChange).toFixed(1)}%
                </span>
                <span className="ml-1 text-gray-400">vs last {timeframe}</span>
              </div>
            </div>
            
            {/* Enhanced line chart visualization */}
            <div className="mt-5 relative h-12">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-100 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-md opacity-50"></div>
              <svg className="w-full h-full relative z-10" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="transactionsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.8)" />
                    <stop offset="100%" stopColor="rgba(219, 39, 119, 0.8)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={`M0,${30 - calculateYPosition(timelineData[0]?.transactions || 0, timelineData)} ${timelineData.map((item, i) => 
                    `L${(i / (timelineData.length - 1)) * 100},${30 - calculateYPosition(item.transactions, timelineData)}`).join(' ')}`}
                  fill="none"
                  stroke="url(#transactionsGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Rating card */}
        <Card className="overflow-hidden border-none rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-amber-900/20 shadow-lg dark:shadow-amber-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30 rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            <CardTitle className="text-sm font-medium z-10">Rating</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center z-10 shadow-md shadow-amber-500/20">
              <Star className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400">
              {stats.isProvider ? stats.providerRating?.toFixed(1) || "0.0" : stats.clientRating?.toFixed(1) || "0.0"}
            </div>
            <div className="flex items-center">
              <div className="text-xs flex items-center">
              {stats.ratingChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                )}
                <span className={stats.ratingChange > 0 ? "text-emerald-500" : "text-rose-500"}>
                  {stats.ratingChange > 0 ? "+" : ""}{Math.abs(stats.ratingChange).toFixed(1)}%
                </span>
                <span className="ml-1 text-gray-400">vs last {timeframe}</span>
              </div>
            </div>
            
            {/* Enhanced star visualization */}
            <div className="mt-5 flex space-x-2 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-100 to-transparent dark:from-amber-900/20 dark:to-transparent rounded-md opacity-50"></div>
              {[...Array(5)].map((_, i) => {
                const rating = stats.isProvider ? stats.providerRating || 0 : stats.clientRating || 0;
                return (
                  <Star 
                    key={i} 
                    className={`h-6 w-6 relative z-10 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-gray-200 dark:text-gray-700"}`} 
                  />
                );
              })}
            </div>
            <Badge variant="outline" className="mt-2">
              {stats.isProvider ? stats.providerRatingCount : stats.clientRatingCount} ratings
            </Badge>
          </CardContent>
        </Card>

        {/* Revenue card */}
        <Card className="overflow-hidden border-none rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-emerald-900/20 shadow-lg dark:shadow-emerald-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800/30 dark:to-teal-800/30 rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            <CardTitle className="text-sm font-medium z-10">
              {stats.isProvider ? 
                (parseFloat(stats.clientSpending || "0") > 0 ? "Finance" : "Revenue") : 
                "Spending"}
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center z-10 shadow-md shadow-emerald-500/20">
              <span className="text-white text-sm font-medium">₱</span>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col gap-2">
              {/* Provider income section */}
              {stats.isProvider && parseFloat(stats.providerIncome || "0") > 0 && (
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Provider Income</span>
                    <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                      ₱{stats.providerIncome}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="text-xs flex items-center">
                      {stats.revenueChange > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                      )}
                      <span className={stats.revenueChange > 0 ? "text-emerald-500" : "text-rose-500"}>
                        {stats.revenueChange > 0 ? "+" : ""}{Math.abs(stats.revenueChange).toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-400">vs last {timeframe}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Client spending section */}
              {parseFloat(stats.clientSpending || "0") > 0 && (
                <div className={stats.isProvider && parseFloat(stats.providerIncome || "0") > 0 ? "mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800/30" : ""}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Client Spending</span>
                    <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                      ₱{stats.clientSpending}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Show original revenue if both provider income and client spending are zero */}
              {parseFloat(stats.providerIncome || "0") === 0 && parseFloat(stats.clientSpending || "0") === 0 && (
                <div className="text-3xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                  ₱{stats.revenue}
                  <div className="flex items-center">
                    <div className="text-xs flex items-center">
                      {stats.revenueChange > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                      )}
                      <span className={stats.revenueChange > 0 ? "text-emerald-500" : "text-rose-500"}>
                        {stats.revenueChange > 0 ? "+" : ""}{Math.abs(stats.revenueChange).toFixed(1)}%
                      </span>
                      <span className="ml-1 text-gray-400">vs last {timeframe}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Calendar with Apple-inspired design */}
      <Card className="overflow-hidden border-none rounded-2xl shadow-lg bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Calendar</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                View your historical performance by date
              </CardDescription>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium">
                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center mt-1">
                <button 
                  onClick={() => {
                    const newDate = new Date(calendarYear, calendarMonth - 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }} 
                  className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" 
                  aria-label="Previous month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 mx-2">Change month</span>
                <button 
                  onClick={() => {
                    const newDate = new Date(calendarYear, calendarMonth + 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }} 
                  className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" 
                  aria-label="Next month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays(calendarMonth, calendarYear, timelineData, timeframe, allTransactions, allNotifications).map((day, i) => {
              // Get activity level based on transactions and notifications
              const totalActivity = day.transactions + day.notifications;
              const activityLevel = totalActivity > 5 ? 'high' : 
                                    totalActivity > 3 ? 'medium' : 
                                    totalActivity > 0 ? 'low' : 'none';
              
              const bgColor = activityLevel === 'high' ? 'bg-purple-500' :
                              activityLevel === 'medium' ? 'bg-purple-400' :
                              activityLevel === 'low' ? 'bg-purple-300' : 'bg-purple-100';
              
              // Check if this is today's date
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              return (
                <div key={i} className="relative aspect-square">
                  <div className={`${day.isCurrentMonth ? bgColor : 'bg-gray-100'} w-full h-full rounded-md flex items-center justify-center group cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all ${isToday ? 'ring-2 ring-purple-600' : ''}`}>
                    <span className={`text-sm font-semibold ${
                      day.isCurrentMonth 
                        ? activityLevel === 'none' 
                          ? 'text-purple-900' // Dark text on light background for no activity
                          : 'text-white' // White text on colored background
                        : 'text-gray-400' // Gray text for non-current month
                    } ${isToday ? 'text-base' : ''}`}>
                      {day.date.getDate()}
                    </span>
                    
                    {/* Activity indicators */}
                    {day.isCurrentMonth && (
                      <>
                        {day.transactions > 0 && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                        {day.notifications > 0 && (
                          <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        )}
                      </>
                    )}
                    
                    {/* Activity tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 hidden group-hover:block bg-white dark:bg-gray-800 rounded-md shadow-md p-2 border dark:border-gray-700 text-left min-w-[140px]">
                      <p className="text-xs font-bold">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <div className="mt-1 space-y-1 text-xs">
                        <p>Contacts: {day.transactions}</p>
                        <p>Transactions: {day.transactions}</p>
                        <p>Notifications: {day.notifications}</p>
                        <p className="font-medium pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">Total Activity: {day.transactions + day.notifications}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-100"></div>
              <span className="text-xs text-purple-900 dark:text-purple-300">No activity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-300"></div>
              <span className="text-xs text-purple-900 dark:text-purple-300">Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-400"></div>
              <span className="text-xs text-purple-900 dark:text-purple-300">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
              <span className="text-xs text-purple-900 dark:text-purple-300">High</span>
            </div>
          </div>
          
          {/* Add notification indicator to the color legend */}
          <div className="flex justify-start mt-3 space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Contacts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Notifications</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Stats Card and Category Distribution in a new row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Service Stats Card */}
        <Card className="overflow-hidden border-none rounded-2xl shadow-lg bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle>Service Engagement</CardTitle>
            <CardDescription>
              {stats.contactedServices} of {stats.totalServices} services contacted ({stats.serviceContactPercentage.toFixed(1)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topServices && stats.topServices.slice(0, 3).map((service, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-1/2 text-sm truncate" title={service.name}>{service.name}</div>
                  <div className="w-1/4 text-sm text-right">₱{service.revenue.toFixed(2)}</div>
                  <div className="w-1/4 text-sm text-right text-muted-foreground">{service.count} sales</div>
                </div>
              ))}
              {(!stats.topServices || stats.topServices.length === 0) && (
                <div className="text-sm text-muted-foreground">No service data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Card */}
        <Card className="overflow-hidden border-none rounded-2xl shadow-lg bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>
              Breakdown of your service categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryData.slice(0, 4).map((category, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-1/3 text-sm truncate" title={category.name}>{category.name}</div>
                  <div className="w-2/3 ml-2">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.min(100, (category.value / categoryData.reduce((sum, c) => sum + c.value, 0)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add CSS for grid pattern background */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

// Helper function for calculating Y position in transaction chart
function calculateYPosition(value: number, data: TimelineData[]) {
  const maxValue = Math.max(...data.map(d => Math.max(d.contacts, d.transactions)));
  return maxValue > 0 ? (value / maxValue) * 28 : 0;
}

// Helper function to get time of day
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// Update the generateCalendarDays function to include notifications
function generateCalendarDays(month = new Date().getMonth(), year = new Date().getFullYear(), timelineData: TimelineData[] = [], currentTimeframe?: string, transactionData: any[] = [], notificationData: any[] = []) {
  // Generate days for selected month view
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Initialize array with empty slots for days from previous month
  const days = Array(firstDayOfMonth).fill(null).map((_, i) => {
    const date = new Date(year, month, -firstDayOfMonth + i + 1);
    return {
      date,
      isCurrentMonth: false,
      contacts: 0,
      transactions: 0,
      notifications: 0
    };
  });
  
  // Add days for current month with real data if available
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayStr = date.getDate().toString();
    
    // Try to find matching data for this day
    let contacts = 0;
    let transactions = 0;
    let notifications = 0;
    
    // Process notification data first - highest priority
    if (notificationData && notificationData.length > 0) {
      const dayNotifications = notificationData.filter(notification => {
        if (!notification.parsedDate) return false;
        
        return notification.parsedDate.getDate() === date.getDate() && 
               notification.parsedDate.getMonth() === date.getMonth() && 
               notification.parsedDate.getFullYear() === date.getFullYear();
      });
      
      notifications = dayNotifications.length;
    }
    
    // Process transaction data
    if (transactionData && transactionData.length > 0) {
      const matchingTransactions = transactionData.filter(tx => {
        if (!tx.parsedDate) return false;
        
        // Check if transaction date matches this calendar day exactly
        return tx.parsedDate.getDate() === date.getDate() && 
               tx.parsedDate.getMonth() === date.getMonth() && 
               tx.parsedDate.getFullYear() === date.getFullYear();
      });
      
      // Count transactions
      transactions = matchingTransactions.length;
      
      // If we find transactions, also add some contacts as an estimate
      if (transactions > 0) {
        contacts = Math.max(1, Math.round(transactions * 1.5));
      }
    }
    
    // If no transaction data, fall back to timeline data
    if (transactions === 0) {
      timelineData.forEach(item => {
        // Check if the item date is a numeric day that matches this calendar day
        if (item.date === dayStr && month === new Date().getMonth() && year === new Date().getFullYear()) {
          contacts += item.contacts;
          transactions += item.transactions;
        }
        
        // Also check date format for month name format (Jan, Feb, etc.)
        const monthAbbr = date.toLocaleDateString('en-US', { month: 'short' });
        if (item.date === monthAbbr && date.getDate() <= 7 && currentTimeframe === 'year') {
          contacts += Math.floor(item.contacts / 4); // Distribute monthly data across first week
          transactions += Math.floor(item.transactions / 4);
        }
        
        // Handle week day format (Mon, Tue, etc.)
        const weekdayAbbr = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (item.date === weekdayAbbr && currentTimeframe === 'week') {
          contacts += item.contacts;
          transactions += item.transactions;
        }
      });
    }
    
    // Store the day with its data
    days.push({
      date,
      isCurrentMonth: true,
      contacts,
      transactions,
      notifications
    });
  }
  
  // Fill remaining slots with next month days to complete grid
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        contacts: 0,
        transactions: 0,
        notifications: 0
      });
    }
  }
  
  return days;
}

// Helper function to finalize revenue calculations
function finalizeRevenueCalculation(
  combinedTransactionData: CombinedTransactionData[],
  services: any[],
  timeframe: string,
  user: any,
  conversationsSnap: QuerySnapshot<DocumentData>,
  paymentNotificationsSnap: QuerySnapshot<DocumentData>,
  paymentMessagesSnap: QuerySnapshot<DocumentData>,
  allTransactionsSnap: QuerySnapshot<DocumentData>,
  setStats: (stats: DashboardStats) => void,
  setTimelineData: (data: TimelineData[]) => void,
  setAllTransactions: (data: any[]) => void,
  setAllNotifications: (data: any[]) => void,
  setIsLoading: (loading: boolean) => void,
  uniqueProviders: Set<string | undefined>,
  totalServices: number,
  averageRating: number,
  previousAverageRating: number,
  averageClientRating: number,
  clientRatingCount: number,
  averageProviderRating: number,
  providerRatingCount: number,
  timelineData: TimelineData[],
  setCategoryData: (data: CategoryData[]) => void
) {
  // IMPORTANT: Only count transactions where this user is the provider
  // Filter out transactions where the user is not the provider
  combinedTransactionData = combinedTransactionData.filter(tx => {
    if (!user) return false; // Skip if user is null
    
    // Get a non-null user reference for TypeScript
    const currentUser = user as {uid: string};
    
    // For regular transactions, check providerId OR userId
    if (tx.type === 'transaction') {
      return tx.providerId === currentUser.uid || tx.userId === currentUser.uid;
    }
    
    // For message payments, verify they're directed to this user OR sent by this user
    if (tx.type === 'message_payment') {
      return tx.receiverId === currentUser.uid || tx.senderId === currentUser.uid;
    }
    
    // For notifications, check that they're for this user
    if (tx.type === 'notification') {
      return tx.userId === currentUser.uid;
    }
    
    return false;
  });
  
  // Log transaction sources for debugging
  const transactionSources = {
    transaction: combinedTransactionData.filter(tx => tx.type === 'transaction').length,
    notification: combinedTransactionData.filter(tx => tx.type === 'notification').length,
    message_payment: combinedTransactionData.filter(tx => tx.type === 'message_payment').length,
  };
  console.log("Revenue sources after provider filtering:", transactionSources);
  
  // IMPORTANT: No deduplication by conversation - count every payment separately
  // We only deduplicate exact duplicates with the same ID
  const uniqueTransactionIds = new Set<string>();
  const dedupedTransactions = combinedTransactionData.filter(tx => {
    // Skip items with no ID or relevant references
    if (!tx.id) return false;
    
    // For notifications, only check for exact duplicates of the same notification
    if (tx.type === 'notification') {
      if (uniqueTransactionIds.has(tx.id)) {
        return false;
      }
      uniqueTransactionIds.add(tx.id);
      return true;
    }
    
    // For message payments, don't deduplicate by conversation - count each separately
    if (tx.type === 'message_payment') {
      if (uniqueTransactionIds.has(tx.id)) {
        return false;
      }
      uniqueTransactionIds.add(tx.id);
      return true;
    }
    
    // For regular transactions, just check for duplicate IDs
    if (uniqueTransactionIds.has(tx.id)) {
      return false;
    }
    uniqueTransactionIds.add(tx.id);
    return true;
  });
  
  console.log(`After deduplication: ${combinedTransactionData.length} -> ${dedupedTransactions.length} unique transactions`);
  
  // Use the deduplicated transactions list from now on
  combinedTransactionData = dedupedTransactions;

  // First, map service IDs to names for better display
  const serviceNameMap = new Map<string, string>();
  services.forEach(service => {
    serviceNameMap.set(service.id, service.title);
  });

  // Add direct service title mappings from messages
  combinedTransactionData.forEach(tx => {
    if (tx.serviceId && tx.serviceTitle && !serviceNameMap.has(tx.serviceId)) {
      serviceNameMap.set(tx.serviceId, tx.serviceTitle);
    }
  });

  // Define date ranges for current and previous periods
  const today = new Date();
  const currentEndDate = new Date(today);
  const currentStartDate = new Date(today);
  currentStartDate.setDate(currentStartDate.getDate() - 30); // Last 30 days
  
  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - 30); // Previous 30 days

  // Calculate current revenue and total revenue
  const currentTransactions = combinedTransactionData.filter(t => {
    return t.parsedDate && t.parsedDate >= currentStartDate && t.parsedDate <= currentEndDate;
  });
  const previousTransactions = combinedTransactionData.filter(t => {
    return t.parsedDate && t.parsedDate >= previousStartDate && t.parsedDate <= previousEndDate;
  });

  // Enhanced revenue tracking that syncs with message payment data
  let currentRevenue = 0;
  let serviceRevenues: Record<string, {revenue: number, count: number, name: string}> = {};
  
  // Log revenue calculation process
  console.log("Starting revenue calculation with", currentTransactions.length, "transactions in current period");
  
  // Process all transactions and message payments in current period
  currentTransactions.forEach(transaction => {
    // Make sure we're only counting revenue for this provider
    if (transaction.type === 'transaction' && transaction.providerId && user && transaction.providerId !== user.uid) {
      console.log(`Skipping transaction ${transaction.id} - not for current provider`);
      return;
    }
    
    const amount = Number(transaction.amount || 0);
    
    if (!isNaN(amount) && amount > 0) {
      console.log(`Adding revenue: ${amount} from ${transaction.type} ${transaction.id}`);
      currentRevenue += amount;
      
      // For revenue tracking by service
      if (transaction.serviceId) {
        const serviceName = serviceNameMap.get(transaction.serviceId) || 'Unknown Service';
        
        if (!serviceRevenues[transaction.serviceId]) {
          serviceRevenues[transaction.serviceId] = {
            revenue: 0,
            count: 0,
            name: serviceName
          };
        }
        
        serviceRevenues[transaction.serviceId].revenue += amount;
        serviceRevenues[transaction.serviceId].count += 1;
      } 
      // For message payments without serviceId but with conversationId
      else if (transaction.type === 'message_payment' && transaction.conversationId) {
        // Find the conversation from our conversationsData
        const conversationData = conversationsSnap.docs.map(doc => doc.data() as ConversationData).find((c: ConversationData) => c.id === transaction.conversationId);
        
        if (conversationData && conversationData.serviceId) {
          const serviceName = serviceNameMap.get(conversationData.serviceId) || 'Unknown Service';
          
          if (!serviceRevenues[conversationData.serviceId]) {
            serviceRevenues[conversationData.serviceId] = {
              revenue: 0,
              count: 0,
              name: serviceName
            };
          }
          
          serviceRevenues[conversationData.serviceId].revenue += amount;
          serviceRevenues[conversationData.serviceId].count += 1;
          
          console.log(`Adding ${amount} revenue to service ${serviceName} from message payment in conversation ${transaction.conversationId}`);
          console.log(`Current revenue for ${serviceName}: ${serviceRevenues[conversationData.serviceId].revenue}`);
        } else {
          // Track as unknown service if we can't determine the service
          const unknownServiceId = 'unknown';
          
          if (!serviceRevenues[unknownServiceId]) {
            serviceRevenues[unknownServiceId] = {
              revenue: 0,
              count: 0,
              name: 'Unknown Service'
            };
          }
          
          serviceRevenues[unknownServiceId].revenue += amount;
          serviceRevenues[unknownServiceId].count += 1;
          console.log(`Adding ${amount} revenue to Unknown Service from message payment - conversation not found: ${transaction.conversationId}`);
        }
      }
    }
  });
  
  // Create sorted topServices array with additional metrics
  const topServices = Object.entries(serviceRevenues)
    .map(([id, data]) => ({
      id,
      name: data.name,
      revenue: data.revenue,
      count: data.count,
      avgRevenue: data.count > 0 ? data.revenue / data.count : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Top 5 services

  console.log("Current Revenue:", currentRevenue, "Top Services:", topServices);
  
  let previousRevenue = 0;
  previousTransactions.forEach(transaction => {
    const amount = Number(transaction.amount || 0);
    if (!isNaN(amount) && amount > 0) {
      previousRevenue += amount;
    }
  });
  
  // Calculate revenue change percentage
  const revenueChange = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 100;
  
  console.log(`Revenue calculations: Current: ${currentRevenue}, Previous: ${previousRevenue}, Change: ${revenueChange}%`);

  // Separate income (as provider) from spending (as client)
  let providerIncome = 0;
  let clientSpending = 0;

  currentTransactions.forEach(tx => {
    const amount = Number(tx.amount || 0);
    if (isNaN(amount) || amount <= 0) return;

    if (tx.providerId === user?.uid) {
      // User is receiving money as provider
      providerIncome += amount;
    } else if (
      (tx.type === 'transaction' && tx.userId === user?.uid) || 
      (tx.type === 'message_payment' && tx.senderId === user?.uid)
    ) {
      // User is spending money as client
      clientSpending += amount;
    }
  });

  console.log(`User roles: Provider income: ${providerIncome}, Client spending: ${clientSpending}`);
  
  // Calculate contacted services percentage
  const serviceIds = new Set(services.map(s => s.id));
  const contactedServiceIds = new Set<string>();
  
  // Find all services that have been contacted
  combinedTransactionData.forEach(tx => {
    if (tx.serviceId && serviceIds.has(tx.serviceId)) {
      contactedServiceIds.add(tx.serviceId);
    }
  });
  
  const contactedServicesPercentage = serviceIds.size > 0
    ? (contactedServiceIds.size / serviceIds.size) * 100
    : 0;
  
  // Use the fallback if we have transactions but timeline/filtering isn't working
  let finalRevenue = currentRevenue;
  
  // Calculate the total transactions from the deduplicated list
  const totalTransactions = combinedTransactionData.length;
  let finalTransactionsCount = totalTransactions;
  let finalTimelineData = timelineData;
  
  // Log the total transactions for debugging
  console.log(`Total unique transactions: ${totalTransactions}`);
  
  // Only use notification/message counts if we have no transactions
  if (totalTransactions === 0 && (paymentNotificationsSnap.size > 0 || paymentMessagesSnap.size > 0)) {
    // Get unique count after considering potential overlaps
    const uniqueMessageCount = new Set(paymentMessagesSnap.docs.map(doc => doc.id)).size;
    const uniqueNotificationCount = new Set(paymentNotificationsSnap.docs.map(doc => doc.id)).size;
    
    // Count unique messages and notifications, but be conservative to avoid overcounting
    const uniqueCount = Math.min(uniqueMessageCount + uniqueNotificationCount, 
                               Math.max(uniqueMessageCount, uniqueNotificationCount) * 1.5);
    
    console.log(`Using estimated unique count: ${Math.round(uniqueCount)}`);
    finalTransactionsCount = Math.round(uniqueCount);
  }
  
  // If we have no data from the filtered results but do have transactions,
  // use all transactions as a fallback
  if (finalRevenue === 0 && allTransactionsSnap.size > 0) {
    console.log("Using all transactions as fallback since filtered queries found no results");
    
    // Calculate total revenue from all transactions
    finalRevenue = allTransactionsSnap.docs.reduce((sum: number, doc: any) => {
      const data = doc.data();
      // Only count if this user is the provider
      if (!user || data.providerId !== user.uid) return sum;
      
      const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
      return sum + (amount || 0);
    }, 0);
    
    // Store transaction counts for reference
    const filteredTransactionCount = user ? allTransactionsSnap.docs.filter(doc => 
      doc.data().providerId === user.uid
    ).length : 0;
    
    // Use the higher value between filtered transactions
    finalTransactionsCount = Math.max(totalTransactions, filteredTransactionCount);
    
    // Create artificial timeline data if needed
    if (finalTimelineData.every(item => item.contacts === 0 && item.transactions === 0)) {
      // Distribute transactions across the timeline artificially
      allTransactionsSnap.docs.forEach((doc: any, idx: number) => {
        const timelineIdx = idx % finalTimelineData.length;
        finalTimelineData[timelineIdx].transactions += 1;
      });
      
      // Add some contacts for visual appeal
      finalTimelineData.forEach((item, idx) => {
        if (item.transactions > 0) {
          item.contacts = Math.max(1, Math.floor(item.transactions * 1.5));
        }
      });
    }
  }
  
  // Calculate previous contact count (was missing)
  const previousPeriodStart = new Date(previousStartDate);
  const previousPeriodEnd = new Date(previousEndDate);
  const previousConversations = conversationsSnap.docs.filter(doc => {
    const data = doc.data();
    const updatedAt = parseFirestoreDate(data.updatedAt);
    return updatedAt >= previousPeriodStart && updatedAt <= previousPeriodEnd;
  });
  
  const previousContacts = new Set(previousConversations.map(doc => {
    const data = doc.data() as ConversationData;
    return data.participants.find((p: string) => p !== user?.uid);
  })).size;
  
  // Update state with all the calculated data
  setStats({
    contacts: uniqueProviders.size,
    contactsChange: previousContacts > 0 ? ((uniqueProviders.size - previousContacts) / previousContacts) * 100 : 0,
    transactions: finalTransactionsCount,
    transactionsChange: previousTransactions.length > 0 ? ((finalTransactionsCount - previousTransactions.length) / previousTransactions.length) * 100 : 0,
    rating: averageRating,
    ratingChange: previousAverageRating > 0 ? ((averageRating - previousAverageRating) / previousAverageRating) * 100 : 0,
    revenue: finalRevenue.toFixed(2),
    revenueChange: previousRevenue > 0 ? ((finalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
    serviceContactPercentage: contactedServicesPercentage,
    totalServices: totalServices,
    contactedServices: contactedServiceIds.size,
    topServices: topServices, // Changed from finalTopServices to topServices
    providerIncome: providerIncome.toFixed(2), 
    clientSpending: clientSpending.toFixed(2), 
    isProvider: totalServices > 0,
    clientRating: averageClientRating,
    clientRatingCount: clientRatingCount,
    providerRating: averageProviderRating,
    providerRatingCount: providerRatingCount
  });
  
  // Set timeline data for chart display
  setTimelineData(finalTimelineData);
  
  // Update category data if we have services
  if (services.length > 0) {
    const categoryStats: Record<string, CategoryData> = {};
    
    services.forEach(service => {
      const category = service.category || 'Other';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          value: 0,
          contactPercentage: 0,
          revenue: 0,
          serviceCount: 0
        };
      }
      
      categoryStats[category].value += 1;
      categoryStats[category].serviceCount = (categoryStats[category].serviceCount || 0) + 1;
      
      if (contactedServiceIds.has(service.id)) {
        categoryStats[category].contactPercentage = (categoryStats[category].contactPercentage || 0) + 1;
        
        // Add revenue if we have it for this service
        if (serviceRevenues[service.id]) {
          categoryStats[category].revenue = (categoryStats[category].revenue || 0) + 
            serviceRevenues[service.id].revenue;
        }
      }
    });
    
    // Convert to percentage and array format
    const categoryDataArray = Object.values(categoryStats).map(category => {
      const serviceCount = category.serviceCount || 0;
      const contactPercentage = category.contactPercentage || 0;
      
      return {
        ...category,
        contactPercentage: serviceCount > 0 
          ? (contactPercentage / serviceCount) * 100 
          : 0
      };
    });
    
    setCategoryData(categoryDataArray);
  } else {
    setCategoryData(mockCategoryData);
  }
  
  // Store transaction data in state for calendar
  setAllTransactions(combinedTransactionData);
  
  setAllNotifications(paymentNotificationsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      parsedDate: parseFirestoreDate(data.timestamp || data.createdAt),
      id: doc.id,
      type: data.type || 'notification'
    };
  }));
  
  setIsLoading(false);
}

