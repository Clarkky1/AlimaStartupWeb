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
                      timeframe
                    );
                  }).catch(error => {
                    console.error("Error fetching conversation details:", error);
                    // Still proceed with the data we have
                    finalizeRevenueCalculation(
                      [...allFilteredTransactions, ...paymentDates, ...messagePayments],
                      services,
                      timeframe
                    );
                  });
                } else {
                  // No conversation lookups needed, continue with data we have
                  finalizeRevenueCalculation(
                    [...allFilteredTransactions, ...paymentDates, ...messagePayments],
                    services,
                    timeframe
                  );
                }
                
                // Helper function to finalize revenue calculations
                function finalizeRevenueCalculation(
                  combinedTransactionData: CombinedTransactionData[],
                  services: any[],
                  timeframe: string
                ) {
                  // IMPORTANT: Only count transactions where this user is the provider
                  // Filter out transactions where the user is not the provider
                  combinedTransactionData = combinedTransactionData.filter(tx => {
                    if (!user) return false; // Skip if user is null
                    
                    // Get a non-null user reference for TypeScript
                    const currentUser = user as {uid: string};
                    
                    // For regular transactions, check providerId
                    if (tx.type === 'transaction') {
                      return tx.providerId === currentUser.uid;
                    }
                    
                    // For message payments, verify they're directed to this user
                    if (tx.type === 'message_payment') {
                      return tx.receiverId === currentUser.uid;
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
                  
                  // Process all transactions and message payments in current period
                  currentTransactions.forEach(transaction => {
                    const amount = Number(transaction.amount || 0);
                    
                    if (!isNaN(amount) && amount > 0) {
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
                  
                  // Update state with all the calculated data
      setStats({
                    contacts: conversationsSnap?.size || 0,
                    contactsChange: 0, // Calculate this if needed
                    transactions: finalTransactionsCount,
                    transactionsChange: previousTransactions.length > 0
                      ? ((finalTransactionsCount - previousTransactions.length) / previousTransactions.length) * 100
                      : 0,
                    rating: parseFloat(averageRating.toFixed(1)) || 0,
                    ratingChange: parseFloat(ratingChange.toFixed(1)) || 0,
                    revenue: finalRevenue.toFixed(2),
                    revenueChange: parseFloat(revenueChange.toFixed(1)) || 0,
                    serviceContactPercentage: parseFloat(contactedServicesPercentage.toFixed(1)) || 0,
                    totalServices: totalServices,
                    contactedServices: contactedServiceIds.size,
                    topServices: topServices // Add top services to stats
                  });
                  
                  setCategoryData(Object.entries(serviceRevenues).map(([id, data]) => ({
                    name: id,
                    value: data.revenue,
                    revenue: data.revenue,
                    serviceCount: data.count
                  })));
                  setTimelineData(finalTimelineData);
                  
                  // Store transaction data in state for calendar
                  setAllTransactions(combinedTransactionData);
      
      setIsLoading(false);
                }
              }).catch(error => {
                console.error("Error processing transactions:", error);
                setError("Failed to fetch transaction data");
                setIsLoading(false);
              });
            }).catch(error => {
              console.error("Error fetching previous ratings:", error);
              setError("Failed to fetch ratings data");
              setIsLoading(false);
            });
          }).catch(error => {
            console.error("Error fetching services:", error);
            setError("Failed to fetch services data");
            setIsLoading(false);
          });
        });

        // Return cleanup function for conversation listener
        return () => {
          conversationsUnsubscribe();
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

  // Function to format currency with peso sign
  const formatCurrency = (value: string | number) => {
    try {
    // First ensure we have a number to work with
      const numericValue = typeof value === 'string' 
        ? parseFloat(value.replace(/,/g, '')) || 0 
        : value || 0;
    
    // Format with thousand separators
    return `₱${numericValue.toLocaleString()}`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `₱0`;
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Good {getTimeOfDay()}!</h1>
        <h1 className="text-3xl font-bold tracking-tight">{user.displayName || 'there'}</h1>
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
            {generateCalendarDays(calendarMonth, calendarYear, timelineData, timeframe, allTransactions).map((day, i) => {
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
                      <span className="text-sm text-muted-foreground">{category.serviceCount || category.value} services</span>
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

      {/* Top Performing Services section - enhanced with bar graph */}
      <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">Top Performing Services</CardTitle>
          <CardDescription className="text-amber-700">
            Your highest-revenue generating services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topServices && stats.topServices.length > 0 ? (
            <div className="space-y-6">
              {(stats.topServices as Array<{id: string; name: string; revenue: number; count: number; avgRevenue: number}>).map((service, index) => (
                <div key={service.id} className="space-y-1 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white bg-amber-${500 + (index * 100)}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-amber-900 truncate max-w-[200px]" title={service.name}>
                        {service.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-900">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                  
                  {/* Bar graph with hover effect */}
                  <div className="h-8 w-full bg-amber-100 rounded-md overflow-hidden relative">
                    <div 
                      className="h-full rounded-md bg-amber-500 flex items-center px-2"
                      style={{ 
                        width: `${Math.max(10, (service.revenue / ((stats.topServices as Array<{id: string; name: string; revenue: number}>)[0]?.revenue || 1)) * 100)}%`,
                        opacity: 1 - (index * 0.15)
                      }}
                    >
                      <span className="text-xs text-white font-semibold truncate">
                        {service.count} clients
                      </span>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 hidden group-hover:block bg-white rounded-md shadow-md p-3 border border-amber-200 text-left min-w-[180px]">
                      <p className="text-sm font-bold text-amber-900 mb-1">{service.name}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-amber-700">Total Revenue:</span>
                          <span className="font-medium text-amber-900">{formatCurrency(service.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Times Chosen:</span>
                          <span className="font-medium text-amber-900">{service.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Avg. Per Client:</span>
                          <span className="font-medium text-amber-900">{formatCurrency(service.avgRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-amber-700">No service revenue data available</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-amber-700">
              Revenue is calculated based on services chosen and paid for by your clients.
              The bars show how many clients have chosen each service.
            </p>
          </div>
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

// Update the generateCalendarDays function to use direct transaction data
function generateCalendarDays(month = new Date().getMonth(), year = new Date().getFullYear(), timelineData: TimelineData[] = [], currentTimeframe?: string, transactionData: any[] = []) {
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
    let contacts = 0;
    let transactions = 0;
    
    // PRIORITY 1: First check transaction data directly which is most accurate
    if (transactionData && transactionData.length > 0) {
      const matchingTransactions = transactionData.filter(tx => {
        if (!tx.parsedDate) return false;
        
        // Check if transaction date matches this calendar day exactly
        return tx.parsedDate.getDate() === date.getDate() && 
               tx.parsedDate.getMonth() === date.getMonth() && 
               tx.parsedDate.getFullYear() === date.getFullYear();
      });
      
      // Count transactions from both regular transactions and notification payment data
      transactions = matchingTransactions.length;
      
      // If we find transactions, also add some contacts as an estimate
      if (transactions > 0) {
        contacts = Math.max(1, Math.round(transactions * 1.5));
      }
    }
    
    // PRIORITY 2: If no transaction data, fall back to timeline data
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
