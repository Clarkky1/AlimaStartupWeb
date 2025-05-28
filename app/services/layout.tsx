"use client"

import React from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/app/context/auth-context";
import { CategoryProvider } from "@/app/context/category-context";
import { NetworkStatusProvider } from "@/app/context/network-status-context";
import { CookieProvider } from "@/context/cookie-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ServicesLayout({
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
                {/* Fixed Back Button */}
                <div className="fixed top-0 left-0 right-0 px-4 py-3 bg-background z-10">
                  <div className="container mx-auto">
                    <Link href="/">
                      <Button 
                        variant="ghost" 
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Main Content Area - Add padding to prevent overlap with fixed button */}
                <div className="container mx-auto px-4 pt-20 pb-6">
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