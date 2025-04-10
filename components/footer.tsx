"use client"

import Link from "next/link"
import { useState } from "react"
import { CookieOptionsModal } from "@/components/cookie-options-modal"
import { useCookies } from "@/context/cookie-context"

export function Footer() {
  const { saveCookieOptions } = useCookies()
  const [cookieOptionsOpen, setCookieOptionsOpen] = useState(false)
  
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* First row - Logo and Tagline (full width on mobile) */}
        <div className="mb-6 border-b pb-4">
          <Link href="/" className="flex items-center justify-center sm:justify-start">
            <img src="/AlimaLOGO.svg?height=32&width=32" alt="Logo" className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold text-blue">Alima</span>
          </Link>
          <p className="mt-4 text-center sm:text-left text-sm text-muted-foreground">
            Connecting skilled professionals with those who need their services.
          </p>
        </div>

        {/* Second row - Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-center sm:text-left">Services</h3>
            <ul className="space-y-2 text-sm text-center sm:text-left">
              <li>
                <Link href="/popular-today" className="text-muted-foreground hover:text-primary">
                  Popular Services
                </Link>
              </li>
              <li>
                <Link href="/explore/design" className="text-muted-foreground hover:text-primary">
                  Design
                </Link>
              </li>
              <li>
                <Link href="/explore/development" className="text-muted-foreground hover:text-primary">
                  Development
                </Link>
              </li>
              <li>
                <Link href="/explore/marketing" className="text-muted-foreground hover:text-primary">
                  Marketing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-center sm:text-left">Company</h3>
            <ul className="space-y-2 text-sm text-center sm:text-left">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-center sm:text-left">Legal</h3>
            <ul className="space-y-2 text-sm text-center sm:text-left">
              <li>
                <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setCookieOptionsOpen(true)}
                  className="text-muted-foreground hover:text-primary text-left cursor-pointer"
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Alima. All rights reserved.</p>
        </div>
      </div>
      
      {/* Cookie preferences modal */}
      <CookieOptionsModal
        open={cookieOptionsOpen}
        onOpenChange={setCookieOptionsOpen}
        onSave={saveCookieOptions}
      />
    </footer>
  )
}

