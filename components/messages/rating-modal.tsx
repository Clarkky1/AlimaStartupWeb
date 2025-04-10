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
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
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
  serviceId?: string
  serviceTitle?: string
  transactionId?: string
  raterIsProvider?: boolean
}

export function RatingModal({
  open,
  onOpenChange,
  providerId,
  providerName,
  serviceId = "",
  serviceTitle = "",
  transactionId = "",
  raterIsProvider = false
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setRating(0)
      setFeedback("")
    }
  }, [open])

  const handleSubmit = async () => {
    if (!user || !providerId || rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating before submitting",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      // Set up review data
      const reviewData = {
        userId: user.uid,
        userName: user.displayName || user.name || "Anonymous",
        userAvatar: user.photoURL || user.avatar || null,
        providerId,
        providerName,
        serviceId,
        serviceTitle,
        rating,
        feedback,
        transactionId,
        createdAt: serverTimestamp(),
        raterIsProvider: raterIsProvider
      }

      // Add the review
      const reviewRef = await addDoc(collection(db, "reviews"), reviewData)
      console.log("Review added with ID:", reviewRef.id)

      // Update the transaction to mark it as rated if this is a transaction rating
      if (transactionId) {
        await updateDoc(doc(db, "transactions", transactionId), {
          rated: true,
          rating,
          updatedAt: new Date().toISOString()
        })
      }

      // Update provider's average rating
      const providerRef = doc(db, "users", providerId)
      const providerDoc = await getDoc(providerRef)

      if (providerDoc.exists()) {
        const providerData = providerDoc.data()
        const currentRating = providerData.rating || 0
        const ratingCount = providerData.ratingCount || 0
        
        // Calculate new average rating
        const newRatingCount = ratingCount + 1
        const newRating = ((currentRating * ratingCount) + rating) / newRatingCount
        
        await updateDoc(providerRef, {
          rating: newRating,
          ratingCount: newRatingCount,
          lastRated: new Date().toISOString()
        })
      }

      // Create notification for the provider
      const notificationData = {
        userId: providerId,
        type: raterIsProvider ? "provider_rating" : "client_rating",
        title: `New ${raterIsProvider ? "Provider" : "Client"} Rating: ${rating}/5 Stars`,
        description: `${user.displayName || user.name || "Someone"} rated ${serviceTitle ? `your service "${serviceTitle}"` : "you"} ${rating}/5 stars${feedback ? ` with feedback: "${feedback}"` : ""}.`,
        timestamp: serverTimestamp(),
        read: false,
        data: {
          reviewId: reviewRef.id,
          serviceId,
          rating
        }
      }

      await addDoc(collection(db, "notifications"), notificationData)

      toast({
        title: "Thank you!",
        description: "Your rating has been submitted successfully",
      })

      // Close the modal
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
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