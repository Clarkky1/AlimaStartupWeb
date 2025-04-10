"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>

      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="text-muted-foreground mb-6">
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you visit our website, including any other media form, media channel, mobile website,
          or mobile application related or connected to it.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>
          We may collect information about you in various ways. The information we collect may
          include:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Personal Data: Name, email address, phone number, etc.</li>
          <li>Derivative Data: Information our servers automatically collect when you access our platform.</li>
          <li>Financial Data: Payment information when you make a purchase or transaction.</li>
          <li>Mobile Device Data: Device information, IP address, browser type, etc.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cookie Usage</h2>
        <p>
          We use cookies to enhance your experience, gather general visitor information, and track
          visits to our website. We use cookies for the following purposes:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li><strong>Necessary Cookies:</strong> Essential for the basic functionality of our website.</li>
          <li><strong>Functional Cookies:</strong> Allow our website to remember choices you've made.</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
          <li><strong>Advertising Cookies:</strong> Used to deliver advertisements more relevant to you and your interests.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Your Information</h2>
        <p>
          Having accurate information about you permits us to provide you with a smooth, efficient,
          and customized experience. We may use information collected about you via the platform to:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Create and manage your account</li>
          <li>Process transactions</li>
          <li>Offer new products, services, and/or recommendations to you</li>
          <li>Increase the efficiency and operation of our platform</li>
          <li>Monitor and analyze usage and trends</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Disclosure of Your Information</h2>
        <p>
          We may share information we have collected about you in certain situations. Your
          information may be disclosed as follows:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>By Law or to Protect Rights</li>
          <li>Business Transfers</li>
          <li>Third-Party Service Providers</li>
          <li>Marketing Communications</li>
          <li>Interactions with Other Users</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Choices</h2>
        <p>
          You may change your cookie settings at any time through our cookie consent banner.
          You can also disable cookies through your browser settings, but please note that
          some features of our website may not function properly without cookies.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact Us</h2>
        <p className="mb-12">
          If you have any questions or suggestions about our Privacy Policy, do not hesitate to
          contact us through our platform or at support@example.com.
        </p>
      </div>
    </div>
  )
} 