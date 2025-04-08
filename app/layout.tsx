import React from 'react';
import { Poppins, Work_Sans } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';
import { cn } from "@/lib/utils";

// Import providers in a specific order to prevent circular dependencies
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/app/context/auth-context";
import { CategoryProvider } from "@/app/context/category-context";
import { CustomThemeProvider } from "@/themes/theme-context";
import { ClientLayout } from "@/components/layout/client-layout";

// Font configurations
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const workSans = Work_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Alima - Find and Offer Services',
  description: 'Connect with service providers and clients in your area',
  icons: {
    icon: [
      { url: '/AlimaLOGO.svg', type: 'image/svg+xml' },
      { url: '/AlimaLOGO.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/AlimaLOGO.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/AlimaLOGO.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add preload hint for critical JavaScript */}
        <link 
          rel="preload" 
          href="/_next/static/chunks/app/layout.js" 
          as="script" 
          fetchPriority="high" 
        />
        {/* Add preload for critical CSS */}
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
        />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        poppins.variable,
        workSans.variable
      )} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider defaultVariant="default">
            <AuthProvider>
              <CategoryProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </CategoryProvider>
              <Toaster />
            </AuthProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}