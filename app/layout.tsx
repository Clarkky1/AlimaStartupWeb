"use client"

import React from 'react';
import { Poppins, Work_Sans } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import 'aos/dist/aos.css';
import { ThemeProvider } from "@/components/theme-provider";
import { ChatButtonWrapper } from "@/components/chat-button-wrapper";
import { usePathname } from 'next/navigation';

// Import providers in a specific order to prevent circular dependencies
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/app/context/auth-context";
import { CategoryProvider } from "@/app/context/category-context";
import { ClientLayout } from "@/components/layout/client-layout";
import { NetworkStatusProvider } from "@/app/context/network-status-context";
import { CookieProvider } from "@/context/cookie-context";

// Font configurations
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  preload: false,
});

const workSans = Work_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  preload: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <title>Alima - Find and Offer Services</title>
        <meta name="description" content="Connect with service providers and clients in your area" />
        <link rel="icon" href="/AlimaLOGO.svg" sizes="any" type="image/svg+xml" />
        <meta name="apple-touch-icon" content="/AlimaLOGO.svg" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        poppins.variable,
        workSans.variable
      )} suppressHydrationWarning>
        <NetworkStatusProvider>
          <CookieProvider>
            <AuthProvider>
              <CategoryProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  disableTransitionOnChange
                >
                  {isHomePage ? (
                    <ClientLayout>
                      {children}
                    </ClientLayout>
                  ) : (
                    children
                  )}
                  <ChatButtonWrapper />
                </ThemeProvider>
              </CategoryProvider>
              <Toaster />
            </AuthProvider>
          </CookieProvider>
        </NetworkStatusProvider>
      </body>
    </html>
  );
}