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

## Technology Stack

### Frontend
- **Framework**: Next.js with TypeScript
- **UI Components**: Custom components built with Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Firebase Authentication

### Backend
- **Database**: Firebase Firestore
- **Storage**: Cloudinary for image storage and optimization
- **Authentication**: Firebase Auth
- **Hosting**: Vercel

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/alima-web-integration.git
cd alima-web-integration
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory and add your Firebase and Cloudinary credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
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
│   ├── lib/              # Utility functions
│   ├── message/          # Messaging system
│   └── ...               # Other app routes
├── components/           # React components
│   ├── dashboard/        # Dashboard components
│   ├── home/             # Homepage components
│   ├── ui/               # Reusable UI components
│   └── ...               # Other component categories
├── public/               # Static files
└── ...                   # Configuration files
```

## Firebase Schema

The project uses Firebase Firestore with the following main collections:

- **users**: User accounts and profiles
- **services**: Service listings
- **messages**: Communication between clients and providers
- **reviews**: Service reviews and ratings

## Deployment

The application is configured for easy deployment on Vercel:

```bash
vercel
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- UI components inspired by shadcn/ui
- Icons from Lucide Icons
- SVG illustrations from various open-source libraries
