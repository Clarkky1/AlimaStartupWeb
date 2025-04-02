"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

      if (role === "provider") {
        router.push("/dashboard")
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
      className="flex min-h-screen items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/Signup.svg')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Centered Sign-Up Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
        <div className="p-6 bg-transparent backdrop-blur-md shadow-lg rounded-lg w-full">
          <div className="mb-6 flex items-center justify-center">
            <img src="/AlimaLOGO.svg" alt="Logo" className="h-10 w-10" />
            <h1 className="ml-2 text-xl font-bold text-white">Alima</h1>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="p-0 pb-4 text-center">
              <CardTitle className="text-2xl text-white">Sign Up</CardTitle>
              <CardDescription className="text-gray-300">Create an account to get started</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Updated Tabs */}
              <Tabs defaultValue="user" className="mb-4" onValueChange={setRole}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-800 p-1 rounded-lg">
                  <TabsTrigger value="user" className="text-white bg-transparent data-[state=active]:bg-white data-[state=active]:text-black rounded-md">
                    User
                  </TabsTrigger>
                  <TabsTrigger value="provider" className="text-white bg-transparent data-[state=active]:bg-white data-[state=active]:text-black rounded-md">
                    Service Provider
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSignup}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Kin Clark Perez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-gray-800 text-white border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-gray-800 text-white border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-800 text-white border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-gray-800 text-white border-gray-600"
                    />
                  </div>

                  {/* Blue Button with White Text */}
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center p-0 pt-4">
              <p className="text-sm text-gray-300">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:underline">
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
