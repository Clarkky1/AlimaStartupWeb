"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>

        <p className="text-muted-foreground mb-6">
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        <p className="mb-6">
          Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the Alima platform operated by us.
        </p>

        <p className="mb-8">
          Your access to and use of the service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
        <p>
          By accessing or using our platform, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Service Description</h2>
        <p>
          Alima is a platform that connects service providers and clients, allowing users to:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Create accounts and profiles</li>
          <li>Offer services as a provider</li>
          <li>Book and purchase services as a client</li>
          <li>Exchange messages and information</li>
          <li>Rate and review services</li>
          <li>Process payments through our platform</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
        </p>
        <p className="mt-2">
          You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Service Listings and Transactions</h2>
        <p>
          Service providers are responsible for the accuracy of their service listings, including descriptions, pricing, and availability. Clients are responsible for carefully reviewing service listings before making a purchase.
        </p>
        <p className="mt-2">
          Alima facilitates transactions between service providers and clients but is not responsible for the quality, safety, legality, or availability of services offered on our platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Payments and Fees</h2>
        <p>
          Alima may charge service fees for using our platform. These fees will be clearly disclosed before any transaction is completed.
        </p>
        <p className="mt-2">
          Payment processing is handled securely through our platform. Service providers will receive payment once a service is completed and confirmed by the client.
        </p>
        <p className="mt-2">
          Refunds may be issued in accordance with our Refund Policy and at our discretion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Reviews and Ratings</h2>
        <p>
          Users may leave reviews and ratings for services they have received. All reviews must be truthful, accurate, and comply with our content policies.
        </p>
        <p className="mt-2">
          We reserve the right to remove reviews that violate our policies or Terms of Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Prohibited Activities</h2>
        <p>
          The following activities are prohibited on our platform:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Posting false, misleading, or deceptive content</li>
          <li>Engaging in illegal activities or promoting illegal services</li>
          <li>Harassing, abusing, or threatening other users</li>
          <li>Creating multiple accounts or impersonating others</li>
          <li>Attempting to bypass any platform security measures</li>
          <li>Using the platform to distribute malware or harmful content</li>
          <li>Offering services that violate our policies or applicable laws</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Intellectual Property</h2>
        <p>
          The service and its original content, features, and functionality are and will remain the exclusive property of Alima and its licensors. The service is protected by copyright, trademark, and other laws.
        </p>
        <p className="mt-2">
          Users retain ownership of content they create and share on the platform, but grant Alima a license to use, reproduce, and display such content for the purpose of operating the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
        <p>
          In no event shall Alima, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Your access to or use of or inability to access or use the service</li>
          <li>Any conduct or content of any third party on the service</li>
          <li>Any content obtained from the service</li>
          <li>Unauthorized access, use or alteration of your transmissions or content</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
        <p className="mt-2">
          Upon termination, your right to use the service will immediately cease. If you wish to terminate your account, you may simply discontinue using the service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
        </p>
        <p className="mt-2">
          By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the Philippines, without regard to its conflict of law provisions.
        </p>
        <p className="mt-2">
          Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Us</h2>
        <p className="mb-12">
          If you have any questions about these Terms, please contact us through our platform or at support@alima.com.
        </p>
      </div>
    </div>
  )
} 