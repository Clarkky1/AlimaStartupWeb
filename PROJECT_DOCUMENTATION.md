# Alima Web Integration - Project Documentation

## Project Overview

Alima is a platform that connects local service providers with clients. The application allows service providers to showcase their services, communicate with clients, and handle payments through popular local payment methods (GCash, QR PH).

## Installation Requirements

### Prerequisites

- Node.js (version 18.x or higher)
- NPM (version 9.x or higher)
- Firebase account with Firestore database enabled
- Cloudinary account for image storage

### Dependencies

The project uses the following key dependencies:

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-*": "various components",
    "cloudinary": "latest",
    "clsx": "^2.1.1",
    "date-fns": "^3.0.0",
    "firebase": "^10.6.0",
    "lucide-react": "^0.454.0",
    "next": "15.1.0",
    "react": "^19",
    "react-hook-form": "^7.46.1",
    "tailwindcss": "^3.3.3",
    "zod": "^3.22.2"
  }
}
```

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/alima-web-integration.git
   cd alima-web-integration
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables as described above

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to access the application

## Firebase Integration

### Firestore Database Structure

#### Collections Overview

| Collection Name | Purpose |
|-----------------|---------|
| users | Stores basic user information for all users (clients, providers, admins) |
| providers | Stores provider-specific information, including profiles and payment details |
| services | Stores details about services offered by providers |
| conversations | Stores information about conversations between users and providers |
| messages | Stores individual messages within conversations |
| notifications | Stores notifications for users |
| transactions | Stores payment transactions between clients and providers |
| reviews | Stores reviews for services and providers |

#### Detailed Collection Structures

##### users Collection
- **Document ID**: User's UID from Firebase Authentication
- **Fields**:
  - `uid`: string - User ID (same as document ID)
  - `email`: string - User's email address
  - `displayName`: string - User's display name
  - `role`: string - User role ('client', 'provider', or 'admin')
  - `createdAt`: string - Timestamp of account creation
  - `updatedAt`: string - Timestamp of last update
  - `profileComplete`: boolean - Whether the user has completed their profile
  - `profilePicture`: string (optional) - URL to user's profile picture (Cloudinary)

##### providers Collection
- **Document ID**: Provider's UID (same as user UID)
- **Fields**:
  - `userId`: string - Reference to user document
  - `email`: string - Provider's email address
  - `createdAt`: string - Timestamp of provider account creation
  - `updatedAt`: string - Timestamp of last update
  - `paymentInfo`: object - Payment information
    - `accountNumber`: string - Provider's account number for payments
    - `qrCodeUrl`: string - URL to QR code image (Cloudinary)
    - `updatedAt`: string - Timestamp of last payment info update
  - `profile`: object - Provider profile information
    - `displayName`: string - Provider's display name
    - `profilePicture`: string - URL to profile picture (Cloudinary)
    - `bio`: string - Provider's bio/description
    - `location`: string - Provider's location
    - `contactNumber`: string - Provider's contact number
    - `primaryCategory`: string - Primary service category
    - `secondaryCategories`: string[] - Secondary service categories
    - `yearsOfExperience`: string - Years of experience
    - `priceRange`: string - General price range
    - `languages`: string - Languages spoken
    - `website`: string - Provider's website
    - `socialLinks`: object - Social media links
      - `facebook`: string
      - `instagram`: string
      - `twitter`: string
      - `linkedin`: string
    - `rating`: number - Average rating (calculated from reviews)
    - `reviewCount`: number - Total number of reviews
  - `stats`: object - Statistics for dashboard
    - `totalContacts`: number - Total number of client contacts
    - `totalServices`: number - Total number of services offered
    - `totalRevenue`: number - Total revenue earned
    - `successfulTransactions`: number - Number of successful transactions

##### services Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `providerId`: string - Reference to provider document
  - `title`: string - Service title
  - `description`: string - Service description
  - `price`: string - Service price
  - `category`: string - Service category (one of the defined service categories)
  - `featured`: boolean - Whether the service is featured
  - `image`: string - URL to service image (Cloudinary)
  - `tags`: string[] - Service tags for search
  - `createdAt`: string - Timestamp of service creation
  - `updatedAt`: string - Timestamp of last update
  - `rating`: number - Average rating (calculated from reviews)
  - `reviewCount`: number - Total number of reviews
  - `isActive`: boolean - Whether the service is active and available

##### conversations Collection
- **Document ID**: Auto-generated or composite key of user IDs
- **Fields**:
  - `userId`: string - Reference to user document
  - `providerId`: string - Reference to provider document
  - `serviceId`: string - Reference to service document
  - `serviceTitle`: string - Title of the service being discussed
  - `lastMessage`: string - Content of the last message
  - `lastMessageTime`: string - Timestamp of the last message
  - `lastMessageSenderId`: string - Sender of the last message
  - `createdAt`: string - Timestamp of conversation creation
  - `unreadCountUser`: number - Unread message count for user
  - `unreadCountProvider`: number - Unread message count for provider

##### messages Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `conversationId`: string - Reference to conversation document
  - `senderId`: string - ID of the message sender
  - `text`: string - Message content
  - `timestamp`: string - Timestamp of the message
  - `read`: boolean - Whether the message has been read
  - `isPaymentInfo`: boolean (optional) - Whether the message contains payment info
  - `paymentProof`: string (optional) - URL to payment proof image (Cloudinary)

##### notifications Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `userId`: string - User the notification is for
  - `type`: string - Notification type ('payment_proof', 'message', 'review', 'payment_confirmation')
  - `message`: string - Notification message
  - `read`: boolean - Whether the notification has been read
  - `createdAt`: string - Timestamp of notification creation
  - `conversationId`: string (optional) - Reference to conversation (if applicable)
  - `paymentProofId`: string (optional) - Reference to payment proof (if applicable)
  - `serviceId`: string (optional) - Reference to service (if applicable)

##### transactions Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `userId`: string - User who made the payment
  - `providerId`: string - Provider who received the payment
  - `serviceId`: string - Service the payment is for
  - `amount`: string - Payment amount
  - `status`: string - Transaction status ('pending', 'confirmed', 'rejected')
  - `paymentProofUrl`: string - URL to payment proof image (Cloudinary)
  - `paymentMethod`: string - Payment method used ('gcash', 'qrph')
  - `createdAt`: string - Timestamp of transaction creation
  - `updatedAt`: string - Timestamp of last status update
  - `conversationId`: string - Reference to conversation
  - `cloudinaryId`: string - Cloudinary asset ID for the image

### Firestore Security Rules

The application uses the following security rules for Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isProvider() {
      return isAuthenticated() && exists(/databases/$(database)/documents/providers/$(request.auth.uid));
    }
    
    function isClient() {
      return isAuthenticated() && 
        !exists(/databases/$(database)/documents/providers/$(request.auth.uid));
    }

    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection - public read, own profile write
    match /users/{userId} {
      allow read: if true;
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;
    }

    // Services collection - public read, provider write
    match /services/{serviceId} {
      allow read: if true;
      allow create: if isProvider() && request.resource.data.providerId == request.auth.uid;
      allow update: if isProvider() && resource.data.providerId == request.auth.uid;
      allow delete: if isProvider() && resource.data.providerId == request.auth.uid;
    }

    // Providers collection - public read, own profile write
    match /providers/{providerId} {
      allow read: if true;
      allow create: if isAuthenticated() && isOwner(providerId);
      allow update: if isOwner(providerId);
      allow delete: if false;
    }

    // Conversations - participants can read/write
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || 
         resource.data.providerId == request.auth.uid);
      
      allow create: if isAuthenticated();
      
      allow update: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || 
         resource.data.providerId == request.auth.uid);
    }

    // Messages - participants can read/write
    match /messages/{messageId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated();
      
      allow update: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }

    // Notifications - own notifications only
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Transactions - participants can read, own transactions can be created
    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || 
         resource.data.providerId == request.auth.uid);
      
      allow create: if isAuthenticated();
      
      allow update: if isAuthenticated() && 
        (resource.data.providerId == request.auth.uid || isAdmin());
    }

    // Reviews - public read, own reviews write
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
  }
}
```

### Firestore Indexes

The application uses the following Firestore indexes for optimized queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "services",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "services",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "providerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "providerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastMessageTime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "providerId", "order": "ASCENDING" },
        { "fieldPath": "lastMessageTime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversationId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Cloudinary Integration

Cloudinary is used for storing and managing media assets (images). The implementation includes:

### Configuration

Cloudinary is configured using environment variables:

```typescript
// app/lib/server/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

// Check if all required environment variables are present
const hasValidConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Asset Organization

Assets are organized in the following folders:

- `profile-pictures/{userId}` - For user profile pictures
- `payment-info/{providerId}` - For payment QR codes
- `payment-proofs/{userId}` - For payment proof screenshots
- `service-images/{serviceId}` - For service images

### Upload API

A Next.js API route handles secure server-side uploads to Cloudinary:

```typescript
// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { cloudinary } from "@/app/lib/server/cloudinary";
import { getRandomAvatar, getPaymentConfirmationImage } from "@/app/lib/avatar-utils";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "uploads";
    const providerId = formData.get("providerId") as string;
    
    // Upload to Cloudinary with proper error handling
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: "auto",
      overwrite: true,
      invalidate: true,
    });
    
    return NextResponse.json({
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format
    });
  } catch (error) {
    // Return fallback avatar on error
    return NextResponse.json({
      public_id: "placeholder",
      secure_url: getRandomAvatar(providerId),
      width: 300,
      height: 300,
      format: "svg"
    });
  }
}
```

### Fallback Avatars

The system includes fallback avatars and illustrations when images fail to load:

- 4 different person avatars (2 male, 2 female) for consistent provider representation
- Peace hand illustration for payment confirmations
- The system deterministically assigns the same avatar to the same user ID for consistency

## Key Features

### Service Categories

The application supports the following service categories:

1. Academic and Tutorial
2. Automotive & Motorcycle
3. Digital Marketing
4. Beauty & Business
5. Event Management
6. PC & Smartphone
7. Psychological
8. Property & Rental
9. Electronics & Electrical

### Payment Methods

The application supports the following payment methods:

1. GCash - Mobile wallet popular in the Philippines
2. QR PH - National QR code standard for the Philippines

### Provider Dashboard

The provider dashboard includes:

1. Service management
2. Messaging with clients
3. Payment information management
4. Transaction history and reporting
5. Profile management

#### Payment Information Sharing

Providers can:
- Edit payment information in their dashboard
- Share payment information directly in chat
- View and confirm payment proofs from clients

### Messaging Center

The messaging center includes:

1. Real-time messaging between clients and providers
2. Payment proof sharing
3. Payment information sharing
4. Notification system for new messages and payments

### File Validation

The system includes validation for file uploads:

- Maximum file size: 5MB
- Allowed file types: JPEG, PNG, GIF, WebP
- Fallback system for failed uploads

## Error Handling

The application includes comprehensive error handling:

1. Firebase connection errors
2. Cloudinary upload failures
3. File validation errors
4. Permission/authorization errors

Each error includes appropriate user feedback and fallback mechanisms.

## Deployment

The application can be deployed using Vercel or any other Next.js-compatible hosting:

1. Set up environment variables in the hosting platform
2. Deploy the application
3. Set up Firebase and Cloudinary in production mode

## Common Issues and Solutions

1. **Firebase Initialization Error**
   - Ensure all Firebase environment variables are correctly set
   - Check Firebase console for service account access

2. **Cloudinary Upload Failure**
   - Verify Cloudinary credentials in environment variables
   - Check upload preset permissions in Cloudinary dashboard

3. **Missing Permissions in Firestore**
   - Review Firestore security rules
   - Ensure users have correct roles assigned

4. **Image Upload Size Limits**
   - Default limit is 5MB, adjust in code if needed
   - Cloudinary free tier has monthly upload limits
