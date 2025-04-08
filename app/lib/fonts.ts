import { Poppins, Work_Sans } from 'next/font/google'

// Configure fonts with better error handling and fallbacks
export const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  preload: false, // Prevents blocking on Google Fonts failures
})

export const workSans = Work_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  preload: false, // Prevents blocking on Google Fonts failures
}) 