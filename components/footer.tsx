import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center">
              <img src="/AlimaLOGO.svg?height=32&width=32" alt="Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-blue">Alima</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Connecting skilled professionals with those who need their services.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Services</h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-primary">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Alima. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

