/**
 * Alima Firestore Database Schema
 * 
 * This file documents the Firestore database schema used in the Alima application.
 * It defines the structure and relationships between different collections and documents.
 */

/**
 * users Collection
 * Stores basic user information for all users (both clients and providers)
 * 
 * Document ID: User's UID from Firebase Authentication
 */
interface User {
  uid: string;              // User ID (same as document ID)
  email: string;            // User's email address
  displayName: string;      // User's display name
  role: 'user' | 'provider' | 'admin'; // User role
  createdAt: string;        // Timestamp of account creation
  updatedAt: string;        // Timestamp of last update
  profileComplete: boolean; // Whether the user has completed their profile
  profilePicture?: string;  // URL to user's profile picture (Cloudinary)
}

/**
 * providers Collection
 * Stores provider-specific information, including profile details and payment information
 * 
 * Document ID: Provider's UID (same as user UID)
 */
interface Provider {
  userId: string;           // Reference to user document (same as document ID)
  email: string;            // Provider's email address
  createdAt: string;        // Timestamp of provider account creation
  updatedAt: string;        // Timestamp of last update
  paymentInfo: {            // Payment information
    accountNumber: string;  // Provider's account number for payments
    qrCodeUrl: string;      // URL to QR code image (Cloudinary)
    updatedAt: string;      // Timestamp of last payment info update
  };
  profile: {                // Provider profile information
    displayName: string;    // Provider's display name
    profilePicture: string; // URL to profile picture (Cloudinary)
    bio: string;            // Provider's bio/description
    location: string;       // Provider's location
    contactNumber: string;  // Provider's contact number
    primaryCategory: string; // Primary service category
    secondaryCategories: string[]; // Secondary service categories
    yearsOfExperience: string; // Years of experience
    priceRange: string;     // General price range
    languages: string;      // Languages spoken
    website: string;        // Provider's website
    socialLinks: {          // Social media links
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
    };
    rating: number;         // Average rating (calculated from reviews)
    reviewCount: number;    // Total number of reviews
  };
  // Statistics for dashboard
  stats: {
    totalContacts: number;  // Total number of client contacts
    totalServices: number;  // Total number of services offered
    totalRevenue: number;   // Total revenue earned
    successfulTransactions: number; // Number of successful transactions
  };
}

/**
 * services Collection
 * Stores details about services offered by providers
 * 
 * Document ID: Auto-generated
 */
interface Service {
  providerId: string;       // Reference to provider document
  title: string;            // Service title
  description: string;      // Service description
  price: string;            // Service price
  category: string;         // Service category
  featured: boolean;        // Whether the service is featured
  image: string;            // URL to service image (Cloudinary)
  tags: string[];           // Service tags for search
  createdAt: string;        // Timestamp of service creation
  updatedAt: string;        // Timestamp of last update
  rating: number;           // Average rating (calculated from reviews)
  reviewCount: number;      // Total number of reviews
  isActive: boolean;        // Whether the service is active and available
}

/**
 * conversations Collection
 * Stores information about conversations between users and providers
 * 
 * Document ID: Auto-generated or composite key of user IDs
 */
interface Conversation {
  userId: string;           // Reference to user document
  providerId: string;       // Reference to provider document
  serviceId: string;        // Reference to service document
  serviceTitle: string;     // Title of the service being discussed
  lastMessage: string;      // Content of the last message
  lastMessageTime: string;  // Timestamp of the last message
  lastMessageSenderId: string; // Sender of the last message
  createdAt: string;        // Timestamp of conversation creation
  unreadCountUser: number;  // Unread message count for user
  unreadCountProvider: number; // Unread message count for provider
}

/**
 * messages Collection
 * Stores individual messages within conversations
 * 
 * Document ID: Auto-generated
 */
interface Message {
  conversationId: string;   // Reference to conversation document
  senderId: string;         // ID of the message sender
  text: string;             // Message content
  timestamp: string;        // Timestamp of the message
  read: boolean;            // Whether the message has been read
  isPaymentInfo?: boolean;  // Whether the message contains payment info
  paymentProof?: string;    // URL to payment proof image (Cloudinary)
}

/**
 * notifications Collection
 * Stores notifications for users
 * 
 * Document ID: Auto-generated
 */
interface Notification {
  userId: string;           // User the notification is for
  type: 'payment_proof' | 'message' | 'review' | 'payment_confirmation'; // Notification type
  message: string;          // Notification message
  read: boolean;            // Whether the notification has been read
  createdAt: string;        // Timestamp of notification creation
  conversationId?: string;  // Reference to conversation (if applicable)
  paymentProofId?: string;  // Reference to payment proof (if applicable)
  serviceId?: string;       // Reference to service (if applicable)
}

/**
 * transactions Collection
 * Stores payment transactions
 * 
 * Document ID: Auto-generated
 */
interface Transaction {
  userId: string;           // User who made the payment
  providerId: string;       // Provider who received the payment
  serviceId: string;        // Service the payment is for
  amount: string;           // Payment amount
  status: 'pending' | 'confirmed' | 'rejected'; // Transaction status
  paymentProofUrl: string;  // URL to payment proof image (Cloudinary)
  paymentMethod: 'gcash' | 'qrph'; // Payment method used
  createdAt: string;        // Timestamp of transaction creation
  updatedAt: string;        // Timestamp of last status update
  conversationId: string;   // Reference to conversation
  cloudinaryId: string;     // Cloudinary asset ID for the image
}

/**
 * reviews Collection
 * Stores reviews for services and providers
 * 
 * Document ID: Auto-generated
 */
interface Review {
  userId: string;           // User who left the review
  providerId: string;       // Provider being reviewed
  serviceId: string;        // Service being reviewed
  rating: number;           // Rating (1-5)
  comment: string;          // Review comment
  createdAt: string;        // Timestamp of review creation
  transactionId: string;    // Reference to transaction
}

/**
 * Cloudinary Integration
 * 
 * Cloudinary is used for storing and managing media assets (images)
 * The following folders are used:
 * 
 * - profile-pictures/{userId} - For user profile pictures
 * - payment-info/{providerId} - For payment QR codes
 * - payment-proofs/{userId} - For payment proof screenshots
 * - service-images/{serviceId} - For service images
 * 
 * Each image stored in Cloudinary has a public ID that is stored in Firestore
 * for reference. The Cloudinary ID is used to connect images to their respective
 * documents in Firestore.
 */

export type {
  User,
  Provider,
  Service,
  Conversation,
  Message,
  Notification,
  Transaction,
  Review
};
