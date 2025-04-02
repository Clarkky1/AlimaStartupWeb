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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [isProvider, setIsProvider] = useState(false)
  const [city, setCity] = useState("")
  const [cities, setCities] = useState([
    { value: "New York", label: "New York" },
    { value: "Los Angeles", label: "Los Angeles" },
    { value: "Chicago", label: "Chicago" },
    { value: "Houston", label: "Houston" },
    { value: "Miami", label: "Miami" },
  ])

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
        city,
      })

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name,
        role,
        city,
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
      className="flex min-h-screen items-center justify-center bg-cover bg-center relative px-4 py-6"
      style={{ backgroundImage: "url('/Login.svg')" }}
    >
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Centered Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
        <div className="p-4 sm:p-6 bg-transparent backdrop-blur-md shadow-lg rounded-lg w-full">
          <div className="mb-4 sm:mb-6 flex items-center justify-center">
            <img src="/AlimaLOGO.svg" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
            <h1 className="ml-2 text-lg sm:text-xl font-bold text-white">Alima</h1>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="p-0 pb-3 sm:pb-4 text-center">
              <CardTitle className="text-xl sm:text-2xl text-white">Create Account</CardTitle>
              <CardDescription className="text-sm text-gray-300">
                Fill in the details below to create your account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSignup}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="displayName" className="text-white text-sm">
                      Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={name}
                      placeholder="John Doe"
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-9 sm:h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email" className="text-white text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      placeholder="name@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-9 sm:h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="password" className="text-white text-sm">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      placeholder="••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-9 sm:h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white text-sm">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      placeholder="••••••••"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-9 sm:h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>

                  {/* Provider Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="provider"
                      checked={role === "provider"}
                      onCheckedChange={(checked) => {
                        setRole(checked ? "provider" : "user")
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label
                      htmlFor="provider"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                    >
                      Sign up as a service provider
                    </label>
                  </div>

                  {/* City dropdown field */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="city" className="text-white text-sm">
                      City
                    </Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((cityOption) => (
                          <SelectItem key={cityOption.value} value={cityOption.value}>
                            {cityOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center p-0 pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm text-gray-300">
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
