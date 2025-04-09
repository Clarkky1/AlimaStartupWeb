"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [formState, setFormState] = useState<'input' | 'success'>('input')
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const toggleChat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Prevent default to stop scrolling
    setIsOpen(!isOpen)
    // Reset to input form when reopening
    if (!isOpen) {
      setFormState('input')
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Prepare email submission data
    const mailtoLink = `mailto:contact@alima.com?subject=Contact from Alima Website&body=${messageRef.current?.value || ''} - From: ${emailRef.current?.value || 'No email provided'}`
    window.open(mailtoLink)
    // Show success message
    setFormState('success')
    // Reset form
    if (emailRef.current) emailRef.current.value = ''
    if (messageRef.current) messageRef.current.value = ''
  }

  return (
    <>
      {/* Chat button */}
      <div className="fixed bottom-6 right-6 z-50" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={toggleChat}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors focus:outline-none"
          aria-label="Open chat"
          type="button"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white text-black rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Chat header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                  <Image src="/AlimaLOGO.svg" alt="Alima" width={28} height={28} className="object-contain" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium">Hey there! 👋</h3>
                  <p className="text-sm text-gray-600">Got questions? Get in touch with us</p>
                </div>
              </div>
            </div>

            {/* Chat content */}
            <div className="p-4 bg-white">
              {formState === 'input' ? (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      id="email"
                      ref={emailRef}
                      type="email"
                      className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      id="message"
                      ref={messageRef}
                      rows={4}
                      className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="How can we help you?"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-primary hover:bg-blue-600 text-white transition-colors font-medium"
                  >
                    Send Message
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">Thank you for reaching out!</h3>
                  <p className="text-gray-600 max-w-xs">
                    We've received your message and will get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => setFormState('input')}
                    className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors font-medium"
                  >
                    Send another message
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 