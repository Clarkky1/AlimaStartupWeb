"use client"

import { HeroSection } from "@/components/home/hero-section"
import { GlobalServices } from "@/components/home/featured-services"
import { TopProviders } from "@/components/popular/top-providers"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Suspense, useEffect, useState, useCallback } from "react"
import { CheckCircle, Search, MessageSquare, CreditCard, Plus, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStatistics } from "@/app/hooks/useStatistics"
import { useNetworkStatus } from "@/app/context/network-status-context";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { usePathname } from "next/navigation";

export default function Home() {
  const { isOnline } = useNetworkStatus();
  const placeholderImg = "/placeholder.jpg";
  const [loadKey, setLoadKey] = useState(Date.now());
  const pathname = usePathname();
  
  // Reset the component on each visit by forcing a complete remount
  useEffect(() => {
    // Scroll to top on each mount of this component
    window.scrollTo(0, 0);
    
    // Check if this is a navigation back to the home page
    if (typeof window !== 'undefined') {
      // Get the navigation state from sessionStorage
      const hasBeenLoaded = sessionStorage.getItem('homeLoaded');
      
      // If the page hasn't been loaded before in this session,
      // or it's been more than 5 minutes, trigger a refresh
      const lastLoadTime = parseInt(sessionStorage.getItem('homeLoadTime') || '0');
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      if (!hasBeenLoaded || lastLoadTime < fiveMinutesAgo) {
        // Set home as loaded and update the load time
        sessionStorage.setItem('homeLoaded', 'true');
        sessionStorage.setItem('homeLoadTime', Date.now().toString());
        
        // Set a new key to force remount
        setLoadKey(Date.now());
      }
    }
  }, []); // Only run on initial mount
  
  // Fetch statistics with the loadKey to force refresh
  const { userCount, serviceCount, providerCount, isLoading } = useStatistics();
  
  // Format numbers with K suffix (e.g., 15300 -> 15.3K)
  const formatStatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Add the cursor follower script
  useEffect(() => {
    const cursorFollower = document.getElementById('cursor-follower');
    const targetElement = cursorFollower?.parentElement;
    
    if (!cursorFollower || !targetElement) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = targetElement.getBoundingClientRect();
      const x = e.clientX - rect.left - 64; // Centering the 128px cursor follower
      const y = e.clientY - rect.top - 64;
      
      // Add a subtle delay for smoother following
      cursorFollower.style.transition = 'transform 0.2s ease-out, background 0.3s ease';
      cursorFollower.style.transform = `translate(${x}px, ${y}px)`;
      
      // Change gradient color based on position
      const normalizedX = (e.clientX - rect.left) / rect.width;
      if (normalizedX < 0.5) {
        cursorFollower.style.background = 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.2) 70%)';
      } else {
        cursorFollower.style.background = 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(5,150,105,0.2) 70%)';
      }
    };
    
    const handleMouseEnter = () => {
      cursorFollower.style.opacity = '1';
      targetElement.style.cursor = 'none';
    };
    
    const handleMouseLeave = () => {
      cursorFollower.style.opacity = '0';
      targetElement.style.cursor = 'auto';
    };
    
    targetElement.addEventListener('mousemove', handleMouseMove);
    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      targetElement.removeEventListener('mousemove', handleMouseMove);
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white relative overflow-hidden" key={loadKey}>
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Flowing curved lines background */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-50 dark:opacity-30">
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c5c5c5" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b9b9b9" />
              <stop offset="100%" stopColor="#d9d9d9" />
            </linearGradient>
          </defs>
          <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 C1150,200 1350,0 1500,100 C1650,200 1850,0 2000,100" 
            stroke="url(#lineGradient1)" 
            fill="none" 
            strokeWidth="1.5" 
          />
          <path d="M0,300 C150,400 350,200 500,300 C650,400 850,200 1000,300 C1150,400 1350,200 1500,300 C1650,400 1850,200 2000,300" 
            stroke="url(#lineGradient2)" 
            fill="none" 
            strokeWidth="2" 
          />
          <path d="M0,500 C150,600 350,400 500,500 C650,600 850,400 1000,500 C1150,600 1350,400 1500,500 C1650,600 1850,400 2000,500" 
            stroke="url(#lineGradient1)" 
            fill="none" 
            strokeWidth="1.5" 
          />
          <path d="M0,700 C150,800 350,600 500,700 C650,800 850,600 1000,700 C1150,800 1350,600 1500,700 C1650,800 1850,600 2000,700" 
            stroke="url(#lineGradient2)" 
            fill="none" 
            strokeWidth="2" 
          />
          <path d="M0,900 C150,1000 350,800 500,900 C650,1000 850,800 1000,900 C1150,1000 1350,800 1500,900 C1650,1000 1850,800 2000,900" 
            stroke="url(#lineGradient1)" 
            fill="none" 
            strokeWidth="1.5" 
          />
          <path d="M0,1100 C150,1200 350,1000 500,1100 C650,1200 850,1000 1000,1100 C1150,1200 1350,1000 1500,1100 C1650,1200 1850,1000 2000,1100" 
            stroke="url(#lineGradient2)" 
            fill="none" 
            strokeWidth="2" 
          />
        </svg>
      </div>
      
      <main className="flex-1 relative z-10">
        {/* 1. HEADLINE - Hero Section (acts as main headline/tagline) */}
        <Suspense fallback={<div className="h-[600px] w-full bg-neutral-100 dark:bg-neutral-900" />}>
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
            <section className="py-16 md:py-24" id="home">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20 items-center">
                <div className="order-2 lg:order-1" data-aos="fade-right" data-aos-delay="200">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-8">
                    Find the perfect service for your business needs
                  </h1>
                  <p className="mb-10 max-w-lg text-base sm:text-lg text-gray-600 dark:text-gray-300">
                    Connect with skilled professionals for all your business requirements. From software development to marketing and design, we've got you covered.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button asChild size="lg" className="rounded-full px-8">
                      <Link href="/popular-today">Browse Services</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                      <a 
                        href="#how-it-works"
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById("how-it-works");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        How It Works
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="order-1 lg:order-2" data-aos="fade-left" data-aos-delay="300">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    <div className="relative h-[450px] flex items-center justify-center">
                      <div className="relative grid grid-cols-2 grid-rows-2 gap-6 max-w-md mx-auto">
                        {/* Top-left person */}
                        <div className="relative bg-[#ffd280] rounded-2xl overflow-hidden shadow-lg transform rotate-2 z-10">
                          <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full"></div>
                          <img 
                            alt="Person in orange shirt" 
                            className="w-full h-48 object-cover object-top"
                            // Use placeholder if offline, original src if online
                            src={isOnline ? "/images/people/person1.jpg" : placeholderImg}
                          />
                        </div>
                        
                        {/* Top-right person */}
                        <div className="relative bg-[#c4a7ff] rounded-2xl overflow-hidden shadow-lg transform -rotate-1 translate-y-4 z-20">
                          <div className="absolute top-2 left-2 w-4 h-4 bg-white/30 rounded-full"></div>
                          <img 
                            alt="Person with glasses" 
                            className="w-full h-52 object-cover object-top"
                            // Use placeholder if offline, original src if online
                            src={isOnline ? "/images/people/person2.jpg" : placeholderImg} 
                          />
                        </div>
                        
                        {/* Bottom-left - decorative element */}
                        <div className="relative bg-[#a0e4ff] rounded-2xl overflow-hidden shadow-lg transform -rotate-3 z-20 flex items-center justify-center h-32">
                          <div className="absolute w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 flex items-center justify-center">
                              <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                              <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                              <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                              <div className="h-3 w-3 rounded-full bg-white mx-1"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Bottom-right person */}
                        <div className="relative bg-[#b7e5a2] rounded-2xl overflow-hidden shadow-lg transform rotate-1 -translate-y-2 z-10">
                          <div className="absolute bottom-2 right-2 w-5 h-5 bg-white/30 rounded-full"></div>
                          <img 
                            alt="Person in pink" 
                            className="w-full h-48 object-cover object-top"
                            // Use placeholder if offline, original src if online
                            src={isOnline ? "/images/people/person3.jpg" : placeholderImg}
                          />
                        </div>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-1/3 right-1/3 text-[#10b981]">
                        <Plus className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      
                      <div className="absolute bottom-1/4 left-1/3 text-[#3b82f6]">
                        <Circle className="h-4 w-4" fill="#3b82f6" strokeWidth={0} />
                      </div>
                      
                      <div className="absolute top-1/2 right-1/4 h-3 w-3 rounded-full bg-[#f9a8d4]"></div>
                      <div className="absolute bottom-1/3 left-1/4 h-3 w-3 rounded-full bg-[#fcd34d]"></div>
                    </div>
                    
                    {/* User Statistics */}
                    <div className="flex items-center justify-between mt-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <div className="text-center px-4">
                        <p className="text-2xl font-bold text-primary">
                          {isLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></span>
                          ) : (
                            formatStatNumber(userCount)
                          )}
                        </p>
                        <p className="text-sm text-neutral-500">Active Users</p>
                      </div>
                      <div className="text-center px-4 border-x border-gray-200 dark:border-gray-800">
                        <p className="text-2xl font-bold text-primary">
                          {isLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></span>
                          ) : (
                            formatStatNumber(serviceCount)
                          )}
                        </p>
                        <p className="text-sm text-neutral-500">Services</p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-2xl font-bold text-primary">
                          {isLoading ? (
                            <span className="inline-block h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></span>
                          ) : (
                            formatStatNumber(providerCount)
                          )}
                        </p>
                        <p className="text-sm text-neutral-500">Providers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Suspense>
        
        {/* 2. PROBLEM - Client's Problem Section */}
        <div id="problem" className="py-28 bg-white/95 dark:bg-black/95 relative scroll-mt-40">
          <div className="container mx-auto px-6 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-10 text-center" data-aos="fade-up">The Problem We Solve</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-10">
                <div data-aos="fade-right" data-aos-delay="100">
                  <p className="text-lg mb-6">
                    Finding reliable service providers can be time-consuming and frustrating. You often deal with:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <span className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full mr-3 mt-1">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <span>Unreliable providers who deliver poor quality work</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full mr-3 mt-1">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <span>Difficulty finding the right skills for your specific needs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full mr-3 mt-1">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <span>Lack of transparency in pricing and qualifications</span>
                    </li>
                  </ul>
                </div>
                <div className="border rounded-xl overflow-hidden shadow-lg" data-aos="fade-left" data-aos-delay="200">
                  <img 
                    // Use placeholder if offline, original src if online
                    src={isOnline ? "/problem-image.jpg" : placeholderImg} 
                    alt="Finding service providers is frustrating" 
                    className="w-full h-auto" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 3. SOLUTION/SERVICES - How It Works Section */}
        <div id="how-it-works" className="py-32 bg-neutral-50/95 dark:bg-neutral-950/95 relative scroll-mt-40">
          <div className="container mx-auto px-6 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-5" data-aos="fade-up">How Alima Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-20" data-aos="fade-up" data-aos-delay="100">
                Our platform makes it easy to connect with the right service providers or find clients for your services
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center p-8" data-aos="zoom-in" data-aos-delay="100">
                  <div className="rounded-full bg-primary/10 p-5 mb-6">
                    <Search className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Discover</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Browse through verified service providers or post your service offering
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center p-8" data-aos="zoom-in" data-aos-delay="200">
                  <div className="rounded-full bg-primary/10 p-5 mb-6">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Select</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Choose the perfect match based on reviews, portfolio, and pricing
                  </p>
                </div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center p-8" data-aos="zoom-in" data-aos-delay="300">
                  <div className="rounded-full bg-primary/10 p-5 mb-6">
                    <MessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Connect</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Communicate directly to discuss requirements and expectations
                  </p>
                </div>
                
                {/* Step 4 */}
                <div className="flex flex-col items-center p-8" data-aos="zoom-in" data-aos-delay="400">
                  <div className="rounded-full bg-primary/10 p-5 mb-6">
                    <CreditCard className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Transact</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Secure payment and delivery system with satisfaction guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 4. PROOF/PORTFOLIO - Top Service Providers Section */}
        <div id="track-record" className="py-20 bg-white/95 dark:bg-black/95 relative scroll-mt-40">
          <div className="container mx-auto px-3 sm:px-4 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-3" data-aos="fade-up">Our Track Record</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                  See the successful connections we've made and the quality of our service providers
                </p>
              </div>
              
              <div className="relative" data-aos="fade-up" data-aos-delay="200">
                <Suspense fallback={<div className="h-[300px] w-full bg-neutral-100 dark:bg-neutral-900 rounded-3xl" />}>
                  <TopProviders key={`providers-${loadKey}`} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* 5. PROOF/TESTIMONIALS */}
        <div id="testimonials" className="py-24 bg-neutral-50/95 dark:bg-neutral-950/95 relative scroll-mt-40">
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-8 text-center" data-aos="fade-up">What Our Users Say</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <div className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 p-8 rounded-2xl shadow-lg relative overflow-hidden group" data-aos="fade-up" data-aos-delay="100">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-primary/20 to-green-400/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-white/20 dark:bg-white/10 mr-4 overflow-hidden">
                        <PlaceholderImage
                          src="/testimonial-1.jpg"
                          alt="User" 
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">Sarah Johnson</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Business Owner</p>
                      </div>
                    </div>
                    <p className="text-base text-neutral-700 dark:text-neutral-200">"I found the perfect web developer for my e-commerce store. The entire process was smooth and the communication tools made the project easy to manage."</p>
                    <div className="flex mt-5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Testimonial 2 */}
                <div className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 p-8 rounded-2xl shadow-lg relative overflow-hidden group" data-aos="fade-up" data-aos-delay="200">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-white/20 dark:bg-white/10 mr-4 overflow-hidden">
                        <PlaceholderImage
                          src="/testimonial-2.jpg"
                          alt="User"
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">Michael Torres</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Freelance Designer</p>
                      </div>
                    </div>
                    <p className="text-base text-neutral-700 dark:text-neutral-200">"Alima has transformed my freelance business. I've connected with clients I never would have found otherwise, and the platform handles all the payment processing."</p>
                    <div className="flex mt-5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Testimonial 3 */}
                <div className="backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 p-8 rounded-2xl shadow-lg relative overflow-hidden group" data-aos="fade-up" data-aos-delay="300">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-14 w-14 rounded-full bg-white/20 dark:bg-white/10 mr-4 overflow-hidden">
                        <PlaceholderImage
                          src="/testimonial-3.jpg"
                          alt="User"
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">Leila Amado</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Small Business Owner</p>
                      </div>
                    </div>
                    <p className="text-base text-neutral-700 dark:text-neutral-200">"The verification system gave me confidence in hiring service providers. I've found amazing talent for multiple projects and the quality has been consistently excellent."</p>
                    <div className="flex mt-5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 6. ABOUT US */}
        <div id="about" className="py-24 bg-white/95 dark:bg-black/95 relative scroll-mt-40">
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <div className="mb-24 grid gap-16 md:grid-cols-2 md:items-center">
                <div data-aos="fade-right" data-aos-delay="100">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-6">Our Mission</h2>
                  <p className="mb-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                    Alima was created with a simple but powerful mission: to build a platform that connects skilled service providers with those who need their expertise. Whether you're looking for local services or global remote work, Alima provides a seamless experience for both service providers and clients.
                  </p>
                  <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                    Our platform ensures secure transactions, transparent reviews, and easy communication between parties. We believe in creating opportunities for people to showcase their talents and find quality services at competitive prices.
                  </p>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900" data-aos="fade-left" data-aos-delay="200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl font-bold text-primary/20">Alima</div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"></div>
                </div>
              </div>
              
              {/* Team Section */}
              <div className="mb-24">
                <div className="mb-12 text-center" data-aos="fade-up">
                  <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">Meet Our Team</h2>
                  <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-300 px-4">
                    The passionate individuals behind Alima who work tirelessly to create the best possible experience for our users.
                  </p>
                </div>

                {/* Lead Founder - Featured at the top */}
                <div className="mx-auto mb-10 md:mb-16 max-w-lg px-4" data-aos="zoom-in" data-aos-delay="100">
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 md:p-8 shadow-md border border-neutral-200 dark:border-neutral-800 w-full">
                    <div className="text-center mb-6">
                      <div className="relative mx-auto h-32 w-32 md:h-40 md:w-40 overflow-hidden rounded-full mb-4 md:mb-6">
                        <PlaceholderImage
                          src="/team/Eduardo Empelis Jr..jpg"
                          alt="Eduardo Empelis Jr."
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold">Eduardo Empelis Jr.</h3>
                      <p className="text-primary text-sm font-medium mt-1">Founder</p>
                    </div>
                    <p className="text-center text-sm md:text-base text-neutral-600 dark:text-neutral-300 mb-6">
                      Founded Alima with a vision to revolutionize how people connect with service providers globally and locally.</p>
                    <div className="flex justify-center space-x-3">
                      <a href="https://www.facebook.com/eduardo.empelisjr" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Team Grid - 4 members */}
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 place-items-center px-4">
                  {/* Team Member 1 */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 w-full max-w-sm min-h-[450px]" 
                       data-aos="fade-up" data-aos-delay="150">
                    <div className="text-center mb-6">
                      <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full mb-4">
                        <PlaceholderImage
                          src="/team/Kin Clark Perez.jpg"
                          alt="Kin Clark Perez"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold">Kin Clark Perez</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Lead Software Engineer</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Leads the technical development and architecture of Alima's platform, ensuring efficiency and scalability.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <a href="https://github.com/Clarkky1" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="https://www.linkedin.com/in/kin-clark-perez-164a17294/" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="https://www.facebook.com/jsbdhxhvskaixb/" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                      {/* <a href="https://www.instagram.com/yourboyykinn/" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </a> */}
                    </div>  
                  </div>
                  
                  {/* Team Member 2 */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 w-full max-w-sm min-h-[450px]"
                       data-aos="fade-up" data-aos-delay="200">
                    <div className="text-center mb-6">
                      <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full mb-4">
                        <PlaceholderImage
                          src="/team/Kent B. Veloso.png"
                          alt="Kent Veloso"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold">Kent Veloso</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Brand & Creative Lead</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Designs Alima's visual identity and drives innovative branding strategies to bring its vision to life.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Team Member 3 */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 w-full max-w-sm min-h-[450px]"
                       data-aos="fade-up" data-aos-delay="250">
                    <div className="text-center mb-6">
                      <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full mb-4">
                        <PlaceholderImage
                          src="/team/Kyle Florendo.jpg"
                          alt="Kyle Florendo"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold">Kyle Florendo</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Operations Assistant</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Facilitates project coordination and supports seamless execution of Alima's operations to meet its objectives
                    </p>
                    <div className="flex justify-center space-x-3">
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Team Member 4 */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 w-full max-w-sm min-h-[450px]"
                       data-aos="fade-up" data-aos-delay="300">
                    <div className="text-center mb-6">
                      <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full mb-4">
                        <PlaceholderImage
                          src="/team/Lorenz Aguirre.jpg"
                          alt="Lorenz  Aguirre"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold">Lorenz  Aguirre</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Software Developer</p>
                    </div>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                    Develops and implements functional code solutions that form the backbone of Alima's platform.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </a>
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="#" className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 7. FAQ */}
        <div id="faq" className="py-24 bg-neutral-50/95 dark:bg-neutral-950/95 relative scroll-mt-40">
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-5xl lg:max-w-6xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl mb-8 text-center" data-aos="fade-up">Frequently Asked Questions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800" data-aos="fade-up" data-aos-delay="100">
                  <h3 className="text-lg font-semibold mb-3">How do I find the right service provider?</h3>
                  <p className="text-muted-foreground">Our platform offers detailed profiles, reviews, and portfolios so you can evaluate service providers. You can also filter by location, price range, and category to find the perfect match.</p>
                </div>
                
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800" data-aos="fade-up" data-aos-delay="150">
                  <h3 className="text-lg font-semibold mb-3">How much does it cost to join Alima?</h3>
                  <p className="text-muted-foreground">Creating an account on Alima is completely free. Service providers pay a small commission on completed jobs, while clients can browse, contact, and hire providers at no cost.</p>
                </div>
                
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800" data-aos="fade-up" data-aos-delay="200">
                  <h3 className="text-lg font-semibold mb-3">How are payments handled?</h3>
                  <p className="text-muted-foreground">We provide a secure payment system that protects both clients and service providers. Funds are held in escrow until the work is completed and approved, ensuring satisfaction for all parties.</p>
                </div>
                
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800" data-aos="fade-up" data-aos-delay="250">
                  <h3 className="text-lg font-semibold mb-3">What if I'm not satisfied with the service?</h3>
                  <p className="text-muted-foreground">Our satisfaction guarantee ensures you only pay for work that meets your requirements. If issues arise, our dispute resolution team will help mediate and find a fair solution.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 8. CALL TO ACTION with Contact Section */}
        <div id="contact" className="relative py-36 overflow-hidden bg-white/95 dark:bg-black/95 scroll-mt-40">
          <div className="container mx-auto px-4 relative z-10">
            {/* Get In Touch Section with Apple-inspired aesthetics */}
            <div className="rounded-[32px] text-center mb-40 relative overflow-hidden shadow-2xl" 
                style={{ 
                  backgroundImage: "url('/Get in touch.svg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }} 
                data-aos="fade-up" 
                data-aos-delay="100">
              <div className="backdrop-blur-[2px] bg-black/10">
                <div className="relative z-10 py-24 px-12 md:py-32 md:px-20">
                  <h2 className="mb-8 text-4xl font-semibold tracking-tight md:text-5xl text-white leading-tight">
                    Get In Touch
                  </h2>
                  <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-white/90 font-light">
                    Have questions about Alima or interested in joining our team? We'd love to hear from you!
                  </p>
                  <div className="flex flex-wrap justify-center gap-6">
                    <button className="inline-flex items-center justify-center rounded-full border-0 bg-white px-10 py-5 text-base font-medium text-primary shadow-lg hover:bg-white/95 focus:outline-none transition duration-200 ease-in-out transform hover:-translate-y-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      Contact Us
                    </button>
                    <button className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm px-10 py-5 text-base font-medium text-white hover:bg-white/20 focus:outline-none transition duration-200 ease-in-out transform hover:-translate-y-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Follow Us
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ready to Get Started Section with glass morphism */}
            <div className="max-w-5xl mx-auto p-[1px] rounded-[32px] shadow-xl bg-gradient-to-b from-white/30 to-white/10 dark:from-white/10 dark:to-white/5 backdrop-blur-xl" 
                 data-aos="fade-up" 
                 data-aos-delay="200">
              {/* Cursor follower */}
              <div className="opacity-0 group-hover:opacity-100 absolute -inset-2 blur-xl bg-gradient-to-r from-blue-500 to-green-400 rounded-full w-32 h-32 transition-all duration-500 cursor-none pointer-events-none" 
                   id="cursor-follower"></div>
              <div className="rounded-[28px] backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 py-16 px-8 md:py-20 md:px-12 text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary dark:to-blue-400">Ready to Get Started?</h2>
                <p className="text-xl leading-relaxed text-neutral-800 dark:text-white/90 mb-12 max-w-2xl mx-auto font-light">
                  Join Alima today and connect with skilled professionals or find new clients for your services.
                </p>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 px-10 py-5 text-lg font-medium text-white shadow-lg hover:shadow-xl transition duration-200 ease-in-out transform hover:-translate-y-1 hover:from-primary hover:to-primary/90">
                    Sign up now
                  </Link>
                  <Link href="/popular-today" className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-10 py-5 text-lg font-medium text-neutral-900 dark:text-white shadow-sm hover:shadow-md hover:bg-white/20 dark:hover:bg-white/10 transition duration-200 ease-in-out transform hover:-translate-y-1">
                    Browse services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
