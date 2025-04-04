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
import { getDoc, doc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { DashboardStats, CategoryData, TimelineData } from "@/types";

// Mock data for charts
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const firebase = await initializeFirebase();
        if (!firebase.db || !user?.uid) throw new Error("Failed to initialize database or user not authenticated");

        // Get user's conversations
        const conversationsRef = collection(firebase.db, "conversations");
        const conversationsQuery = query(
          conversationsRef,
          where("participants", "array-contains", user.uid),
          orderBy("updatedAt", "desc")
        );
        const conversationsSnap = await getDocs(conversationsQuery);
        const uniqueProviders = new Set(conversationsSnap.docs.map(doc => {
          const data = doc.data();
          return data.participants.find((p: string) => p !== user.uid);
        }));

        // Get total services count and calculate average rating
        const servicesRef = collection(firebase.db, "services");
        const servicesQuery = query(servicesRef, where("providerId", "==", user.uid));
        const servicesSnap = await getDocs(servicesQuery);
        const totalServices = servicesSnap.size;

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
        const previousRatingsSnap = await getDocs(previousRatingsQuery);
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

        // Get user's transactions
        const transactionsRef = collection(firebase.db, "transactions");
        const transactionsQuery = query(
          transactionsRef,
          where("userId", "==", user.uid),
          where("status", "==", "completed")
        );
        const transactionsSnap = await getDocs(transactionsQuery);

        // Calculate revenue from completed transactions
        const revenue = transactionsSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
          return sum + (amount || 0);
        }, 0);

        // Get previous period transactions
        const previousTransactionsQuery = query(
          transactionsRef,
          where("userId", "==", user.uid),
          where("status", "==", "completed"),
          where("createdAt", "<=", previousPeriod)
        );
        const previousTransactionsSnap = await getDocs(previousTransactionsQuery);
        const previousRevenue = previousTransactionsSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
          return sum + (amount || 0);
        }, 0);

        const revenueChange = previousRevenue > 0 
          ? ((revenue - previousRevenue) / previousRevenue) * 100 
          : 0;

        // Calculate service contact percentage
        const serviceContactPercentage = totalServices > 0 
          ? (uniqueProviders.size / totalServices) * 100 
          : 0;

        setStats({
          contacts: uniqueProviders.size,
          contactsChange: 0,
          transactions: transactionsSnap.size,
          transactionsChange: 0,
          rating: averageRating,
          ratingChange: Math.round(ratingChange),
          revenue: revenue.toLocaleString(),
          revenueChange: Math.round(revenueChange),
          serviceContactPercentage: Math.round(serviceContactPercentage),
          totalServices,
          contactedServices: uniqueProviders.size
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, timeframe]);

  // Function to format currency with peso sign
  const formatCurrency = (value: string | number) => {
    return `₱${value}`;
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
      <div className="w-full p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-[60px] bg-muted/20"></CardHeader>
              <CardContent className="h-[60px] bg-muted/10"></CardContent>
            </Card>
          ))}
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Tabs 
          defaultValue="month" 
          className="w-[240px]" 
          onValueChange={(value) => setTimeframe(value as "week" | "month" | "year")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.contactsChange > 0 ? (
                <span className="flex items-center text-green-500">
                  <TrendingUp className="mr-1 h-3 w-3" />+{stats.contactsChange}% from last {timeframe}
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {stats.contactsChange}% from last {timeframe}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful Transactions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.transactionsChange > 0 ? (
                <span className="flex items-center text-green-500">
                  <TrendingUp className="mr-1 h-3 w-3" />+{stats.transactionsChange}% from last {timeframe}
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {stats.transactionsChange}% from last {timeframe}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ratingChange > 0 ? (
                <span className="flex items-center text-green-500">
                  <TrendingUp className="mr-1 h-3 w-3" />+{stats.ratingChange} from last {timeframe}
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {stats.ratingChange} from last {timeframe}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueChange > 0 ? (
                <span className="flex items-center text-green-500">
                  <TrendingUp className="mr-1 h-3 w-3" />+{stats.revenueChange}% from last {timeframe}
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {stats.revenueChange}% from last {timeframe}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Contact Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.serviceContactPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.contactedServices} of {stats.totalServices} services contacted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacts by Category</CardTitle>
            <CardDescription>
              Distribution of user contacts across service categories
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="h-full w-full">
              <div className="flex h-full flex-col justify-center space-y-2">
                {mockCategoryData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Contacts and successful transactions over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="h-full w-full">
              <div className="flex h-full items-end justify-between">
                {mockTimelineData.map((item) => (
                  <div key={item.date} className="flex flex-col items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <div
                        className="w-8 bg-primary"
                        style={{ height: `${item.transactions * 3}px` }}
                      ></div>
                      <div
                        className="w-8 bg-primary/30"
                        style={{
                          height: `${(item.contacts - item.transactions) * 3}px`,
                        }}
                      ></div>
                    </div>
                    <span className="mt-2 text-xs">{item.date}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 bg-primary"></div>
                  <span className="text-xs">Transactions</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 bg-primary/30"></div>
                  <span className="text-xs">Contacts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
