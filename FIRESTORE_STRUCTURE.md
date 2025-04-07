# Alima Application - Project Documentation

## About Alima

Alima is a comprehensive web platform designed to connect Filipino service providers with clients seeking both local and global services. The platform serves as a marketplace where skilled professionals can showcase their expertise, and clients can find qualified service providers for their specific needs.

## Project Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Cloudinary account for image storage

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/alima-web-integration.git
   cd alima-web-integration
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Firebase Project Setup**
   - Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google sign-in methods
   - Create a Firestore database in production mode
   - Configure security rules according to the project requirements

5. **Cloudinary Setup**
   - Create a Cloudinary account at [Cloudinary](https://cloudinary.com/)
   - Set up an upload preset for the project
   - Configure proper access control for your Cloudinary resources

6. **Run the development server**
   ```bash
   npm run dev
   # or with watch mode
   npm run dev:watch
   ```

7. **Open [http://localhost:3000](http://localhost:3000) to view the application**

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with TypeScript
- **UI Components**: Custom components built with Tailwind CSS and shadcn/ui
- **State Management**: React Context API
- **Authentication**: Firebase Authentication
- **Icons**: Lucide React
- **Form Management**: React Hook Form with Zod validation

### Backend
- **Database**: Firebase Firestore
- **Storage**: Cloudinary for image storage and optimization
- **Authentication**: Firebase Auth
- **Hosting**: Vercel

## Project Structure

```
alima-web-integration/
├── app/                  # Next.js app directory with route handling
│   ├── api/              # API routes
│   ├── context/          # React context providers (auth, categories)
│   ├── dashboard/        # Dashboard pages for providers
│   ├── explore/          # Service exploration pages
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and Firebase initialization
│   ├── login/            # Authentication pages
│   ├── message/          # Messaging system
│   ├── popular-today/    # Popular services pages
│   ├── profile/          # User profile pages
│   └── layout.tsx        # Root layout component
├── components/           # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── explore/          # Exploration page components
│   ├── home/             # Homepage components
│   ├── layout/           # Layout components
│   ├── messages/         # Messaging components
│   ├── modals/           # Modal dialog components
│   ├── navbar/           # Navigation components
│   ├── popular/          # Popular services components
│   ├── theme-provider.tsx # Theme provider component
│   └── ui/               # Reusable UI components (buttons, cards, etc.)
├── lib/                  # Library functions and utilities
├── public/               # Static assets (images, icons, etc.)
├── styles/               # Global styles and Tailwind configuration
├── themes/               # Theme configuration
├── .env.development      # Development environment variables
├── .env.local            # Local environment variables (not in repo)
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Firestore Database Structure

### Collections Overview

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

### Detailed Collection Structures

#### users Collection
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

#### providers Collection
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

#### services Collection
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
  - `isLocalService`: boolean - Whether this is a local physical service or global digital service

#### conversations Collection
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
  - `participants`: string[] - Array of participant IDs for querying

#### messages Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `conversationId`: string - Reference to conversation document
  - `senderId`: string - ID of the message sender
  - `receiverId`: string - ID of the message recipient
  - `text`: string - Message content
  - `timestamp`: string - Timestamp of the message
  - `read`: boolean - Whether the message has been read
  - `isPaymentInfo`: boolean (optional) - Whether the message contains payment info
  - `paymentProof`: string (optional) - URL to payment proof image (Cloudinary)

#### notifications Collection
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
  - `data`: object - Additional data related to the notification

#### transactions Collection
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

#### reviews Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `userId`: string - User who left the review
  - `providerId`: string - Provider being reviewed
  - `serviceId`: string - Service being reviewed
  - `rating`: number - Rating (1-5)
  - `comment`: string - Review comment
  - `createdAt`: string - Timestamp of review creation
  - `transactionId`: string - Reference to transaction

## Service Categories

### Global Services
- Development
- Design
- Marketing
- Mobile Apps
- Writing
- Video
- Photography
- Music
- Education
- Translation
- Business
- Lifestyle

### Local Services
- Academic & Tutorial
- Automotive & Motorcycle
- Digital Marketing
- Beauty & Business
- Event Management
- PC & Smartphone
- Psychological
- Property & Rental
- Electronics & Electrical

## Cloudinary Integration

Cloudinary is used for storing and managing media assets (images). The following folders are used:

- `profile-pictures/{userId}` - For user profile pictures
- `payment-info/{providerId}` - For payment QR codes
- `payment-proofs/{userId}` - For payment proof screenshots
- `service-images/{serviceId}` - For service images

Each image stored in Cloudinary has a public ID that is stored in Firestore for reference. The Cloudinary ID is used to connect images to their respective documents in Firestore.

## Deployment

### Deployment to Vercel

1. Install Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Deploy
   ```bash
   vercel
   ```

3. For production deployment
   ```bash
   vercel --prod
   ```

### Firebase Security Rules

Ensure proper security rules are set up in your Firebase console to protect your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isProvider() {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'provider';
    }
    
    function isInConversation(conversationId) {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/conversations/$(conversationId)) &&
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }
    
    // Users collection rules
    match /users/{userId} {
      // Allow PUBLIC read for basic profile info that's needed in the UI
      allow read: if true; // Public user profiles are shown in the marketplace
      // Users can only write to their own documents
      allow create, update: if isOwner(userId);
      // Admins can update any user
      allow update, delete: if isAdmin();
    }
    
    // Providers collection rules
    match /providers/{providerId} {
      // Public can read provider profiles
      allow read: if true;
      // Only the provider can write their own profile
      allow create, update: if isOwner(providerId);
      // Admin can update/delete provider data
      allow update, delete: if isAdmin();
    }
    
    // Services collection rules
    match /services/{serviceId} {
      // Anyone can read service listings
      allow read: if true;
      // Only the service provider can create/update their services
      allow create: if isSignedIn() && request.resource.data.providerId == request.auth.uid;
      allow update: if isSignedIn() && resource.data.providerId == request.auth.uid;
      allow delete: if isSignedIn() && (resource.data.providerId == request.auth.uid || isAdmin());
    }
    
    // Conversations collection rules
    match /conversations/{conversationId} {
      // Only participants in the conversation can read
      allow read: if isSignedIn() && request.auth.uid in resource.data.participants;
      // Allow creation of new conversations between users
      allow create: if isSignedIn() && 
                    request.resource.data.participants.hasAny([request.auth.uid]);
      // Allow updates by participants
      allow update: if isSignedIn() && request.auth.uid in resource.data.participants;
    }
    
    // Messages collection rules
    match /messages/{messageId} {
      // Participants can read messages in their conversations
      allow read: if isSignedIn() && isInConversation(resource.data.conversationId);
      // Can create a message if user is the sender and in the conversation
      allow create: if isSignedIn() && 
                    request.resource.data.senderId == request.auth.uid && 
                    isInConversation(request.resource.data.conversationId);
      // Only the sender can update their own message
      allow update: if isSignedIn() && resource.data.senderId == request.auth.uid;
      // Add delete permission for sender
      allow delete: if isSignedIn() && resource.data.senderId == request.auth.uid;
    }
    
    // Notifications collection rules
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      // More restrictive creation rule - only for self or system functions
      allow create: if isSignedIn() && 
                    (request.resource.data.userId == request.auth.uid || isAdmin());
      // Users can mark their notifications as read
      allow update: if isSignedIn() && 
                    resource.data.userId == request.auth.uid && 
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      // Add delete permission
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Transactions collection rules
    match /transactions/{transactionId} {
      // Only participants in the transaction can read
      allow read: if isSignedIn() && 
                  (resource.data.userId == request.auth.uid || 
                   resource.data.providerId == request.auth.uid || 
                   isAdmin());
      // Only the client can create a transaction
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      // Provider can update transaction status
      allow update: if isSignedIn() && 
                    (resource.data.providerId == request.auth.uid && 
                     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])) ||
                    (resource.data.userId == request.auth.uid && 
                     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['paymentProofUrl', 'paymentMethod', 'updatedAt', 'cloudinaryId']));
      // Admin can update any transaction
      allow update: if isAdmin();
    }
    
    // Reviews collection rules
    match /reviews/{reviewId} {
      // Anyone can read reviews
      allow read: if true;
      // Only authenticated users who have had a transaction can write reviews
      allow create: if isSignedIn() && 
                    request.resource.data.userId == request.auth.uid && 
                    exists(/databases/$(database)/documents/transactions/$(request.resource.data.transactionId)) &&
                    get(/databases/$(database)/documents/transactions/$(request.resource.data.transactionId)).data.userId == request.auth.uid &&
                    get(/databases/$(database)/documents/transactions/$(request.resource.data.transactionId)).data.status == 'confirmed';
      // Users can only update their own reviews
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      // Users can delete their own reviews, and admins can delete any review
      allow delete: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

## Common Issues and Troubleshooting

1. **Firebase Authentication Issues**
   - Make sure your Firebase project has the appropriate authentication methods enabled
   - Check that your environment variables are correctly set

2. **Image Upload Problems**
   - Verify Cloudinary credentials and upload presets
   - Check browser console for CORS errors

3. **NextJS Route Issues**
   - Clear `.next` folder and restart the development server
   - Ensure routing patterns follow Next.js 14 conventions

4. **usePathname Hook Errors**
   - Wrap components using navigation hooks with proper client-side detection
   - Ensure proper context providers are available for React navigation hooks

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com)
