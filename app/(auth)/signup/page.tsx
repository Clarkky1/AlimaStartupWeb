"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("user")
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

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayName: name,
        profilePicture: null,
        bio: "",
        phone: "",
        location: "",
        lastUpdated: new Date().toISOString()
      })

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Account created successfully",
        description: "Welcome to our platform!",
      })

      // Navigate based on returnUrl or default to homepage
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
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
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
              {/* Updated Tabs */}
              <Tabs defaultValue="user" className="mb-3 sm:mb-4" onValueChange={setRole}>
                <TabsList className="grid w-full grid-cols-2 bg-white-800 p-1 rounded-lg">
                  <TabsTrigger 
                    value="user" 
                    className="text-sm sm:text-base text-green bg-transparent data-[state=active]:bg-white data-[state=active]:text-black rounded-md py-1"
                  >
                    User
                  </TabsTrigger>
                  <TabsTrigger 
                    value="provider" 
                    className="text-sm sm:text-base text-green bg-transparent data-[state=active]:bg-white data-[state=active]:text-black rounded-md py-1"
                  >
                    Service Provider
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSignup}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base text-white">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Kin Clark Perez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white-800 text-gray border-gray-600 h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white-800 text-gray border-gray-600 h-10 sm:h-11"
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
                      className="bg-white-800 text-gray border-gray-600 h-10 sm:h-11"
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
                      className="bg-white-800 text-gray border-gray-600 h-10 sm:h-11"
                    />
                  </div>

                  {/* Blue Button with White Text */}
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
