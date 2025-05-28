"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import Image from "next/image"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const { setUser } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { auth, db } = await initializeFirebase()

      if (!auth || !db) {
        toast({
          title: "Firebase not initialized",
          description: "Please try again in a moment",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      const { doc, setDoc } = await import("firebase/firestore")

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Upload profile picture if provided
      let profilePictureUrl = null
      if (profilePicture) {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
        const storage = getStorage()
        const storageRef = ref(storage, `profile_pictures/${userCredential.user.uid}`)
        await uploadBytes(storageRef, profilePicture)
        profilePictureUrl = await getDownloadURL(storageRef)
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        phone,
        address,
        role: "user", // Always set as user
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayName: name,
        profilePicture: profilePictureUrl,
        lastUpdated: new Date().toISOString()
      })

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Account created successfully",
        description: "Welcome to our platform!",
      })

      if (returnUrl) {
        router.push(returnUrl)
      } else {
        router.push("/")
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfilePicture(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add a handler to remove the profile picture
  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
    // Optionally, reset the file input value
    const input = document.getElementById('profilePicture') as HTMLInputElement | null;
    if (input) input.value = '';
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-cover bg-center relative px-4 sm:px-6"
      style={{ backgroundImage: "url('/Signup.svg')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="flex items-center text-white bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span className="ml-1">Back</span>
        </Button>
      </div>

      {/* Centered Sign-Up Card */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center justify-center">
        <div className="p-4 sm:p-6 bg-transparent backdrop-blur-md shadow-lg rounded-lg w-full">
          <div className="mb-4 sm:mb-6 flex items-center justify-center">
            <img src="/AlimaLOGO.svg" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
            <h1 className="ml-2 text-lg sm:text-xl font-bold text-white">Alima</h1>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="p-0 pb-3 sm:pb-4 text-center">
              <CardTitle className="text-xl sm:text-2xl text-white">Sign Up</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-300">Create an account to get started</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSignup}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-sm sm:text-base text-white">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="phone" className="text-sm sm:text-base text-white">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="address" className="text-sm sm:text-base text-white">Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, City, Country"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-sm sm:text-base text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="password" className="text-sm sm:text-base text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm sm:text-base text-white">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Picture Section - full width row */}
                <div className="mt-4 flex flex-col items-center justify-center w-full">
                  <Label htmlFor="profilePicture" className="text-sm sm:text-base text-white mb-2">Profile Picture (Optional)</Label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="bg-white text-gray-900 border-gray-300 h-10 sm:h-11 w-full sm:w-auto"
                    />
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 mt-4 sm:mt-0">
                      {previewUrl ? (
                        <>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={handleRemoveProfilePicture}
                            className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-700 rounded-full p-1 shadow-md focus:outline-none"
                            aria-label="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></svg>
                          </button>
                          <Image
                            src={previewUrl}
                            alt="Profile preview"
                            fill
                            className="object-cover"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center p-0 pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm text-gray-300">
                Already have an account?{" "}
                <Link 
                  href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"} 
                  className="text-blue-400 hover:underline"
                >
                  Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
