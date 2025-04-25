import { z } from "zod";

// Define schemas for common data types
export const MessageSchema = z.object({
  text: z.string().trim().min(1).max(3000),
  conversationId: z.string().min(1),
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
});

export const UserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  role: z.enum(["client", "provider", "admin"]).optional(),
});

export const ServiceSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  price: z.number().positive().or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
  category: z.string().min(1),
  providerId: z.string().min(1),
});

export const PaymentProofSchema = z.object({
  paymentProof: z.string().url(),
  serviceId: z.string().optional(),
  serviceTitle: z.string().optional(),
  paymentAmount: z.number().positive().optional(),
  text: z.string().max(500).optional(),
});

// Field name validation
export const allowedUserFields = ["name", "email", "displayName", "role", "profileComplete", "profilePicture"];
export const allowedMessageFields = ["text", "conversationId", "senderId", "receiverId", "read"];
export const allowedServiceFields = ["title", "description", "price", "category", "image", "active"];

/**
 * Validates if a field name is allowed for queries
 * @param field The field name to validate
 * @param allowedFields Array of allowed field names
 * @returns boolean indicating if field is valid
 */
export function isValidField(field: string, allowedFields: string[]): boolean {
  return allowedFields.includes(field);
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 * Simple sanitization for basic text inputs
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeBasicInput(input: string): string {
  if (!input) return "";
  // Replace potentially dangerous characters with safe equivalents
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates and sanitizes query parameters
 * @param queryParam The query parameter to validate
 * @param allowedValues Array of allowed values
 * @returns The validated parameter or a default value
 */
export function validateQueryParam(
  queryParam: string | string[] | undefined, 
  allowedValues: string[],
  defaultValue: string
): string {
  if (!queryParam || Array.isArray(queryParam)) {
    return defaultValue;
  }
  
  const sanitizedParam = sanitizeBasicInput(queryParam);
  return allowedValues.includes(sanitizedParam) ? sanitizedParam : defaultValue;
} 