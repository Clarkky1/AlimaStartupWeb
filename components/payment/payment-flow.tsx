"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { PaymentService } from "@/app/lib/payment-service"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PaymentFlowProps {
  serviceId: string
  serviceTitle: string
  amount: number
  providerId: string
}

export function PaymentFlow({ serviceId, serviceTitle, amount, providerId }: PaymentFlowProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  // Step 1: Request Service
  const handleRequestService = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to request a service",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const id = await PaymentService.requestService(user.uid, serviceId)
      setRequestId(id)
      setStep(2)
      toast({
        title: "Service requested",
        description: "The service provider has been notified",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Upload Payment Proof
  const handleUploadPaymentProof = async () => {
    if (!requestId || !paymentProof) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', paymentProof)
      formData.append('folder', 'payment-proofs')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to upload payment proof')

      const data = await response.json()
      await PaymentService.processPayment(requestId, data.secure_url)
      
      setStep(3)
      toast({
        title: "Payment proof uploaded",
        description: "Your payment is being processed",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Payment Confirmation
  const handlePaymentConfirmation = async () => {
    if (!requestId) return

    setLoading(true)
    try {
      await PaymentService.completePayment(requestId)
      setStep(4)
      toast({
        title: "Payment completed",
        description: "The service provider has been notified",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Flow</CardTitle>
          <CardDescription>Follow these steps to complete your payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1: Request Service */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 1: Request Service</h3>
                  <p className="text-sm text-muted-foreground">
                    Request the service and notify the provider
                  </p>
                </div>
                <Button 
                  onClick={handleRequestService} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Requesting..." : "Request Service"}
                </Button>
              </div>
            )}

            {/* Step 2: Upload Payment Proof */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 2: Upload Payment Proof</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload proof of your payment to the platform
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-proof">Payment Proof</Label>
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setPaymentProof(file)
                    }}
                  />
                </div>
                <Button 
                  onClick={handleUploadPaymentProof} 
                  disabled={loading || !paymentProof}
                  className="w-full"
                >
                  {loading ? "Uploading..." : "Upload Payment Proof"}
                </Button>
              </div>
            )}

            {/* Step 3: Payment Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Step 3: Payment Confirmation</h3>
                  <p className="text-sm text-muted-foreground">
                    Confirm your payment and notify the provider
                  </p>
                </div>
                <Button 
                  onClick={handlePaymentConfirmation} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Confirming..." : "Confirm Payment"}
                </Button>
              </div>
            )}

            {/* Step 4: Payment Completed */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Payment Completed</h3>
                  <p className="text-sm text-muted-foreground">
                    Your payment has been processed successfully
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard')} 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Send your payment to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <p className="text-sm">{serviceTitle}</p>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <p className="text-sm">₱{amount.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>Platform Fee (10%)</Label>
              <p className="text-sm">₱{(amount * 0.10).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <p className="text-sm font-medium">₱{amount.toLocaleString()}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 