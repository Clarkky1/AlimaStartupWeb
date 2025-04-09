"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNetworkStatus } from "@/app/context/network-status-context"

interface Testimonial {
  id: string
  name: string
  role: string
  avatar: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sevvi",
    role: "Small Business Owner",
    avatar: "/person-male-1.svg",
    quote: "Alima transformed how I manage my online presence. I found the perfect web developer for my e-commerce site in just days instead of weeks. The quality of service providers and the seamless payment system make this platform indispensable for my business.",
    rating: 5
  },
  {
    id: "2",
    name: "Mel",
    role: "Freelance Designer",
    avatar: "https://res.cloudinary.com/duslhnwq0/image/upload/v1716986754/profile-pictures/placeholder-male_rwlmcu.jpg",
    quote: "As a freelancer, I've tried many platforms but Alima stands out with its clean interface and focus on Filipino talent. The verification process ensures clients get quality service, and I love how easy it is to showcase my portfolio and receive payments.",
    rating: 5
  },
  {
    id: "3",
    name: "Angel",
    role: "Marketing Manager",
    avatar: "/person-male-1.svg",
    quote: "I needed multiple digital marketing services for our campaign launches. Alima helped me find specialized professionals for each aspect - from social media management to content creation. The messaging system made coordination effortless.",
    rating: 5
  },
  {
    id: "4",
    name: "John Josfir Roca",
    role: "Tech Startup Founder",
    avatar: "https://res.cloudinary.com/duslhnwq0/image/upload/v1716986754/profile-pictures/placeholder-male_rwlmcu.jpg",
    quote: "Our startup needed UI/UX designers urgently, and we were impressed by how quickly we connected with top talent through Alima. The platform's focus on both global and local services gives us flexibility depending on our project needs.",
    rating: 5
  },
  {
    id: "5",
    name: "Myco",
    role: "Event Organizer",
    avatar: "/person-male-1.svg",
    quote: "Planning corporate events is stressful, but Alima made finding reliable vendors a breeze. The detailed profiles and verified reviews gave me confidence in my choices. The payment protection feature also provided peace of mind for both parties.",
    rating: 5
  }
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { isOnline } = useNetworkStatus()

  // Function to handle automatic rotation
  const rotateTestimonial = () => {
    setFadeIn(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
      setFadeIn(true)
    }, 300)
  }

  // Set up auto rotation with a temporary pause on user interaction
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        rotateTestimonial()
      }
    }, 5000) // Rotate every 5 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  // Function to temporarily pause rotation when user interacts
  const pauseAutoRotation = () => {
    setIsPaused(true)
    
    // Clear any existing timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    
    // Resume after 10 seconds of inactivity
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 10000)
  }

  const handlePrevious = () => {
    pauseAutoRotation()
    setFadeIn(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
      setFadeIn(true)
    }, 300)
  }

  const handleNext = () => {
    pauseAutoRotation()
    setFadeIn(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
      setFadeIn(true)
    }, 300)
  }

  const currentTestimonial = testimonials[currentIndex]
  
  // Get secure avatar URL that respects network status
  const avatarSrc = currentTestimonial.avatar.startsWith('http') 
    ? (isOnline ? currentTestimonial.avatar : "/placeholder.jpg") 
    : currentTestimonial.avatar

  return (
    <section className="bg-gradient-to-b from-background to-muted py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">What People Say About Alima</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Hear from our clients and service providers about their experiences using our platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border shadow-lg">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="bg-primary/10 p-6 md:p-10 md:w-1/3 flex flex-col items-center justify-center">
                  <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={avatarSrc} alt={currentTestimonial.name} />
                    <AvatarFallback className="text-2xl">
                      {currentTestimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center mt-4">
                    <h3 className="font-bold text-lg">{currentTestimonial.name}</h3>
                    <p className="text-muted-foreground">{currentTestimonial.role}</p>
                    <div className="flex justify-center mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < currentTestimonial.rating ? "text-yellow-500" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={`p-6 md:p-10 md:w-2/3 flex flex-col justify-center transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
                  <Quote className="h-10 w-10 text-primary/40 mb-4" />
                  <p className="text-lg italic leading-relaxed">{currentTestimonial.quote}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-6 gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              className="rounded-full"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-1">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? "w-6 bg-primary" : "bg-primary/30"
                  }`}
                  onClick={() => {
                    pauseAutoRotation()
                    setFadeIn(false)
                    setTimeout(() => {
                      setCurrentIndex(idx)
                      setFadeIn(true)
                    }, 300)
                  }}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
