"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Copy, Download, DollarSign, Edit2, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { initializeFirebase } from "@/app/lib/firebase"
import { ImageUpload } from "@/components/ui/image-upload"

interface PaymentInfo {
  accountNumber: string
  qrCodeUrl: string
  updatedAt: string
}

export function PaymentMethods() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("gcash")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    accountNumber: "",
    qrCodeUrl: "",
    updatedAt: "",
  })
  const [tempAccountNumber, setTempAccountNumber] = useState("")

  useEffect(() => {
    async function fetchPaymentInfo() {
      if (!user) return

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

        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const accountInfo = {
            accountNumber: data.paymentInfo?.accountNumber || "",
            qrCodeUrl: data.paymentInfo?.qrCodeUrl || "",
            updatedAt: data.paymentInfo?.updatedAt || "",
          }
          setPaymentInfo(accountInfo)
          setTempAccountNumber(accountInfo.accountNumber)
        }
      } catch (error) {
        console.error("Error fetching payment info:", error)
        toast({
          title: "Error",
          description: "Failed to load payment information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentInfo()
  }, [user, toast])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${label} copied to clipboard`,
      description: text,
    })
  }

  const handleImageUpload = async (url: string) => {
    setPaymentInfo((prev) => ({ ...prev, qrCodeUrl: url }))
  }

  const handleSavePaymentInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, {
        paymentInfo: {
          accountNumber: paymentInfo.accountNumber,
          qrCodeUrl: paymentInfo.qrCodeUrl,
          updatedAt: new Date().toISOString(),
        },
      })

      toast({
        title: "Success",
        description: "Payment information updated successfully",
      })
    } catch (error) {
      console.error("Error updating payment info:", error)
      toast({
        title: "Error",
        description: "Failed to update payment information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAccountNumber = async () => {
    if (!user) return
    if (!tempAccountNumber.trim()) {
      toast({
        title: "Error",
        description: "Account number cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const { db } = await initializeFirebase()
      if (!db) {
        toast({
          title: "Error",
          description: "Failed to initialize Firebase",
          variant: "destructive",
        })
        return
      }

      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, {
        "paymentInfo.accountNumber": tempAccountNumber,
        "paymentInfo.updatedAt": new Date().toISOString(),
      })

      setPaymentInfo(prev => ({
        ...prev,
        accountNumber: tempAccountNumber,
        updatedAt: new Date().toISOString()
      }))

      setEditMode(false)
      toast({
        title: "Success",
        description: "Account number updated successfully",
      })
    } catch (error) {
      console.error("Error updating account number:", error)
      toast({
        title: "Error",
        description: "Failed to update account number",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setTempAccountNumber(paymentInfo.accountNumber)
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading payment information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>

      <Tabs defaultValue="gcash" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gcash">GCash</TabsTrigger>
          <TabsTrigger value="qrph">QR PH</TabsTrigger>
        </TabsList>

        <TabsContent value="gcash" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>GCash Payment Details</CardTitle>
              <CardDescription>Share these details with your clients to receive payments via GCash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-lg border p-2">
                  <img
                    src={paymentInfo.qrCodeUrl || "/placeholder.svg"}
                    alt="GCash QR Code"
                    className="h-48 w-48"
                  />
                </div>
                <Button variant="outline" onClick={() => {}}>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Input 
                          value={tempAccountNumber} 
                          onChange={(e) => setTempAccountNumber(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleUpdateAccountNumber}
                          disabled={saving}
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={paymentInfo.accountNumber} readOnly className="bg-muted flex-1" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(paymentInfo.accountNumber, "Account number")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditMode(true)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-muted p-4">
                <h3 className="mb-2 font-medium">Instructions for Clients</h3>
                <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>Open the GCash app on your phone</li>
                  <li>Tap on "Send Money"</li>
                  <li>Select "Send to GCash Account"</li>
                  <li>Enter the account number shown above</li>
                  <li>Enter the amount to be paid</li>
                  <li>Confirm the payment</li>
                  <li>Send a screenshot of the payment confirmation to the service provider</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrph" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>QR PH Payment Details</CardTitle>
              <CardDescription>Share these details with your clients to receive payments via QR PH</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-lg border p-2">
                  <img
                    src={paymentInfo.qrCodeUrl || "/placeholder.svg"}
                    alt="QR PH Code"
                    className="h-48 w-48"
                  />
                </div>
                <Button variant="outline" onClick={() => {}}>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Input 
                          value={tempAccountNumber} 
                          onChange={(e) => setTempAccountNumber(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleUpdateAccountNumber}
                          disabled={saving}
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={paymentInfo.accountNumber} readOnly className="bg-muted flex-1" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(paymentInfo.accountNumber, "Account number")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditMode(true)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-muted p-4">
                <h3 className="mb-2 font-medium">Instructions for Clients</h3>
                <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>Open your banking app that supports QR PH</li>
                  <li>Select the QR code scanning option</li>
                  <li>Scan the QR code shown above</li>
                  <li>Enter the amount to be paid</li>
                  <li>Confirm the payment</li>
                  <li>Send a screenshot of the payment confirmation to the service provider</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Upload Payment QR Code</h2>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSavePaymentInfo} className="space-y-4">
              <div className="space-y-2">
                <Label>QR Code</Label>
                <ImageUpload
                  onUploadComplete={handleImageUpload}
                  defaultImage={paymentInfo.qrCodeUrl}
                  folder={`payment-info/${user?.uid || "unknown"}`}
                />
              </div>

              <Button type="submit" className="mt-4" disabled={saving}>
                {saving ? "Saving..." : "Save QR Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
