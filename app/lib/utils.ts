import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number or string as currency with thousand separators
 * @param value The value to format (can be number or string)
 * @param currency The currency symbol to use (default: ₱)
 * @returns Formatted currency string with thousand separators
 */
export function formatCurrency(value: string | number, currency: string = '₱') {
  // Handle edge cases
  if (value === null || value === undefined) return `${currency}0`;
  
  // Convert to number and validate
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/,/g, '')) 
    : value;
  
  // Return formatted string
  if (isNaN(numValue)) return `${currency}0`;
  
  // Format with thousand separators
  return `${currency}${numValue.toLocaleString('en-PH')}`;
} 