# Alima Application Firestore Database Structure

This document outlines the Firestore database structure used in the Alima application, which connects local service providers with clients.

## Collections Overview

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

## Detailed Collection Structures

### users Collection
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

### providers Collection
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

### services Collection
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

### conversations Collection
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

### messages Collection
- **Document ID**: Auto-generated
- **Fields**:
  - `conversationId`: string - Reference to conversation document
  - `senderId`: string - ID of the message sender
  - `text`: string - Message content
  - `timestamp`: string - Timestamp of the message
  - `read`: boolean - Whether the message has been read
  - `isPaymentInfo`: boolean (optional) - Whether the message contains payment info
  - `paymentProof`: string (optional) - URL to payment proof image (Cloudinary)

### notifications Collection
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

### transactions Collection
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

### reviews Collection
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

The following service categories are supported in the application:

1. Academic and Tutorial
2. Automotive & Motorcycle
3. Digital Marketing
4. Beauty & Business
5. Event Management
6. PC & Smartphone
7. Psychological
8. Property & Rental
9. Electronics & Electrical

## Cloudinary Integration

Cloudinary is used for storing and managing media assets (images). The following folders are used:

- `profile-pictures/{userId}` - For user profile pictures
- `payment-info/{providerId}` - For payment QR codes
- `payment-proofs/{userId}` - For payment proof screenshots
- `service-images/{serviceId}` - For service images

Each image stored in Cloudinary has a public ID that is stored in Firestore for reference. The Cloudinary ID is used to connect images to their respective documents in Firestore.
