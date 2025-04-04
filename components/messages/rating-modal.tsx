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
import { doc, updateDoc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface RatingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
  providerName: string
  serviceId: string
}

export function RatingModal({
  open,
  onOpenChange,
  providerId,
  providerName,
  serviceId
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

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

      // Update provider rating
      const providerRef = doc(db, "users", providerId)
      await updateDoc(providerRef, {
        rating: rating,
        hasRating: true
      })

      // Update service rating
      const serviceRef = doc(db, "services", serviceId)
      await updateDoc(serviceRef, {
        rating: rating,
        feedback: feedback
      })

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
            How was your experience with {providerName}? Your feedback helps others make informed decisions.
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