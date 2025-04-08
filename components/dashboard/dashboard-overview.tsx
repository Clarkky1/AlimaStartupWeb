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
} from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { initializeFirebase } from "@/app/lib/firebase";
import { getDoc, doc, collection, query, where, getDocs, orderBy, limit, Timestamp, documentId, onSnapshot, DocumentData, QuerySnapshot, CollectionReference, Firestore } from "firebase/firestore";
import { DashboardStats, TimelineData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

export function DashboardOverview() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const firebase = await initializeFirebase();
        if (!firebase.db || !user?.uid) throw new Error("Failed to initialize database or user not authenticated");

        console.log("Setting up listeners for user:", user.uid);
        
        // Get user's conversations
        const conversationsRef = collection(firebase.db, "conversations");
        console.log("Attempting to query conversations");
        const conversationsQuery = query(
          conversationsRef,
          where("participants", "array-contains", user.uid),
          orderBy("updatedAt", "desc")
        );
        
        // Set up real-time listener for conversations
        const conversationsUnsubscribe = onSnapshot(conversationsQuery, (conversationsSnap) => {
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
          getDocs(servicesQuery).then((servicesSnap) => {
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

            // Calculate average rating from services
            let totalRating = 0;
            let ratedServices = 0;
            servicesSnap.docs.forEach(doc => {
              const data = doc.data();
              if (data.rating && data.rating > 0) {
                totalRating += data.rating;
                ratedServices++;
              }
            });
            const averageRating = ratedServices > 0 ? totalRating / ratedServices : 0;

            // Set up previous period date for comparisons
            const previousPeriod = new Date();
            previousPeriod.setMonth(previousPeriod.getMonth() - 1);

            // Get previous period ratings
            const previousRatingsQuery = query(
              servicesRef,
              where("providerId", "==", user.uid),
              where("updatedAt", "<=", previousPeriod)
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

              // Get transactions where the provider is receiving payment - using real-time listener
              const transactionsRef = collection(db, "transactions");
              console.log("Attempting to query transactions with filter:", user.uid);
              const transactionsQuery = query(
                transactionsRef,
                where("providerId", "==", user.uid),
                where("status", "==", "confirmed")
              );
              
              // Set up real-time listener for transactions
              const transactionsUnsubscribe = onSnapshot(transactionsQuery, (transactionsSnap) => {
                console.log("Live transaction update received, count:", transactionsSnap.size);
                
                // Calculate revenue from completed transactions where user is the provider
                // Also track revenue by service
                const serviceRevenueMap = new Map<string, number>();
                const revenue = transactionsSnap.docs.reduce((sum, doc) => {
                  const data = doc.data() as TransactionData;
                  const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
                  
                  // Record revenue for each service
                  if (data.serviceId && amount) {
                    // Get current total for this service, or 0 if not yet recorded
                    const currentServiceTotal = serviceRevenueMap.get(data.serviceId) || 0;
                    serviceRevenueMap.set(data.serviceId, currentServiceTotal + amount);
                  }
                  
                  return sum + (amount || 0);
                }, 0);

                console.log("Calculated revenue:", revenue);

                // Process all the data and update state
                if (db) {
                  console.log("Processing dashboard data");
                  processAndUpdateDashboardData(
                    db,
                    user.uid,
                    timeframe,
                    conversationsSnap,
                    transactionsSnap,
                    services,
                    serviceRevenueMap,
                    uniqueProviders.size,
                    totalServices,
                    averageRating,
                    ratingChange,
                    revenue
                  );
                }
              });
              
              // Return cleanup function for transaction listener
              return () => {
                transactionsUnsubscribe();
              };
            });
          });
          
          // Return cleanup function for conversations listener
          return () => {
            conversationsUnsubscribe();
          };
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, timeframe]);

  // Separate function to process and update dashboard data to avoid duplication
  const processAndUpdateDashboardData = async (
    db: Firestore,
    userId: string,
    timeframe: string,
    conversationsSnap: QuerySnapshot<DocumentData>,
    transactionsSnap: QuerySnapshot<DocumentData>,
    services: ServiceData[],
    serviceRevenueMap: Map<string, number>,
    uniqueProvidersCount: number,
    totalServices: number,
    averageRating: number,
    ratingChange: number,
    revenue: number
  ) => {
    try {
      // Get previous period transactions for comparison
      const previousPeriod = new Date();
      previousPeriod.setMonth(previousPeriod.getMonth() - 1);
      
      const previousTransactionsQuery = query(
        collection(db, "transactions"),
        where("providerId", "==", userId),
        where("status", "==", "completed"),
        where("createdAt", "<=", previousPeriod)
      );
      const previousTransactionsSnap = await getDocs(previousTransactionsQuery);
      
      // Calculate percentage change in revenue
      let previousRevenue = 0;
      previousTransactionsSnap.docs.forEach(doc => {
        const data = doc.data() as TransactionData;
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
        previousRevenue += amount || 0;
      });
      
      const revenueChange = previousRevenue > 0 
        ? ((revenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      
      // Build category data
      const categoryCounts = new Map<string, number>();
      const categoryContactPercentage = new Map<string, number>();
      const categoryRevenue = new Map<string, number>();
      
      services.forEach(service => {
        // Get normalized category name
        const category = service.category ? formatCategoryName(service.category) : "Other";
        
        // Count services per category
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        
        // Set revenue per category
        if (serviceRevenueMap.has(service.id)) {
          categoryRevenue.set(
            category,
            (categoryRevenue.get(category) || 0) + (serviceRevenueMap.get(service.id) || 0)
          );
        }
      });
      
      // Calculate total conversations per service
      const serviceContactsMap = new Map<string, number>();
      let contactedServices = 0;
      
      conversationsSnap.docs.forEach((doc) => {
        const data = doc.data() as ConversationData;
        if (data.serviceId) {
          serviceContactsMap.set(data.serviceId, (serviceContactsMap.get(data.serviceId) || 0) + 1);
          contactedServices++;
        }
      });
      
      // Calculate percentage of services with contacts
      const serviceContactPercentage = totalServices > 0 
        ? (contactedServices / totalServices) * 100 
        : 0;
      
      // Calculate contacts percentage per category
      services.forEach(service => {
        const category = service.category ? formatCategoryName(service.category) : "Other";
        
        // Count contacts per category 
        if (serviceContactsMap.has(service.id)) {
          categoryContactPercentage.set(
            category,
            (categoryContactPercentage.get(category) || 0) + (serviceContactsMap.get(service.id) || 0)
          );
        }
      });
      
      // Consolidate category data for display
      const newCategoryData: CategoryData[] = [];
      
      categoryCounts.forEach((count, category) => {
        newCategoryData.push({
          name: category,
          value: count,
          contactPercentage: Math.round((categoryContactPercentage.get(category) || 0) / uniqueProvidersCount * 100) || 0,
          revenue: categoryRevenue.get(category) || 0
        });
      });
      
      // Sort by value in descending order
      newCategoryData.sort((a, b) => b.value - a.value);
      
      setCategoryData(newCategoryData);
      
      // Timeline data calculation
      const endDate = new Date();
      const periodCount = timeframe === "year" ? 12 : timeframe === "month" ? 30 : 7;
      const timelineData: TimelineData[] = [];
      
      for (let i = 0; i < periodCount; i++) {
        const startDate = new Date();
        let label = "";
        
        if (timeframe === "year") {
          // For yearly view, go back by months
          startDate.setMonth(endDate.getMonth() - (periodCount - i - 1));
          startDate.setDate(1);
          label = startDate.toLocaleDateString('en-US', { month: 'short' });
        } else if (timeframe === "month") {
          // For monthly view, go back by days
          startDate.setDate(endDate.getDate() - (periodCount - i - 1));
          label = startDate.getDate().toString();
        } else {
          // For weekly view, go back by days and use day name
          startDate.setDate(endDate.getDate() - (periodCount - i - 1));
          label = startDate.toLocaleDateString('en-US', { weekday: 'short' });
        }
        
        // Create entry with empty counts
        timelineData.push({
          date: label,
          contacts: 0,
          transactions: 0
        });
      }
      
      // Count conversations per time period
      conversationsSnap.docs.forEach((doc) => {
        const data = doc.data() as ConversationData;
        if (data.updatedAt) {
          const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
          let index = -1;
          
          if (timeframe === "year") {
            // Find matching month
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            index = timelineData.findIndex(item => item.date === month);
          } else if (timeframe === "month") {
            // Find matching day
            const day = date.getDate().toString();
            index = timelineData.findIndex(item => item.date === day);
          } else {
            // Find matching weekday
            const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
            index = timelineData.findIndex(item => item.date === weekday);
          }
          
          if (index !== -1) {
            timelineData[index].contacts++;
          }
        }
      });
      
      // Count transactions per time period
      transactionsSnap.docs.forEach((doc) => {
        const data = doc.data() as TransactionData;
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          let index = -1;
          
          if (timeframe === "year") {
            // Find matching month
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            index = timelineData.findIndex(item => item.date === month);
          } else if (timeframe === "month") {
            // Find matching day
            const day = date.getDate().toString();
            index = timelineData.findIndex(item => item.date === day);
          } else {
            // Find matching weekday
            const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
            index = timelineData.findIndex(item => item.date === weekday);
          }
          
          if (index !== -1) {
            timelineData[index].transactions++;
          }
        }
      });
      
      setTimelineData(timelineData);

      // Calculate transaction change percentage
      const transactionsChange = previousTransactionsSnap.size > 0 
        ? ((transactionsSnap.size - previousTransactionsSnap.size) / previousTransactionsSnap.size) * 100 
        : 0;

      // Update state with all dashboard data
      setStats({
        contacts: uniqueProvidersCount,
        contactsChange: 0, // Calculate this similarly if needed
        transactions: transactionsSnap.size,
        transactionsChange: Math.round(transactionsChange),
        rating: averageRating,
        ratingChange: Math.round(ratingChange),
        revenue: revenue.toLocaleString(),
        revenueChange: Math.round(revenueChange),
        serviceContactPercentage: Math.round(serviceContactPercentage),
        totalServices,
        contactedServices: uniqueProvidersCount
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing dashboard data:", error);
      setIsLoading(false);
    }
  };

  // Function to format currency with peso sign
  const formatCurrency = (value: string | number) => {
    // First ensure we have a number to work with
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    
    // Format with thousand separators
    return `₱${numericValue.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for header and tabs */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-[240px]" />
        </div>

        {/* Skeleton for Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton for Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Contacts by Category Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="h-[300px]">
              <div className="h-full w-full space-y-4 py-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Over Time Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="h-[300px]">
              <div className="flex h-full flex-col">
                {/* Legend Skeleton */}
                <div className="mb-2 flex justify-center space-x-8">
                  <div className="flex items-center">
                    <Skeleton className="h-3 w-3 mr-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-3 w-3 mr-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                
                {/* Chart Skeleton */}
                <div className="relative mt-6 flex-1">
                  <div className="flex h-full items-end justify-between px-6">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <Skeleton className="h-24 w-1" style={{ height: `${Math.random() * 100 + 20}px` }} />
                        <Skeleton className="mt-2 h-3 w-8" />
                      </div>
                    ))}
            </div>
            </div>
          </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if the user is available.  If not, you can either
  // return a loading state, or a message.  The key is that
  // you do NOT try to access user properties if user is null.
  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Please log in to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized greeting and time selector */}
      <div className="mb-8 flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Good {getTimeOfDay()}, {user.displayName || 'there'}!</h1>
        <p className="text-muted-foreground">
          Alima notifies you have {stats.contacts} contacts waiting for your service. You also have {stats.transactions} completed transactions.
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Overview for {timeframe === "week" ? "this week" : timeframe === "month" ? "this month" : "this year"}
          </span>
        <Tabs 
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as "week" | "month" | "year")}
          className="w-[240px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
        </div>
      </div>

      {/* Top row - Stats cards in colorful cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Contacts card */}
        <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Clients</CardTitle>
            <Users className="h-4 w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.contacts}</div>
            <div className="flex items-center mt-1">
              <div className="text-xs text-amber-800 flex items-center">
              {stats.contactsChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span className={stats.contactsChange > 0 ? "text-green-600" : "text-red-600"}>
                  {stats.contactsChange > 0 ? "+" : ""}{stats.contactsChange}%
                </span>
                <span className="ml-1 text-amber-700">from last {timeframe}</span>
              </div>
            </div>
            
            {/* Simple mini-chart visualization */}
            <div className="mt-3 flex h-12 items-end space-x-1">
              {timelineData.slice(-6).map((item, i) => {
                const maxValue = Math.max(...timelineData.slice(-6).map(d => d.contacts));
                const height = maxValue > 0 ? (item.contacts / maxValue) * 100 : 0;
                return (
                  <div 
                    key={i} 
                    className="w-full bg-amber-400/60 rounded-t"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transactions card */}
        <Card className="overflow-hidden bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-900">Transactions</CardTitle>
            <CheckCircle className="h-4 w-4 text-rose-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{stats.transactions}</div>
            <div className="flex items-center mt-1">
              <div className="text-xs text-rose-800 flex items-center">
              {stats.transactionsChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span className={stats.transactionsChange > 0 ? "text-green-600" : "text-red-600"}>
                  {stats.transactionsChange > 0 ? "+" : ""}{stats.transactionsChange}%
                </span>
                <span className="ml-1 text-rose-700">from last {timeframe}</span>
              </div>
            </div>
            
            {/* Line chart visualization */}
            <div className="mt-3 relative h-12">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d={`M0,${30 - calculateYPosition(timelineData[0]?.transactions || 0, timelineData)} ${timelineData.map((item, i) => 
                    `L${(i / (timelineData.length - 1)) * 100},${30 - calculateYPosition(item.transactions, timelineData)}`).join(' ')}`}
                  fill="none"
                  stroke="rgba(225, 29, 72, 0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Rating card */}
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Rating</CardTitle>
            <Star className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.rating.toFixed(1)}</div>
            <div className="flex items-center mt-1">
              <div className="text-xs text-green-800 flex items-center">
              {stats.ratingChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span className={stats.ratingChange > 0 ? "text-green-600" : "text-red-600"}>
                  {stats.ratingChange > 0 ? "+" : ""}{stats.ratingChange}
                </span>
                <span className="ml-1 text-green-700">from last {timeframe}</span>
              </div>
            </div>
            
            {/* Star visualization */}
            <div className="mt-3 flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.round(stats.rating) ? "text-yellow-500 fill-yellow-500" : "text-green-200"}`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue card */}
        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Revenue</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.revenue)}</div>
            <div className="flex items-center mt-1">
              <div className="text-xs text-blue-800 flex items-center">
              {stats.revenueChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span className={stats.revenueChange > 0 ? "text-green-600" : "text-red-600"}>
                  {stats.revenueChange > 0 ? "+" : ""}{stats.revenueChange}%
                </span>
                <span className="ml-1 text-blue-700">from last {timeframe}</span>
              </div>
            </div>
            
            {/* Revenue visualization */}
            <div className="mt-3 flex h-12 items-center">
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-blue-700 text-lg font-bold">₱</span>
              </div>
              <div className="flex-1 ml-2 h-1.5 bg-blue-200 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min(Math.abs(stats.revenueChange) + 30, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contacts by Category */}
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">By category:</CardTitle>
            <CardDescription className="text-green-700">
              Distribution of contacts across service categories
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <div className="h-full w-full">
              {categoryData.length > 0 ? (
                <div className="flex h-full flex-col justify-center space-y-3">
                {categoryData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-green-900">{item.name}</span>
                        <span className="text-sm font-medium text-green-900">{item.value}%</span>
                    </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-green-200">
                      <div
                          className="h-full bg-green-600"
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-green-700">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Over Time */}
        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Performance Metrics</CardTitle>
            <CardDescription className="text-blue-700">
              Contacts and transactions over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <div className="h-full w-full">
              {timelineData.length > 0 ? (
                <div className="h-full pt-4">
                  {/* Legend with standardized styling */}
                  <div className="mb-4 flex justify-end space-x-4">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-sm bg-blue-600"></div>
                      <span className="text-xs font-medium text-blue-900">Transactions</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-sm bg-blue-300"></div>
                      <span className="text-xs font-medium text-blue-900">Contacts</span>
                    </div>
                  </div>
                
                  <div className="relative h-[180px] w-full">
                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
                      {[...Array(5)].map((_, i) => {
                        const value = Math.ceil(Math.max(...timelineData.map(d => Math.max(d.contacts, d.transactions * 2))) / 4) * (4 - i);
                        return (
                          <div key={i} className="flex items-center h-8">
                            <span className="text-[10px] text-blue-500 pr-2">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Grid lines */}
                    <div className="absolute inset-y-0 left-6 right-0">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className="absolute w-full border-t border-blue-100" 
                          style={{ top: `${i * 25}%` }}
                        />
                      ))}
                      
                      {/* Chart area with cleaner styling */}
                      <svg className="h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                        {/* Area fill for contacts */}
                        <path
                          d={`M0,50 L0,${50 - (timelineData[0]?.contacts || 0)} ${timelineData.map((item, i) => 
                            `L${(i / (timelineData.length - 1)) * 100},${50 - (item.contacts)}`).join(' ')} L100,50 Z`}
                          fill="rgba(147, 197, 253, 0.2)"
                        />
                        
                        {/* Area fill for transactions */}
                        <path
                          d={`M0,50 L0,${50 - (timelineData[0]?.transactions || 0) * 2} ${timelineData.map((item, i) => 
                            `L${(i / (timelineData.length - 1)) * 100},${50 - (item.transactions * 2)}`).join(' ')} L100,50 Z`}
                          fill="rgba(37, 99, 235, 0.1)"
                        />
                        
                        {/* Contacts line */}
                        <path
                          d={`M0,${50 - (timelineData[0]?.contacts || 0)} ${timelineData.map((item, i) => 
                            `L${(i / (timelineData.length - 1)) * 100},${50 - (item.contacts)}`).join(' ')}`}
                          fill="none"
                          stroke="rgba(147, 197, 253, 0.8)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Transactions line */}
                        <path
                          d={`M0,${50 - (timelineData[0]?.transactions || 0) * 2} ${timelineData.map((item, i) => 
                            `L${(i / (timelineData.length - 1)) * 100},${50 - (item.transactions * 2)}`).join(' ')}`}
                          fill="none"
                          stroke="rgba(37, 99, 235, 0.8)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points for contacts */}
                        {timelineData.map((item, i) => (
                          <circle
                            key={`c-${i}`}
                            cx={`${(i / (timelineData.length - 1)) * 100}`}
                            cy={`${50 - (item.contacts)}`}
                            r="2"
                            className="fill-blue-300 stroke-white stroke-1"
                          />
                        ))}
                        
                        {/* Data points for transactions */}
                        {timelineData.map((item, i) => (
                          <circle
                            key={`t-${i}`}
                            cx={`${(i / (timelineData.length - 1)) * 100}`}
                            cy={`${50 - (item.transactions * 2)}`}
                            r="2"
                            className="fill-blue-600 stroke-white stroke-1"
                          />
                        ))}
                      </svg>
                    </div>
                    
                    {/* X-axis with improved labels */}
                    <div className="absolute bottom-[-20px] left-6 right-0 flex justify-between">
                      {timelineData.filter((_, i) => i % Math.ceil(timelineData.length / 6) === 0 || i === timelineData.length - 1).map((item, i) => (
                        <div key={i} className="text-xs text-blue-500">
                          {item.date}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-blue-700">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Calendar */}
      <Card className="overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-purple-900">Performance Calendar</CardTitle>
              <CardDescription className="text-purple-700">
                View your historical performance by date
              </CardDescription>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-purple-900">
                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center mt-1">
                <button 
                  onClick={() => {
                    const newDate = new Date(calendarYear, calendarMonth - 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }} 
                  className="p-1 text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded transition-colors" 
                  aria-label="Previous month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-xs text-purple-700 mx-2">Change month</span>
                <button 
                  onClick={() => {
                    const newDate = new Date(calendarYear, calendarMonth + 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }} 
                  className="p-1 text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded transition-colors" 
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
              <div key={day} className="text-xs font-medium text-purple-900 py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays(calendarMonth, calendarYear, timelineData).map((day, i) => {
              // Get activity level based on transactions and contacts
              const activityLevel = day.transactions > 3 ? 'high' : 
                                    day.transactions > 1 ? 'medium' : 
                                    day.transactions > 0 ? 'low' : 'none';
              
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
                    {day.isCurrentMonth && day.contacts > 0 && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    )}
                    
                    {/* Activity tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 hidden group-hover:block bg-white rounded-md shadow-md p-2 border text-left min-w-[120px]">
                      <p className="text-xs font-bold">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <div className="mt-1 space-y-1 text-xs">
                        <p>Contacts: {day.contacts}</p>
                        <p>Transactions: {day.transactions}</p>
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
              <span className="text-xs text-purple-900">No activity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-300"></div>
              <span className="text-xs text-purple-900">Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-400"></div>
              <span className="text-xs text-purple-900">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
              <span className="text-xs text-purple-900">High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>
            Your services by category and user engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 p-4">
              <p className="text-sm text-muted-foreground">No category data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorForCategory(category.name) }}></div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{category.value} services</span>
                      {category.contactPercentage !== undefined && category.contactPercentage > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {category.contactPercentage}% contacts
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.max(5, category.value * 10)}%`,
                        backgroundColor: getColorForCategory(category.name)
                      }}
                    ></div>
                  </div>
                  {category.revenue !== undefined && category.revenue > 0 && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Revenue</span>
                      <span>{formatCurrency(category.revenue)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// Add helper function for calculating Y position (add this near other helper functions)
function calculateYPosition(value: number, data: TimelineData[]) {
  const maxValue = Math.max(...data.map(d => Math.max(d.contacts, d.transactions)));
  return maxValue > 0 ? (value / maxValue) * 28 : 0;
}

// Update the generateCalendarDays function to use real data from timelineData
function generateCalendarDays(month = new Date().getMonth(), year = new Date().getFullYear(), timelineData: TimelineData[] = []) {
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
      transactions: 0
    };
  });
  
  // Add days for current month with real data if available
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayStr = date.getDate().toString();
    
    // Try to find matching data in timelineData for this day
    // This assumes timelineData has day numbers as the date property when in "month" view
    let contacts = 0;
    let transactions = 0;
    
    if (month === new Date().getMonth() && year === new Date().getFullYear()) {
      // For current month, try to match with timelineData if in month view
      const matchingData = timelineData.find((item: TimelineData) => item.date === dayStr);
      if (matchingData) {
        contacts = matchingData.contacts;
        transactions = matchingData.transactions;
      }
    }
    
    days.push({
      date,
      isCurrentMonth: true,
      contacts,
      transactions
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
        transactions: 0
      });
    }
  }
  
  return days;
}

// Helper function to format category name for display
function formatCategoryName(category: string) {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get color for a category
function getColorForCategory(category: string) {
  // Map each category to a specific vibrant color
  switch (category.toLowerCase()) {
    case "development":
      return "#FF5733"; // Vibrant orange/red for Development
    case "design":
      return "#33B5FF"; // Bright blue for Design
    case "marketing":
      return "#6633FF"; // Purple for Marketing
    case "writing":
      return "#33FF57"; // Green for Writing
    case "education":
      return "#FFD133"; // Golden yellow for Education
    case "pc & smartphone":
    case "pc and smartphone":  
      return "#3399FF"; // Azure blue for PC & Smartphone
    case "social media":
      return "#FF33A8"; // Pink for Social Media
    case "finance":
      return "#00CC99"; // Teal for Finance
    case "health":
      return "#FF6B8E"; // Salmon pink for Health
    case "consultation":
      return "#9966FF"; // Lavender for Consultation
    default:
      // Generate a deterministic color based on category name if not in the list
      const hash = [...category].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = hash % 360;
      return `hsl(${hue}, 70%, 60%)`; // Generate a vibrant color with good saturation and lightness
  }
}
