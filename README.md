# Alima - Connecting Service Providers and Clients

## About Alima

Alima is a comprehensive web platform designed to connect Filipino service providers with clients seeking both local and global services. The platform serves as a marketplace where skilled professionals can showcase their expertise, and clients can find qualified service providers for their specific needs.

## Features

### For Clients
- **Service Discovery**: Browse and search for services across multiple categories
- **Provider Profiles**: View detailed provider information including ratings, reviews, location, and portfolio
- **Messaging System**: Communicate directly with service providers
- **Payment Verification**: Upload payment proofs via the messaging system
- **Review System**: Rate and review service providers after project completion

### For Service Providers
- **Service Management**: Create and manage service listings
- **Profile Customization**: Build a professional profile to showcase skills and experience
- **Dashboard**: Track inquiries, messages, and projects
- **Payment Integration**: Set up payment methods (GCash, QR PH) and share payment details
- **Analytics**: Monitor service performance and client engagement

### Key Components
- **Dual Marketplace**: Support for both global digital services and local physical services
- **Category-Based Discovery**: Browse services by comprehensive category listing
- **Featured Provider Highlights**: Showcase top-rated service providers
- **Secure Messaging**: Built-in communication system with file sharing capabilities
- **Responsive Design**: Fully optimized for all device sizes
- **Notifications System**: Real-time notifications for messages, payments, and reviews

## Security Features

Alima implements multiple security measures to protect against common web vulnerabilities:

- **NoSQL Injection Protection**: Input validation and sanitization for all database operations
- **Content Security Policy (CSP)**: Restricts resource loading to trusted sources
- **Cross-Site Scripting (XSS) Prevention**: Input sanitization and output encoding
- **File Upload Security**: Content-type validation, size restrictions, and randomized filenames
- **Secure Database Rules**: Role-based access control through Firestore security rules
- **Input Validation**: Schema-based validation using Zod for all user inputs
- **Directory Traversal Prevention**: Path sanitization for file operations
- **Secure Headers**: X-XSS-Protection, X-Frame-Options, X-Content-Type-Options
- **Permissions Policy**: Limits browser feature access for additional security

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

## Technology Stack

### Frontend
- **Framework**: Next.js 14.1+ with TypeScript
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with animations and custom theming
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **State Management**: React Context API
- **Authentication**: Firebase Authentication
- **Animation**: Framer Motion, AOS

### Backend
- **Database**: Firebase Firestore
- **Storage**: Cloudinary for image storage and optimization
- **Authentication**: Firebase Auth
- **Hosting**: Vercel

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/alima-web-integration.git
cd alima-web-integration
```

2. Install all dependencies (one command)
```bash
npm ci
```
This command installs all dependencies exactly as specified in the package-lock.json, ensuring consistency across different environments.

Alternatively, you can use:
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory and add your Firebase and Cloudinary credentials:
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
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Run the development server
```bash
npm run dev
# or with watch mode
npm run dev:watch
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser

## Project Structure

```
alima-web-integration/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── context/          # React context providers
│   ├── dashboard/        # Dashboard pages
│   ├── explore/          # Service exploration pages
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── login/            # Authentication pages
│   ├── message/          # Messaging system
│   ├── popular-today/    # Popular services pages
│   ├── profile/          # User profile pages
├── components/           # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── explore/          # Exploration page components
│   ├── home/             # Homepage components
│   ├── layout/           # Layout components
│   ├── messages/         # Messaging components
│   ├── modals/           # Modal dialog components
│   ├── navbar/           # Navigation components
│   ├── popular/          # Popular services components
│   └── ui/               # Reusable UI components
├── lib/                  # Shared utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── public/               # Static files
├── styles/               # Global styles
├── themes/               # Theme configuration
└── ...                   # Configuration files
```

## Firebase Schema

The project uses Firebase Firestore with the following main collections:

- **users**: User accounts and profiles
- **providers**: Provider-specific information, including profiles and payment details
- **services**: Service listings with detailed information
- **conversations**: Communication threads between clients and providers
- **messages**: Individual messages within conversations
- **notifications**: System notifications for users
- **transactions**: Payment transaction records
- **reviews**: Service and provider reviews with ratings

## Firebase Security Rules

The application uses security rules that implement the following permissions:

- **Users Collection**: Public read, own profile write
- **Services Collection**: Public read, provider-only write for own services
- **Providers Collection**: Public read, own profile write
- **Conversations Collection**: Read/write limited to conversation participants
- **Messages Collection**: Read/write limited to conversation participants
- **Notifications Collection**: Own notifications only
- **Transactions Collection**: Read/write limited to transaction participants
- **Reviews Collection**: Public read, own reviews write

## Firebase Indexes

The application uses custom indexes for:
- Services by category and creation date
- Services by provider and creation date
- Transactions by provider and creation date
- Transactions by user and creation date
- Messages by conversation and timestamp
- Notifications by user and creation date

For more detailed information on the Firebase structure, refer to FIRESTORE_STRUCTURE.md in the project.

## Deployment

The application is configured for easy deployment on Vercel:

```bash
vercel
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- UI components built with Radix UI primitives
- Icons from Lucide Icons
- Form validation with Zod and React Hook Form
