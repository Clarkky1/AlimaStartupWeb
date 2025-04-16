# Alima - System Architecture

## Overall Architecture

Alima follows a client-server architecture with Next.js as the frontend framework and Firebase as the backend service. The application uses the App Router architecture of Next.js 14+ with TypeScript, providing both client and server components.

## Component Diagram

```
                                 +-------------------+
                                 |                   |
                                 |    Client         |
                                 |    Browser        |
                                 |                   |
                                 +--------+----------+
                                          |
                                          v
                     +-------------------+----------------+
                     |                                    |
                     |        Next.js Application         |
                     |   (Server & Client Components)     |
                     |                                    |
                     +---+----------------+---------------+
                         |                |
         +---------------v----+      +----v--------------+
         |                    |      |                   |
         |  Firebase Auth     |      |   Cloudinary      |
         |                    |      |   (Image Storage) |
         +-------+------------+      +-------------------+
                 |
                 v
        +--------+-----------+
        |                    |
        |  Firestore Database|
        |                    |
        +--------------------+
```

## Database Structure

### Firestore Collections

- **users**: User accounts and profiles
- **providers**: Provider-specific information and payment details
- **services**: Service listings with detailed information
- **conversations**: Communication threads between clients and providers
- **messages**: Individual messages within conversations
- **notifications**: System notifications for users
- **transactions**: Payment transaction records
- **reviews**: Service and provider reviews with ratings

## Authentication Flow

1. User signs up/logs in via Firebase Authentication
2. JWT token is stored and used for subsequent authenticated requests
3. Firestore security rules verify the token and permissions

## Data Flow

### Service Discovery
1. Client requests service listings
2. Next.js server component fetches data from Firestore
3. Results are rendered and returned to the client

### Messaging
1. Users send messages through the messaging interface
2. Messages are stored in Firestore
3. Real-time listeners update the UI when new messages arrive

### Payments
1. Provider shares payment information (QR code from Cloudinary)
2. Client makes payment via external payment service (GCash, etc.)
3. Client uploads payment proof via Cloudinary
4. Provider confirms payment receipt
5. Transaction record is updated in Firestore

## Security Model

- **Firestore Security Rules**: Control access to database documents
- **Server-Side Validation**: Validate inputs on API routes
- **Client-Side Validation**: Form validation with Zod schema
- **Authentication**: Firebase Auth with JWT tokens 