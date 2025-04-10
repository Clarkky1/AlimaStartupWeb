"use client"

import React, { useRef, useEffect } from "react"
import { useState, useEffect as useEffectState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, ArrowLeft, Upload, X, Phone, Mail, MapPin, Star, Info, SendHorizontal } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { initializeFirebase } from "@/app/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RatingModal } from "@/components/messages/rating-modal"

// Add a new UploadPaymentProofDialog component
const UploadPaymentProofDialog = ({ 
  onUpload, 
  providerId,
  open,
  onOpenChange
}: { 
  onUpload: (imageUrl: string, serviceId?: string, amount?: number) => void; 
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get the provider's services for the dropdown
  const [providerServices, setProviderServices] = useState<Array<{id: string, title: string, price?: number | string}>>([]);
  
  useEffectState(() => {
    async function fetchServices() {
      if (!providerId) return;
      
      try {
        const { db } = await initializeFirebase();
        if (!db) return;
        
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        
        const q = query(
          collection(db, "services"),
          where("providerId", "==", providerId)
        );
        
        const snapshot = await getDocs(q);
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as {title: string, price?: number | string}
        }));
        
        setProviderServices(servicesData);
        
        // Set first service as default
        if (servicesData.length > 0) {
          setSelectedService(servicesData[0].id);
          if (servicesData[0].price) {
            setPaymentAmount(String(servicesData[0].price));
          }
        }
      } catch (error) {
        console.error("Error fetching provider services:", error);
      }
    }
    
    fetchServices();
  }, [providerId]);

  const handleUpload = async (file: File) => {
    // File validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, GIF or WebP)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `payment-proofs/${user?.uid || "unknown"}`);
      
      // Add provider ID for consistent fallback avatars
      if (providerId) {
        formData.append('providerId', providerId);
      }

      // Use the API route for more consistent uploads
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const data = await response.json();
      
      // Call onUpload with service info and payment amount
      onUpload(
        data.secure_url, 
        selectedService || undefined, 
        paymentAmount ? parseFloat(paymentAmount) : undefined
      );
      
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully",
      });
      
      // Close dialog after successful upload
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      toast({
        title: "Error",
        description: "Failed to upload payment proof",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Upload proof of payment and specify the service and amount.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {providerServices.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <select
                id="service"
                value={selectedService || ''}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  // Auto-fill amount based on selected service
                  const service = providerServices.find(s => s.id === e.target.value);
                  if (service?.price) {
                    setPaymentAmount(String(service.price));
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {providerServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title} {service.price ? `- ₱${service.price}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">₱</span>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-proof">Payment Proof Image</Label>
            <Input
              id="payment-proof"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                }
              }}
            />
            {selectedFile && (
              <div className="relative mt-2">
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Selected file preview" 
                  className="max-h-40 w-full object-contain rounded-md border"
                />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2" 
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedFile && handleUpload(selectedFile)}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Uploading...
              </>
            ) : (
              <>Upload</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function MessagePage({ params }: { params: { providerId: string } }) {
  const { providerId } = params;
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [provider, setProvider] = useState<any>(null)
  const [providerServices, setProviderServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [messageType, setMessageType] = useState<"text" | "payment">("text");
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  // Add state for messages loading
  const [messagesLoading, setMessagesLoading] = useState(true)

  // Add state for the rating dialog
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingService, setRatingService] = useState<{
    serviceId: string;
    serviceTitle?: string;
    providerId: string;
    providerName: string;
    transactionId?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add state for mobile navigation
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'contacts' | 'info'>('contacts');

  // Check welcome message status on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined' && user && providerId) {
      const participants = [user.uid, providerId].sort();
      const conversationId = participants.join('_');
      const welcomeShownKey = `welcome_shown_${conversationId}`;
      const welcomeShown = localStorage.getItem(welcomeShownKey);
      
      if (welcomeShown) {
        setShowWelcomeMessage(false);
      } else {
        // Set it to shown
        localStorage.setItem(welcomeShownKey, 'true');
        setShowWelcomeMessage(true);
      }
    }
  }, [user, providerId]);

  // Determine if chat user is a provider
  const isChatUserProvider = provider?.role === 'provider';

  // Function to determine role-based text
  const getRoleBasedText = (isProvider: boolean) => {
    return {
      title: isProvider ? "About Provider" : "About Client",
      roleLabel: isProvider ? "Service Provider" : "Client"
    };
  };

  const roleText = getRoleBasedText(isChatUserProvider);

  const scrollToBottom = () => {
    // More aggressive scrolling with multiple attempts to ensure it works
    const scrollAction = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    
    // Immediate attempt
    scrollAction();
    
    // Multiple delayed attempts to ensure scrolling works after rendering/image loading
    setTimeout(scrollAction, 100);
    setTimeout(scrollAction, 300);
    setTimeout(scrollAction, 500);
  }

  // Add this useEffect for auto-scrolling
  useEffect(() => {
    if (messages.length > 0 && !messagesLoading) {
      scrollToBottom();
    }
  }, [messages, messagesLoading]);
  
  // Add handler for image loading to ensure scroll after images load
  const handleImageLoaded = () => {
    scrollToBottom();
  };

  useEffectState(() => {
    async function fetchProviderData() {
      if (authLoading) return

      if (!user) {
        // Skip provider data fetching - we'll show login UI instead
        setLoading(false)
        return
      }

      // Check if user is trying to message themselves
      if (user.uid === providerId) {
        toast({
          title: "Action not allowed",
          description: "You cannot message yourself",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      try {
        const { db } = await initializeFirebase()
        if (!db) {
          toast({
            title: "Error",
            description: "Failed to initialize Firebase",
            variant: "destructive",
          })
          return
        }

        const { doc, getDoc, collection, getDocs, query, where } = await import("firebase/firestore")
        
        // Fetch provider profile
        const providerDoc = await getDoc(doc(db, "users", providerId))
        if (providerDoc.exists()) {
          setProvider({
            id: providerDoc.id,
            ...providerDoc.data(),
          })
          
          // Fetch provider's services
          const servicesQuery = query(
            collection(db, "services"), 
            where("providerId", "==", providerId),
            where("active", "==", true)
          )
          
          const servicesSnapshot = await getDocs(servicesQuery)
          const servicesData: any[] = []
          
          servicesSnapshot.forEach((doc) => {
            servicesData.push({
              id: doc.id,
              ...doc.data(),
            })
          })
          
          setProviderServices(servicesData)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching provider data:", error)
        toast({
          title: "Error",
          description: "Failed to load provider information",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchProviderData()
  }, [providerId, authLoading, user])

  useEffectState(() => {
    async function fetchMessages() {
      if (authLoading) return;
      
      if (!user || !providerId) {
        // Skip fetching messages if user is not logged in
        return;
      }

      try {
        setMessagesLoading(true); // Start loading messages
        const { db } = await initializeFirebase();
        if (!db) throw new Error("Failed to initialize Firebase");
        
        const { collection, query, where, orderBy, onSnapshot, doc, getDoc } = await import("firebase/firestore");

        const participants = [user.uid, providerId].sort();
        const conversationId = participants.join('_');
        
        const messagesQuery = query(
          collection(db, "messages"),
          where("conversationId", "==", conversationId),
          orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
          const messagesList: any[] = [];
          for (const messageDoc of snapshot.docs) {
            const messageData = messageDoc.data();
            const senderId = messageData.senderId;
            
            // Get sender's profile data
            const senderDocRef = doc(db, "users", senderId);
            const senderDoc = await getDoc(senderDocRef);
            const senderData = senderDoc.data() || {};
            
            // Determine if sender is provider or client
            const isProvider = senderData.role === 'provider';
            
            messagesList.push({
              id: messageDoc.id,
              ...messageData,
              timestamp: messageData.timestamp?.toDate(),
              senderName: isProvider ? 
                (senderData.name || senderData.displayName || "Provider") : 
                (senderData.name || senderData.displayName || "Client"),
              senderAvatar: senderData.profilePicture || senderData.avatar || null
            });
          }
          setMessages(messagesList);
          setMessagesLoading(false); // End loading messages
          scrollToBottom();
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessagesLoading(false); // End loading on error
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      }
    }

    fetchMessages();
  }, [user, providerId, authLoading]);

  // Add effect to mark messages as read when viewing them
  useEffectState(() => {
    async function markMessagesAsRead() {
      if (!user || !providerId) return;
      
      try {
        const { db } = await initializeFirebase();
        if (!db) return;
        
        const { collection, query, where, getDocs, writeBatch, doc } = await import("firebase/firestore");
        
        const participants = [user.uid, providerId].sort();
        const conversationId = participants.join('_');
        
        // Find all unread messages where the current user is the receiver
        const q = query(
          collection(db, "messages"),
          where("conversationId", "==", conversationId),
          where("receiverId", "==", user.uid),
          where("read", "==", false)
        );
        
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;
        
        // Use batch update for efficiency
        const batch = writeBatch(db);
        
        snapshot.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
        console.log(`Marked ${snapshot.size} messages as read`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
    
    // Mark messages as read whenever messages are loaded or change
    if (messages.length > 0 && !messagesLoading) {
      markMessagesAsRead();
    }
  }, [user, providerId, messages, messagesLoading]);

  // Fetch user's conversations
  useEffectState(() => {
    async function fetchContacts() {
      if (!user || authLoading) return
      
      try {
        const { db } = await initializeFirebase()
        if (!db) throw new Error("Failed to initialize Firebase")
        
        const { collection, query, where, orderBy, onSnapshot, doc, getDoc } = await import("firebase/firestore")
        
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTime", "desc")
        )
        
        const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
          const contactsList: any[] = []
          
          for (const convDoc of snapshot.docs) {
            const convData = convDoc.data()
            
            // Find the other participant (not the current user)
            const otherUserId = convData.participants.find((id: string) => id !== user.uid)
            
            // Get other user's profile
            const userDocRef = doc(db, "users", otherUserId)
            const userDoc = await getDoc(userDocRef)
            const userData = userDoc.data() || {}
            
            contactsList.push({
              id: convDoc.id,
              ...convData,
              contactId: otherUserId,
              contactName: userData.name || userData.displayName || "User",
              contactAvatar: userData.profilePicture || userData.avatar || null,
              lastMessageTime: convData.lastMessageTime?.toDate()
            })
          }
          
          setContacts(contactsList)
        })
        
        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching contacts:", error)
      }
    }
    
    fetchContacts()
  }, [user, authLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!message.trim() && !paymentProofUrl) || !user) return

    // Another check to prevent self-messaging
    if (user.uid === providerId) {
      toast({
        title: "Action not allowed",
        description: "You cannot message yourself",
        variant: "destructive",
      })
      return
    }

    try {
      // Collect the message data before sending to use for optimistic UI update
      const newMessageText = message.trim();
      
      // Clear the message input immediately for better UX
      setMessage("");
      setPaymentProofUrl(null);
      
      // Scroll to bottom after sending a message
      scrollToBottom();
      
      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      const { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } = await import("firebase/firestore")

      // Get user profile data first
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data() || {}
      const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous"

      // Create conversation ID and participants array
      const participants = [user.uid, providerId].sort()
      const conversationId = participants.join('_')
      const timestamp = serverTimestamp()

      // Create/update conversation data with service information if available
      const conversationData: any = {
        participants,
        lastMessage: paymentProofUrl ? "Payment proof attached" : message,
        lastMessageTime: timestamp,
        lastSenderId: user.uid,
        lastSenderName: userName,
        lastSenderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
      }
      
      // Include service info if available
      if (selectedService) {
        conversationData.serviceId = selectedService.id
        conversationData.serviceTitle = selectedService.title
        conversationData.servicePrice = selectedService.price
      }
      
      await setDoc(doc(db, "conversations", conversationId), conversationData, { merge: true })

      // Add the message
      const messageData: any = {
        conversationId,
        senderId: user.uid,
        senderName: userName,
        senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
        receiverId: providerId,
        text: message.trim() ? message : "Payment proof attached",
        timestamp,
        read: false,
      }
      
      if (paymentProofUrl) {
        messageData.paymentProof = paymentProofUrl
      }
      
      if (selectedService) {
        messageData.serviceId = selectedService.id
        messageData.serviceTitle = selectedService.title
      }
      
      await addDoc(collection(db, "messages"), messageData)

      // Create notification for provider
      const notificationData: any = {
        userId: providerId,
        type: paymentProofUrl ? "payment_proof" : "message",
        title: paymentProofUrl ? "Payment Proof Received" : "New Message",
        description: paymentProofUrl 
          ? `${userName} sent you a payment proof`
          : `${userName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
        timestamp,
        read: false,
        data: {
          conversationId,
          senderId: user.uid,
          senderName: userName,
          senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
          messageText: message,
        }
      }
      
      if (paymentProofUrl) {
        notificationData.data.paymentProofUrl = paymentProofUrl
      }
      
      if (selectedService) {
        notificationData.data.serviceId = selectedService.id
        notificationData.data.serviceTitle = selectedService.title
      }
      
      await addDoc(collection(db, "notifications"), notificationData)

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })

      // Remove the router.push to stay on the current page
      // router.push("/dashboard/messages") // This line should be removed
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  // Keep existing handlePaymentProofUpload for backward compatibility
  const handlePaymentProofUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', `payment-proofs/${user?.uid || "unknown"}`)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setPaymentProofUrl(data.secure_url)
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading payment proof:', error)
      toast({
        title: "Error",
        description: "Failed to upload payment proof",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Add the new handleSendPaymentProof function
  const handleSendPaymentProof = async (paymentInfo: {
    text: string;
    paymentProof: string;
    serviceId?: string;
    serviceTitle?: string;
    paymentAmount?: number;
  }) => {
    if (!user) return;

    // Another check to prevent self-messaging
    if (user.uid === providerId) {
      toast({
        title: "Action not allowed",
        description: "You cannot message yourself",
        variant: "destructive",
      })
      return
    }

    try {
      const { db } = await initializeFirebase();
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        });
        return;
      }

      const { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } = await import("firebase/firestore");

      // Get user profile data first
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() || {};
      const userName = userData?.displayName || userData?.name || user.displayName || "Anonymous";

      // Create conversation ID and participants array
      const participants = [user.uid, providerId].sort();
      const conversationId = participants.join('_');
      const timestamp = serverTimestamp();

      // Create/update conversation data with service information if available
      const conversationData: any = {
        participants,
        lastMessage: "Payment proof attached",
        lastMessageTime: timestamp,
        lastSenderId: user.uid,
        lastSenderName: userName,
        lastSenderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
      };
      
      // Include service info if available
      let serviceTitle = paymentInfo.serviceTitle;
      if (paymentInfo.serviceId && !serviceTitle) {
        // Try to get the service title from the selected service
        if (selectedService && selectedService.id === paymentInfo.serviceId) {
          serviceTitle = selectedService.title;
        } else {
          // Try to get from provider services
          const serviceDoc = await getDoc(doc(db, "services", paymentInfo.serviceId));
          if (serviceDoc.exists()) {
            serviceTitle = serviceDoc.data().title;
          }
        }
      }
      
      if (paymentInfo.serviceId) {
        conversationData.serviceId = paymentInfo.serviceId;
        conversationData.serviceTitle = serviceTitle;
        if (paymentInfo.paymentAmount) {
          conversationData.servicePrice = paymentInfo.paymentAmount;
        }
      } else if (selectedService) {
        conversationData.serviceId = selectedService.id;
        conversationData.serviceTitle = selectedService.title;
        conversationData.servicePrice = selectedService.price;
      }
      
      await setDoc(doc(db, "conversations", conversationId), conversationData, { merge: true });

      // Add the message
      const messageData: any = {
        conversationId,
        senderId: user.uid,
        senderName: userName,
        senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
        receiverId: providerId,
        text: paymentInfo.text || "Payment proof attached",
        timestamp,
        read: false,
        paymentProof: paymentInfo.paymentProof,
        paymentAmount: paymentInfo.paymentAmount || 0
      };
      
      if (paymentInfo.serviceId) {
        messageData.serviceId = paymentInfo.serviceId;
        messageData.serviceTitle = serviceTitle;
      } else if (selectedService) {
        messageData.serviceId = selectedService.id;
        messageData.serviceTitle = selectedService.title;
      }
      
      await addDoc(collection(db, "messages"), messageData);

      // Create notification for provider
      const notificationData: any = {
        userId: providerId,
        type: "payment_proof",
        title: `Payment Proof: ${serviceTitle || "Service"}`,
        description: paymentInfo.paymentAmount 
          ? `${userName} sent payment proof of ₱${paymentInfo.paymentAmount}` 
          : `${userName} sent you a payment proof`,
        timestamp,
        read: false,
        data: {
          conversationId,
          senderId: user.uid,
          senderName: userName,
          senderAvatar: user.photoURL || userData?.profilePicture || userData?.avatar || null,
          messageText: paymentInfo.text || "Payment proof attached",
          paymentProofUrl: paymentInfo.paymentProof,
          paymentAmount: paymentInfo.paymentAmount || 0
        }
      };
      
      if (paymentInfo.serviceId) {
        notificationData.data.serviceId = paymentInfo.serviceId;
        notificationData.data.serviceTitle = serviceTitle;
      } else if (selectedService) {
        notificationData.data.serviceId = selectedService.id;
        notificationData.data.serviceTitle = selectedService.title;
      }
      
      await addDoc(collection(db, "notifications"), notificationData);

      toast({
        title: "Payment proof sent",
        description: "Your payment proof has been sent successfully",
      });

      // Clear the payment proof after sending
      setPaymentProofUrl(null);
      
    } catch (error) {
      console.error("Error sending payment proof:", error);
      toast({
        title: "Error",
        description: "Failed to send payment proof",
        variant: "destructive",
      });
    }
  };

  // Function to open payment proof dialog
  const openPaymentProofDialog = () => {
    // Find the UploadPaymentProofDialog component and set its open state to true
    setPaymentProofOpen(true);
  };

  // Add state for dialog visibility
  const [paymentProofOpen, setPaymentProofOpen] = useState(false);

  // Add this effect to check for rating notifications
  useEffectState(() => {
    if (!user) return;
    
    async function checkForRatingNotifications() {
      console.log("Checking for rating notifications...");
      try {
        const { db } = await initializeFirebase();
        if (!db) {
          console.log("Firebase DB not initialized");
          return;
        }
        
        const { collection, query, where, getDocs, limit, doc, updateDoc } = await import("firebase/firestore");
        
        // Find unread payment confirmation notifications
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user?.uid),
          where("type", "==", "payment_confirmed_rating"),
          where("read", "==", false),
          limit(1)
        );
        
        console.log("Looking for notifications for user:", user?.uid);
        const snapshot = await getDocs(notificationsQuery);
        
        console.log("Found notifications:", snapshot.size);
        
        if (!snapshot.empty) {
          const notification = snapshot.docs[0];
          const data = notification.data();
          console.log("Notification data:", JSON.stringify(data, null, 2));
          
          // Check if the data structure is as expected
          if (data && data.data) {
            console.log("Found data object with properties:", Object.keys(data.data).join(", "));
            
            // Show rating dialog
            const serviceInfo = {
              serviceId: data.data.serviceId || "",
              serviceTitle: data.data.serviceTitle || "Service",
              providerId: data.data.providerId || providerId,
              providerName: data.data.providerName || (provider?.name || provider?.displayName || "Provider"),
              transactionId: data.data.transactionId || ""
            };
            
            console.log("Setting rating service data:", JSON.stringify(serviceInfo, null, 2));
            setRatingService(serviceInfo);
            setRatingDialogOpen(true);
            
            // Mark the notification as read
            await updateDoc(doc(db, "notifications", notification.id), {
              read: true
            });
            console.log("Marked notification as read");
          } else {
            console.log("Notification missing required data structure");
          }
        } else {
          console.log("No unread rating notifications found");
        }
      } catch (error) {
        console.error("Error checking for rating notifications:", error);
      }
    }
    
    // Check when component loads
    console.log("Initial check for rating notifications");
    checkForRatingNotifications();
    
    // Set up interval to periodically check (every 10 seconds for faster checking)
    console.log("Setting up notification check interval");
    const intervalId = setInterval(checkForRatingNotifications, 10000);
    
    return () => {
      console.log("Clearing notification check interval");
      clearInterval(intervalId);
    };
  }, [user, provider, providerId]);

  if (loading || authLoading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="h-8 px-2 mb-4 flex items-center" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>
              Please log in or create an account to message this service provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img src="/AlimaLOGO.svg" alt="Alima Logo" className="h-16 w-16 mb-4" />
            <p className="text-center mb-6">
              Connecting with service providers requires an account to ensure secure and reliable communications.
            </p>
            <div className="flex gap-4 w-full">
              <Button 
                className="flex-1" 
                onClick={() => router.push(`/login?returnUrl=/message/${providerId}`)}
              >
                Login
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push(`/signup?returnUrl=/message/${providerId}`)}
              >
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Provider Not Found</h2>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return ""
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-h-screen flex flex-col">
      <div className="flex justify-start mb-3 mt-0 sm:mt-2 -ml-2">
        <Button variant="ghost" className="h-8 px-2 flex items-center" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Mobile Tab Navigation - Only visible on mobile */}
      <div className="flex border-b md:hidden bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          className={`flex-1 rounded-none ${activeMobileTab === 'contacts' ? 'border-b-2 border-primary font-medium bg-primary/5' : 'text-gray-600'}`}
          onClick={() => setActiveMobileTab('contacts')}
        >
          {activeMobileTab === 'contacts' ? (
            <div className="flex items-center">
              <span className="mr-1.5">Contacts</span>
            </div>
          ) : (
            "Contacts"
          )}
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 rounded-none ${activeMobileTab === 'chat' ? 'border-b-2 border-primary font-medium bg-primary/5' : 'text-gray-600'}`}
          onClick={() => setActiveMobileTab('chat')}
        >
          {activeMobileTab === 'chat' ? (
            <div className="flex items-center">
              <span className="mr-1.5">Chat</span>
            </div>
          ) : (
            "Chat"
          )}
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 rounded-none ${activeMobileTab === 'info' ? 'border-b-2 border-primary font-medium bg-primary/5' : 'text-gray-600'}`}
          onClick={() => setActiveMobileTab('info')}
        >
          {activeMobileTab === 'info' ? (
            <div className="flex items-center">
              <span className="mr-1.5">Info</span>
            </div>
          ) : (
            "Info"
          )}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-5">
        {/* Contacts Sidebar - Hidden on mobile unless active */}
        <div className={`md:col-span-1 ${activeMobileTab === 'contacts' ? 'block' : 'hidden md:block'}`}>
          <Card className="h-full bg-white/90 backdrop-blur-md shadow-sm">
            <CardHeader className="p-3">
              <CardTitle className="text-base">Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-350px)] md:max-h-[calc(100vh-320px)] overflow-y-auto">
                {contacts.length > 0 ? (
                  <div className="divide-y">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id}
                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors ${
                          contact.contactId === providerId ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => {
                          router.push(`/message/${contact.contactId}`);
                          // Keep on contacts tab instead of switching to chat
                          if (window.innerWidth < 768) {
                            setActiveMobileTab('contacts');
                          }
                        }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.contactAvatar || "/person-male-1.svg"} />
                          <AvatarFallback>{contact.contactName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.contactName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lastMessage || "No messages yet"}
                          </p>
                          {contact.lastMessageTime && (
                            <p className="text-xs opacity-70">
                              {contact.lastMessageTime.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {contact.serviceTitle && (
                          <Badge variant="outline" className="text-xs hidden sm:block">
                            {contact.serviceTitle.substring(0, 10)}
                            {contact.serviceTitle.length > 10 ? '...' : ''}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Card - Hidden on mobile unless active */}
        <div className={`md:col-span-2 lg:col-span-3 ${activeMobileTab === 'chat' ? 'block' : 'hidden md:block'}`}>
          <Card className="h-full bg-white/90 backdrop-blur-md shadow-sm">
            <CardHeader className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={provider?.avatar || provider?.profilePicture || "/person-male-1.svg"}
                      alt={provider?.name || provider?.displayName || "User"}
                    />
                    <AvatarFallback>{provider?.name?.charAt(0) || provider?.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{provider?.name || provider?.displayName || "User"}</CardTitle>
                    <CardDescription className="truncate">{provider?.title || provider?.bio?.substring(0, 60) || roleText.roleLabel}</CardDescription>
                  </div>
                </div>
                
                {/* Selected service card - removed from direct message view */}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {showWelcomeMessage && (
                <div className="mb-4 text-center bg-muted/30 py-2 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Welcome to your conversation! You can now message this {isChatUserProvider ? 'service provider' : 'client'} directly.
                  </p>
                </div>
              )}
              <div className="mb-0 h-[calc(100vh-380px)] max-h-[calc(100vh-380px)] overflow-y-auto border rounded-md p-4">
                {messagesLoading ? (
                  // Loading state for messages
                  <div className="flex items-center justify-center h-[calc(100vh-410px)]">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[70%] ${
                      // Special styling for payment proofs from the current user
                      msg.senderId === user?.uid && msg.paymentProof 
                        ? 'bg-blue-500 text-white' 
                        : msg.senderId === user?.uid 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                    } rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={msg.senderAvatar || "/person-male-1.svg"} />
                          <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{msg.senderName}</span>
                      </div>
                      
                      {/* Special formatting for payment proofs */}
                      {msg.paymentProof ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">I've sent the payment.</p>
                          
                          <div className="space-y-1 mt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold">Payment Proof:</span>
                              {msg.paymentConfirmed && (
                                <Badge className="bg-green-500 text-white text-xs">Confirmed</Badge>
                              )}
                            </div>
                            
                            {msg.serviceTitle && (
                              <div className="flex items-center text-xs">
                                <span className="font-semibold mr-1">Service:</span>
                                <span>{msg.serviceTitle}</span>
                              </div>
                            )}
                            
                            {msg.paymentAmount > 0 && (
                              <div className="flex items-center text-xs">
                                <span className="font-semibold mr-1">Amount:</span>
                                <span>₱{msg.paymentAmount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <img 
                            src={msg.paymentProof} 
                            alt="Payment Proof" 
                            className="mt-2 max-h-40 w-full object-contain rounded-md border border-white/20 bg-white/10"
                            onLoad={handleImageLoaded}
                          />
                          
                          {msg.paymentConfirmed && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                                <path d="m9 12 2 2 4-4"></path>
                              </svg>
                              <span>Your payment was confirmed!</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm break-words">{msg.text}</p>
                      )}
                      
                      <span className="text-xs opacity-70 block mt-1">
                        {msg.timestamp?.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="space-y-2 mt-2">
                {providerServices.length > 1 && (
                  <div className="mb-2">
                    <label className="text-sm font-medium mb-1 block">Select Service</label>
                    <div className="flex flex-wrap gap-1">
                      {providerServices.map((service) => (
                        <Badge
                          key={service.id}
                          variant={selectedService?.id === service.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedService(service);
                            // Keep on 'contacts' tab instead of switching to chat
                            if (window.innerWidth < 768) {
                              setActiveMobileTab('contacts');
                            }
                          }}
                        >
                          {service.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Message Input */}
                <div className="border-t bg-white/90 backdrop-blur-md py-0 pb-1">
                  <div className="flex items-center space-x-1 px-1 pt-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={openPaymentProofDialog}
                      className="rounded-full h-10 w-10 flex-shrink-0"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Textarea
                      className="resize-none min-h-[90px] max-h-[150px] flex-1 w-full rounded-2xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-3"
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={message.trim() === ""} 
                      className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm transition-all h-10 w-10 flex-shrink-0"
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <UploadPaymentProofDialog
                  providerId={params.providerId}
                  onUpload={(imageUrl, serviceId, amount) => {
                    handleSendPaymentProof({
                      text: "I've sent the payment.",
                      paymentProof: imageUrl,
                      serviceId: serviceId,
                      paymentAmount: amount
                    });
                    setMessageType("text");
                  }}
                  open={paymentProofOpen}
                  onOpenChange={setPaymentProofOpen}
                />
              </form>
            </CardContent>
          </Card>
        </div>

        {/* User Info Card - Hidden on mobile unless active */}
        <div className={`md:col-span-1 ${activeMobileTab === 'info' ? 'block' : 'hidden md:block'}`}>
          <Card className="h-full bg-white/90 backdrop-blur-md shadow-sm">
            <CardContent className="p-3">
              <div className="space-y-4">
                <div className="text-center mb-3">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage
                      src={provider?.avatar || provider?.profilePicture || "/person-male-1.svg"}
                      alt={provider?.name || provider?.displayName || "User"}
                    />
                    <AvatarFallback>{provider?.name?.charAt(0) || provider?.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mt-3">{provider?.name || provider?.displayName}</h3>
                  {provider?.title && <p className="text-sm text-muted-foreground">{provider.title}</p>}
                  <Badge variant="outline" className="mt-2">
                    {roleText.roleLabel}
                  </Badge>
                  
                  <div className="text-2xl font-semibold leading-none tracking-tight mt-4">About Provider</div>
                </div>

                {provider?.rating && (
                  <div className="flex items-center justify-center gap-1 text-sm my-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(provider.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1">{provider.rating.toFixed(1)}</span>
                  </div>
                )}

                {provider?.bio && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-1">Bio</h4>
                    <p className="text-sm text-muted-foreground">{provider.bio}</p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                  <div className="space-y-2">
                    {provider?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="break-all">{provider.email}</span>
                      </div>
                    )}
                    {provider?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    {provider?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Only show services section for providers */}
                {isChatUserProvider && (
                  <>
                    {/* Selected service card */}
                    {selectedService && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2">Selected Service</h4>
                        <div className="rounded-md border overflow-hidden bg-muted/10">
                          <div className="p-3 flex flex-col gap-3">
                            {selectedService.image && (
                              <div>
                                <img 
                                  src={selectedService.image} 
                                  alt={selectedService.title} 
                                  className="w-full h-32 object-cover rounded-md"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.jpg"
                                    e.currentTarget.onerror = null
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{selectedService.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{selectedService.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">₱{selectedService.price}</span>
                                {selectedService.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {formatCategoryName(selectedService.category)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {provider?.specialties && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {provider.specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedService && providerServices.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2">Services</h4>
                        <div className="space-y-2">
                          {providerServices.slice(0, 3).map((service) => (
                            <div 
                              key={service.id} 
                              className="p-2 rounded-md border cursor-pointer hover:bg-muted"
                              onClick={() => {
                                setSelectedService(service);
                                // Keep on 'contacts' tab instead of switching to chat
                                if (window.innerWidth < 768) {
                                  setActiveMobileTab('contacts');
                                }
                              }}
                            >
                              <div className="flex justify-between">
                                <p className="text-sm font-medium">{service.title}</p>
                                <span className="text-sm">₱{service.price}</span>
                              </div>
                              {service.category && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {formatCategoryName(service.category)}
                                </Badge>
                              )}
                            </div>
                          ))}
                          {providerServices.length > 3 && (
                            <p className="text-xs text-center text-muted-foreground">
                              +{providerServices.length - 3} more services
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Replace the inline dialog with the imported RatingModal component */}
      <RatingModal 
        open={ratingDialogOpen}
        onOpenChange={(open) => {
          console.log("Rating modal onOpenChange:", open);
          setRatingDialogOpen(open);
          if (!open) {
            setRatingService(null);
          }
        }}
        providerId={ratingService?.providerId || ""}
        providerName={ratingService?.providerName || ""}
        serviceId={ratingService?.serviceId || ""}
        serviceTitle={ratingService?.serviceTitle}
        transactionId={ratingService?.transactionId}
      />
    </div>
  )
}
