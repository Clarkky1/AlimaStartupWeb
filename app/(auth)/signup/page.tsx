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
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [gender, setGender] = useState("male")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [street, setStreet] = useState("")
  const [postalCode, setPostalCode] = useState("")

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
        phone: "+63" + phone,
        address,
        role: "user", // Always set as user
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayName: name,
        profilePicture: profilePictureUrl,
        lastUpdated: new Date().toISOString(),
        gender,
        state,
        city,
        street,
        postalCode
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) { // Philippine mobile numbers are 10 digits after +63
      setPhone(value);
    }
  };

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
              <form onSubmit={handleSignup} className="max-h-[calc(100vh-200px)] overflow-y-auto max-w-xl mx-auto px-4">
                {/* Profile Picture Section */}
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 group">
                    {previewUrl ? (
                      <>
                        <Image
                          src={previewUrl}
                          alt="Profile preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={handleRemoveProfilePicture}
                            className="text-white hover:text-gray-200 transition-colors"
                            title="Remove profile picture"
                            aria-label="Remove profile picture"
                          >
                            <X className="h-8 w-8" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="mt-1">
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="profilePicture"
                      className="cursor-pointer text-sm text-white/80 hover:text-white"
                    >
                      {previewUrl ? "Change photo" : "Add photo"}
                    </Label>
                  </div>
                </div>

                {/* Form Fields - Two Column Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter your full name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-white">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white focus:outline-none focus:ring-0 focus:border-transparent">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirm your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone Number</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">+63</span>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={handlePhoneChange}
                          required
                          placeholder="Enter 10-digit mobile number"
                          className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-white">State</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                        placeholder="Enter your state"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        placeholder="Enter your city"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>

                    {/* Street */}
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-white">Street</Label>
                      <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required
                        placeholder="Enter your street"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>

                    {/* Postal Code */}
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-white">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        placeholder="Enter your postal code"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="mt-4 text-center">
                  <p className="text-sm text-white/70">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
