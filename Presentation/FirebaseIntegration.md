# Alima - Firebase Integration

## Firebase Services Used

### Authentication
- Email/password authentication
- Google OAuth authentication
- JWT token-based session management
- User role management (client, provider, admin)

### Firestore Database
- NoSQL document database for structured data
- Real-time data synchronization

### Security Rules
- Fine-grained access control
- Custom security rules for each collection
- Rule-based data validation

## Database Structure

### Collections Overview

| Collection Name | Purpose |
|-----------------|---------|
| users | Basic user information for all users (clients, providers, admins) |
| providers | Provider-specific information, including profiles and payment details |
| services | Details about services offered by providers |
| conversations | Information about conversations between users and providers |
| messages | Individual messages within conversations |
| notifications | Notifications for users |
| transactions | Payment transactions between clients and providers |
| reviews | Reviews for services and providers |

## Security Implementation

### Role-Based Access Control
- Different permissions for clients, providers, and admins
- Secure document access based on ownership

### Data Validation
- Server-side validation using Firebase Functions
- Client-side validation using Zod schemas
- Cross-checking of user permissions before operations

### Security Rules Sample
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
    
    // Users collection - public read, own profile write
    match /users/{userId} {
      allow read: if true;
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;
    }
    
    // Example of additional rules
    // Services collection - public read, provider write
    match /services/{serviceId} {
      allow read: if true;
      allow create: if isProvider() && request.resource.data.providerId == request.auth.uid;
      allow update: if isProvider() && resource.data.providerId == request.auth.uid;
      allow delete: if isProvider() && resource.data.providerId == request.auth.uid;
    }
  }
}