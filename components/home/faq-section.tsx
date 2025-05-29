"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "How do I find the right service provider?",
    answer: "Our platform offers detailed profiles, reviews, and portfolios so you can evaluate service providers. You can also filter by location, price range, and category to find the perfect match."
  },
  {
    question: "How much does it cost to join Alima?",
    answer: "Creating an account on Alima is completely free. Service providers pay a small commission on completed jobs, while clients can browse, contact, and hire providers at no cost."
  },
  {
    question: "How are payments handled?",
    answer: "All payments are processed securely through Alima. Funds are held until the service is completed and approved, protecting both users and providers."
  },
  {
    question: "What if I'm not satisfied with the service?",
    answer: "Our satisfaction guarantee ensures you only pay for work that meets your requirements. If issues arise, our dispute resolution team will help mediate and find a fair solution."
  },
  {
    question: "Why does Alima handle all payments?",
    answer: "Handling payments through Alima protects both users and providers. Funds are only released when the service is complete, reducing risk and ensuring satisfaction for everyone."
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div id="faq" className="py-12 relative scroll-mt-40 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="mx-auto max-w-5xl lg:max-w-6xl">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl mb-6 text-gray-900 dark:text-gray-100">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-0 max-w-2xl mx-auto text-lg">
              You question isn't listed here? <a href="#contact" className="underline">Get in touch.</a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-0 max-w-2xl mx-auto text-lg">
              Find answers to common questions about Alima.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4" data-aos="fade-up" data-aos-delay="150">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqItems.map((item, index) => (
                <div key={index} className="py-6 group">
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleFAQ(index)}
                  >
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      {item.question}
                    </h3>
                    <div className="ml-4 flex-shrink-0 flex items-center justify-center w-6 h-6">
                      {openIndex === index ? (
                        <Minus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                  {openIndex === index && (
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mt-4">
                      {item.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 