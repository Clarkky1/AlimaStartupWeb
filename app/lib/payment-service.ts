import { initializeFirebase } from "./firebase"
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"

export interface PaymentRequest {
  userId: string
  serviceId: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface PaymentNotification {
  userId: string
  providerId: string
  serviceId: string
  type: 'payment_request' | 'payment_confirmation' | 'payment_completed'
  message: string
  read: boolean
  createdAt: string
}

export class PaymentService {
  private static async getDb() {
    const { db } = await initializeFirebase()
    if (!db) throw new Error("Failed to initialize Firebase")
    return db
  }

  // Step 1: User requests service
  static async requestService(userId: string, serviceId: string) {
    const db = await this.getDb()
    
    // Get service details
    const serviceDoc = await getDoc(doc(db, "services", serviceId))
    if (!serviceDoc.exists()) throw new Error("Service not found")
    
    const serviceData = serviceDoc.data()
    const providerId = serviceData.providerId

    // Create payment request
    const paymentRequest: PaymentRequest = {
      userId,
      serviceId,
      amount: serviceData.price || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const requestRef = await addDoc(collection(db, "payment_requests"), paymentRequest)

    // Notify third party (platform)
    await this.notifyThirdParty(userId, providerId, serviceId, requestRef.id)

    // Notify service provider
    await this.notifyProvider(providerId, userId, serviceId, requestRef.id)

    return requestRef.id
  }

  // Step 2: Notify third party (platform)
  private static async notifyThirdParty(userId: string, providerId: string, serviceId: string, requestId: string) {
    const db = await this.getDb()
    
    const notification: PaymentNotification = {
      userId,
      providerId,
      serviceId,
      type: 'payment_request',
      message: `New payment request for service ${serviceId}`,
      read: false,
      createdAt: new Date().toISOString()
    }

    await addDoc(collection(db, "platform_notifications"), notification)
  }

  // Step 3: Notify service provider
  private static async notifyProvider(providerId: string, userId: string, serviceId: string, requestId: string) {
    const db = await this.getDb()
    
    const notification: PaymentNotification = {
      userId,
      providerId,
      serviceId,
      type: 'payment_request',
      message: `New service request from user ${userId}`,
      read: false,
      createdAt: new Date().toISOString()
    }

    await addDoc(collection(db, "notifications"), notification)
  }

  // Step 4: Process payment
  static async processPayment(requestId: string, paymentProof: string) {
    const db = await this.getDb()
    
    // Get payment request
    const requestDoc = await getDoc(doc(db, "payment_requests", requestId))
    if (!requestDoc.exists()) throw new Error("Payment request not found")
    
    const requestData = requestDoc.data()
    
    // Update payment request status
    await updateDoc(doc(db, "payment_requests", requestId), {
      status: 'processing',
      paymentProof,
      updatedAt: new Date().toISOString()
    })

    // Notify third party about payment
    await this.notifyThirdParty(
      requestData.userId,
      requestData.providerId,
      requestData.serviceId,
      requestId
    )

    return requestId
  }

  // Step 5: Complete payment
  static async completePayment(requestId: string) {
    const db = await this.getDb()
    
    // Get payment request
    const requestDoc = await getDoc(doc(db, "payment_requests", requestId))
    if (!requestDoc.exists()) throw new Error("Payment request not found")
    
    const requestData = requestDoc.data()
    
    // Update payment request status
    await updateDoc(doc(db, "payment_requests", requestId), {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Create transaction record
    const transactionData = {
      requestId,
      userId: requestData.userId,
      providerId: requestData.providerId,
      serviceId: requestData.serviceId,
      amount: requestData.amount,
      platformFee: requestData.amount * 0.10, // 10% platform fee
      providerAmount: requestData.amount * 0.90, // 90% to provider
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await addDoc(collection(db, "transactions"), transactionData)

    // Notify provider about completed payment
    await this.notifyProvider(
      requestData.providerId,
      requestData.userId,
      requestData.serviceId,
      requestId
    )

    return requestId
  }

  // Get payment request status
  static async getPaymentStatus(requestId: string) {
    const db = await this.getDb()
    
    const requestDoc = await getDoc(doc(db, "payment_requests", requestId))
    if (!requestDoc.exists()) throw new Error("Payment request not found")
    
    return requestDoc.data()
  }
} 