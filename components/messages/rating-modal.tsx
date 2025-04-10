"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StarIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"

// Define a type for review data
interface ReviewData {
  userId: string
  comment: string
  createdAt: string
  providerId: string
  rating: number | string
  serviceId: string
  transactionId?: string
}

interface RatingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
  providerName: string
  serviceId: string
  serviceTitle?: string
  transactionId?: string
}

export function RatingModal({
  open,
  onOpenChange,
  providerId,
  providerName,
  serviceId,
  serviceTitle,
  transactionId
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRating(0)
      setFeedback("")
      setIsSubmitting(false)
    }
  }, [open])

  // Debugging useEffect
  useEffect(() => {
    console.log("Rating modal state:", { 
      rating, 
      isSubmitting, 
      isUserAuthenticated: !!user,
      serviceId,
      providerId 
    })
  }, [rating, isSubmitting, user, serviceId, providerId])

  const handleSubmit = async () => {
    console.log("🚀 Submit button clicked, rating:", rating)
    
    // Check if already submitting to prevent double clicks
    if (isSubmitting) {
      console.log("Already submitting, ignoring click")
      return
    }
    
    // Basic validation
    if (rating === 0) {
      console.log("Rating is 0, showing error")
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive"
      })
      return
    }

    if (!serviceId) {
      console.log("No serviceId provided, showing error")
      toast({
        title: "Error",
        description: "Service ID is required to submit a rating",
        variant: "destructive"
      })
      return
    }

    if (!user || !user.uid) {
      console.log("User not authenticated, showing error")
      toast({
        title: "Error",
        description: "You must be logged in to submit a rating",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Initializing Firebase...")
      const { db } = await initializeFirebase()
      if (!db) {
        console.error("Firebase db initialization failed")
        throw new Error("Failed to initialize Firebase")
      }
      console.log("Firebase initialized successfully")

      // First validate that the service exists since this is required by security rules
      try {
        console.log("Checking if service exists:", serviceId)
        const serviceRef = doc(db, "services", serviceId)
        const serviceDoc = await getDoc(serviceRef)
        
        if (!serviceDoc.exists()) {
          console.error("Service does not exist:", serviceId)
          toast({
            title: "Error",
            description: "The service you're trying to rate doesn't exist",
            variant: "destructive"
          })
          setIsSubmitting(false)
          return
        }
        console.log("Service exists, proceeding")
      } catch (error) {
        console.error("Error checking service:", error)
        toast({
          title: "Error",
          description: "Could not verify service existence",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Create a review document first
      let reviewDocId = null
      try {
        console.log("Importing Firebase addDoc...")
        const { addDoc } = await import("firebase/firestore")
        if (user) {
          console.log("Creating review with user:", user.uid, "providerId:", providerId, "serviceId:", serviceId)
          
          // Create review data with required fields - MATCH EXACT STRUCTURE
          const reviewData: ReviewData = {
            userId: user.uid,
            comment: feedback || "",
            createdAt: new Date().toISOString(),
            providerId,
            rating: rating.toString(), // Convert to string to match Firestore structure
            serviceId
          }
          
          // Only add transactionId if it exists
          if (transactionId) {
            reviewData.transactionId = transactionId
            console.log("Adding transactionId to review:", transactionId)
          }
          
          // Log the review data we're about to save
          console.log("Review data to be saved:", JSON.stringify(reviewData))
          
          // Attempt to create the review document
          console.log("Attempting to add review document...")
          const reviewRef = await addDoc(collection(db, "reviews"), reviewData)
          reviewDocId = reviewRef.id
          console.log("Created review document:", reviewDocId)
        } else {
          console.error("User not authenticated")
          throw new Error("User not authenticated")
        }
      } catch (error) {
        console.error("Error adding review document:", error)
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Now that review is created, update transaction if it exists
      if (transactionId) {
        console.log("Updating transaction with ID:", transactionId)
        const transactionRef = doc(db, "transactions", transactionId)
        
        try {
          const transactionDoc = await getDoc(transactionRef)
          
          if (transactionDoc.exists()) {
            console.log("Transaction exists, updating with rating:", rating)
            try {
              // Update the transaction with the rating
              await updateDoc(transactionRef, {
                rated: true,
                rating: rating.toString(), // Convert to string to match structure
                feedback: feedback || "",
                updatedAt: new Date().toISOString()
              })
              console.log("Transaction updated successfully")
            } catch (error) {
              console.error("Error updating transaction:", error)
              // Don't fail the whole process if transaction update fails
              // The review was still created
              toast({
                title: "Warning",
                description: "Rating submitted but transaction update failed.",
                variant: "destructive"
              })
            }
          } else {
            console.log("Transaction does not exist:", transactionId)
          }
        } catch (error) {
          console.error("Error getting transaction:", error)
        }
      } 
      // Otherwise try to update related transaction status to completed
      else if (user) {
        try {
          // Find transactions between this user and provider for this service
          const transactionsQuery = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            where("providerId", "==", providerId),
            where("status", "==", "confirmed")
          )
          
          if (serviceId) {
            // If we have a serviceId, add it to the query
            const serviceTransactionsQuery = query(
              collection(db, "transactions"),
              where("userId", "==", user.uid),
              where("providerId", "==", providerId),
              where("serviceId", "==", serviceId),
              where("status", "==", "confirmed")
            )
            
            const serviceTransactionsSnapshot = await getDocs(serviceTransactionsQuery)
            
            // Update the most recent transaction to completed
            if (!serviceTransactionsSnapshot.empty) {
              // Sort by timestamp desc to get the most recent one
              const sortedTransactions = serviceTransactionsSnapshot.docs.sort((a, b) => {
                const aTime = a.data().updatedAt || a.data().createdAt
                const bTime = b.data().updatedAt || b.data().createdAt
                return new Date(bTime).getTime() - new Date(aTime).getTime()
              })
              
              // Update the most recent transaction
              const transactionRef = doc(db, "transactions", sortedTransactions[0].id)
              await updateDoc(transactionRef, {
                rated: true,
                rating: rating.toString(),
                feedback: feedback || "",
                updatedAt: new Date().toISOString()
              })
            } else {
              // If no transaction found with the exact service, try to find any confirmed transaction
              const transactionsSnapshot = await getDocs(transactionsQuery)
              
              if (!transactionsSnapshot.empty) {
                // Sort by timestamp desc to get the most recent one
                const sortedTransactions = transactionsSnapshot.docs.sort((a, b) => {
                  const aTime = a.data().updatedAt || a.data().createdAt
                  const bTime = b.data().updatedAt || b.data().createdAt
                  return new Date(bTime).getTime() - new Date(aTime).getTime()
                })
                
                // Update the most recent transaction
                const transactionRef = doc(db, "transactions", sortedTransactions[0].id)
                await updateDoc(transactionRef, {
                  rated: true,
                  rating: rating.toString(),
                  feedback: feedback || "",
                  updatedAt: new Date().toISOString()
                })
              }
            }
          }
        } catch (error) {
          console.error("Error updating transactions:", error)
          toast({
            title: "Warning",
            description: "Rating submitted but transaction update failed.",
            variant: "destructive"
          })
        }
      }

      toast({
        title: "Success",
        description: "Thank you for rating this service!"
      })
      console.log("Rating submitted successfully")

      // Close the modal
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      console.log("Submission process completed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with {serviceTitle ? `${serviceTitle} by ${providerName}` : providerName}? Your feedback helps others make informed decisions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="icon"
                className={value <= rating ? "text-yellow-400" : "text-gray-300"}
                onClick={() => setRating(value)}
              >
                <StarIcon className={value <= rating ? "fill-yellow-400" : "fill-gray-300"} />
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Feedback (Optional)</label>
            <Textarea
              placeholder="Share your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Rating button clicked!");
                handleSubmit();
              }}
              disabled={isSubmitting || rating === 0}
              type="button"
              className="relative"
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 