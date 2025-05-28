"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { initializeFirebase } from "@/app/lib/firebase"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const { setUser } = useAuth()

  // Function to generate a unique device ID or retrieve existing one
  const getDeviceId = () => {
    if (typeof window === 'undefined') return null;
    
    let deviceId = localStorage.getItem('alima_device_id');
    if (!deviceId) {
      // Generate a unique device ID using timestamp + random string
      deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('alima_device_id', deviceId);
    }
    return deviceId;
  };
  
  // Initialize rememberMe from localStorage when component mounts
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const deviceId = getDeviceId();
      const storedRememberMe = localStorage.getItem(`rememberMe_${deviceId}`);
      if (storedRememberMe !== null) {
        setRememberMe(storedRememberMe === 'true');
      }
      
      // Attempt to retrieve saved email if rememberMe was true
      if (storedRememberMe === 'true') {
        const savedEmail = localStorage.getItem(`userEmail_${deviceId}`);
        if (savedEmail) {
          setEmail(savedEmail);
        }
      }
    }
  }, []);
  
  // Update localStorage when rememberMe changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const deviceId = getDeviceId();
      localStorage.setItem(`rememberMe_${deviceId}`, rememberMe.toString());
    }
  }, [rememberMe]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } = await import("firebase/auth")
      const { doc, getDoc } = await import("firebase/firestore")

      // Set the appropriate persistence based on user choice
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const userData = userDoc.data()

      // Save email to device-specific localStorage entry if rememberMe is checked
      if (rememberMe) {
        const deviceId = getDeviceId();
        localStorage.setItem(`userEmail_${deviceId}`, email);
        
        // Track this device in user's Firestore document for security (optional)
        try {
          const { updateDoc, arrayUnion, Timestamp } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", userCredential.user.uid), {
            rememberedDevices: arrayUnion({
              deviceId: deviceId,
              lastLogin: Timestamp.now(),
              deviceInfo: `${window.navigator.userAgent}`
            })
          });
        } catch (error) {
          console.log("Non-critical error saving device info:", error);
        }
      } else {
        // Clear remembered data if user unchecks remember me
        const deviceId = getDeviceId();
        localStorage.removeItem(`userEmail_${deviceId}`);
      }

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData?.role || "user",
        ...userData,
      })

      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      // Redirect based on returnUrl or user role
      if (returnUrl) {
        router.push(returnUrl)
      } else if (userData?.role === "provider") {
        router.push("/dashboard")
      } else {
        router.push("/")
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Reset any previous error message
      setErrorMsg(null);
      
      // Show more specific error messages based on Firebase error codes
      let errorMessage = "An error occurred during login. Please try again.";
      
      // Handle specific error codes with improved detection
      const errorCode = error.code || '';
      console.log("Firebase error code:", errorCode);
      
      if (errorCode.includes('user-not-found')) {
        errorMessage = "Account does not exist. Please create an account first.";
      } else if (
        errorCode.includes('wrong-password') || 
        errorCode.includes('invalid-credential') || 
        errorCode.includes('invalid-login-credentials')
      ) {
        errorMessage = "Email or password is incorrect. Please try again.";
      } else if (errorCode.includes('invalid-email')) {
        errorMessage = "Invalid email format. Please check your email.";
      } else if (errorCode.includes('too-many-requests')) {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (errorCode.includes('user-disabled')) {
        errorMessage = "This account has been disabled. Please contact support.";
      } else {
        // For any other error, include the original error message for debugging
        errorMessage = `Login failed: ${error.message || "Unknown error"}`;
      }
      
      // Set the error message state for direct display in UI
      setErrorMsg(errorMessage);
      
      // Add a delay to ensure toast is visible
      setTimeout(() => {
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000, // Show toast for 5 seconds
        });
      }, 100);
      
      console.log("Showing toast with message:", errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)

    try {
      const { auth } = await initializeFirebase()

      if (!auth) {
        toast({
          title: "Firebase not initialized",
          description: "Please try again in a moment",
          variant: "destructive",
        })
        setResetLoading(false)
        return
      }

      const { sendPasswordResetEmail } = await import("firebase/auth")
      await sendPasswordResetEmail(auth, forgotPasswordEmail)

      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
      })

      // Return to login form
      setShowForgotPassword(false)
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setResetLoading(false)
    }
  }

  // Clear remembered device
  const clearSavedCredentials = () => {
    if (typeof window !== 'undefined') {
      const deviceId = getDeviceId();
      localStorage.removeItem(`userEmail_${deviceId}`);
      localStorage.removeItem(`rememberMe_${deviceId}`);
      setRememberMe(false);
      toast({
        title: "Cleared saved login",
        description: "Your login information has been removed from this device",
      });
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center relative px-4 py-6"
      style={{ backgroundImage: "url('/Login.svg')" }}
    >
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="flex items-center text-white bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 min-w-24"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span className="ml-2">Back</span>
        </Button>
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
        <div className="p-4 sm:p-6 bg-transparent backdrop-blur-md shadow-lg rounded-lg w-full">
          <div className="mb-4 sm:mb-6 flex items-center justify-center">
            <img src="/AlimaLOGO.svg" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
            <h1 className="ml-2 text-lg sm:text-xl font-bold text-white">Alima</h1>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            {!showForgotPassword ? (
              <>
                <CardHeader className="p-0 pb-3 sm:pb-4 text-center">
                  <CardTitle className="text-xl sm:text-2xl text-white">Login</CardTitle>
                  <CardDescription className="text-sm text-gray-300">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <form onSubmit={handleLogin}>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="email" className="text-white text-sm">
                          Email
                        </Label>
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
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-white text-sm">
                            Password
                          </Label>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Enter your password"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                        />
                        
                        {/* Move the Forgot password and Remember me on the same line */}
                        <div className="flex items-center justify-between mt-1">
                          {/* Remember me on the left */}
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="remember" 
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked === true)}
                              />
                              <label
                                htmlFor="remember"
                                className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Remember me on this device
                              </label>
                            </div>
                            {rememberMe && (
                              <p className="text-xs text-gray-300 mt-1 ml-6">Your login will be remembered only on this device</p>
                            )}
                          </div>
                          
                          {/* Forgot password on the right */}
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-gray-300 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      {/* Error message display */}
                      {errorMsg && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-600">
                          {errorMsg}
                        </div>
                      )}

                      {/* Blue Button with White Text */}
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center p-0 pt-3 sm:pt-4">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Don't have an account?{" "}
                    <Link 
                      href={returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : "/signup"} 
                      className="text-blue-400 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="p-0 pb-3 sm:pb-4 text-center">
                  <CardTitle className="text-xl sm:text-2xl text-white">Reset Password</CardTitle>
                  <CardDescription className="text-sm text-gray-300">
                    Enter your email and we'll send you a link to reset your password
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <form onSubmit={handleForgotPassword}>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="forgotPasswordEmail" className="text-white text-sm">
                          Email
                        </Label>
                        <Input
                          id="forgotPasswordEmail"
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                          placeholder="Enter your email to reset password"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        disabled={resetLoading}
                      >
                        {resetLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center p-0 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-xs sm:text-sm text-blue-400 hover:underline"
                  >
                    Back to login
                  </button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
