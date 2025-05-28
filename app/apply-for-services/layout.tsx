"use client"

import React from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/app/context/auth-context";
import { CategoryProvider } from "@/app/context/category-context";
import { NetworkStatusProvider } from "@/app/context/network-status-context";
import { CookieProvider } from "@/context/cookie-context";

export default function ApplyForServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NetworkStatusProvider>
      <CookieProvider>
        <AuthProvider>
          <CategoryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-6">
                  {children}
                </div>
              </div>
              <Toaster />
            </ThemeProvider>
          </CategoryProvider>
        </AuthProvider>
      </CookieProvider>
    </NetworkStatusProvider>
  );
} 