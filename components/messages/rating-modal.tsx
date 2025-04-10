"use client"

import { useState } from "react"
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

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { db } = await initializeFirebase()
      if (!db) throw new Error("Failed to initialize Firebase")

      // Update provider rating - get current ratings first
      const providerRef = doc(db, "users", providerId)
      const providerDoc = await getDoc(providerRef)
      
      if (providerDoc.exists()) {
        const providerData = providerDoc.data()
        const currentRating = providerData.rating || 0
        const ratingCount = providerData.ratingCount || 0
        
        // Calculate new average rating
        const totalRatingPoints = currentRating * ratingCount + rating
        const newRatingCount = ratingCount + 1
        const newAverageRating = totalRatingPoints / newRatingCount
        
        // Update the provider document
        await updateDoc(providerRef, {
          rating: newAverageRating,
          ratingCount: newRatingCount,
          hasRating: true
        })
      } else {
        // First rating for this provider
        await updateDoc(providerRef, {
          rating: rating,
          ratingCount: 1,
          hasRating: true
        })
      }

      // Update service rating
      if (serviceId) {
        const serviceRef = doc(db, "services", serviceId)
        const serviceDoc = await getDoc(serviceRef)
        
        if (serviceDoc.exists()) {
          const serviceData = serviceDoc.data()
          const currentRating = serviceData.rating || 0
          const ratingCount = serviceData.ratingCount || 0
          
          // Calculate new average rating for service
          const totalRatingPoints = currentRating * ratingCount + rating
          const newRatingCount = ratingCount + 1
          const newAverageRating = totalRatingPoints / newRatingCount
          
          await updateDoc(serviceRef, {
            rating: newAverageRating,
            ratingCount: newRatingCount,
            feedback: feedback || serviceData.feedback
          })
        } else {
          await updateDoc(serviceRef, {
            rating: rating,
            ratingCount: 1,
            feedback: feedback
          })
        }
      }
      
      // Update transaction if transactionId is provided
      if (transactionId) {
        const transactionRef = doc(db, "transactions", transactionId)
        const transactionDoc = await getDoc(transactionRef)
        
        if (transactionDoc.exists()) {
          await updateDoc(transactionRef, {
            status: "completed",
            rating: rating,
            feedback: feedback || "",
            updatedAt: new Date().toISOString()
          })
        }
      } 
      // Otherwise try to update related transaction status to completed
      else if (user) {
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
              status: "completed",
              rating: rating,
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
                status: "completed",
                rating: rating,
                feedback: feedback || "",
                updatedAt: new Date().toISOString()
              })
            }
          }
        }
      }

      toast({
        title: "Success",
        description: "Thank you for rating this service!"
      })

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
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 