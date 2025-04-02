export interface User {
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  phoneNumber?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: 'user' | 'provider' | 'admin';
  isActive?: boolean;
}
