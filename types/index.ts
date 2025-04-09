export interface User {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  profilePicture?: string;
  role?: string;
  title?: string;
  bio?: string;
  phone?: string;
  location?: string;
  specialties?: string[];
  rating?: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  providerId: string;
  featured?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  serviceId?: string;
  serviceCategory?: string;
  serviceTitle?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSenderId?: string;
  createdAt: Date;
  updatedAt: Date;
  unreadCountUser?: number;
  unreadCountProvider?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  timestamp: Date;
  read: boolean;
  paymentProof?: string;
  paymentConfirmed?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  serviceId: string;
  amount: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  contacts: number;
  contactsChange: number;
  transactions: number;
  transactionsChange: number;
  rating: number;
  ratingChange: number;
  revenue: string;
  revenueChange: number;
  serviceContactPercentage: number;
  totalServices: number;
  contactedServices: number;
  topServices?: Array<{
    id: string;
    name: string;
    revenue: number;
    count: number;
    avgRevenue: number;
  }>;
}

export interface CategoryData {
  name: string;
  value: number;
  revenue?: number;
  serviceCount?: number;
  contactPercentage?: number;
}

export interface TimelineData {
  date: string;
  contacts: number;
  transactions: number;
} 