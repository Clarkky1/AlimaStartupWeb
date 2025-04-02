"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProfileSettings } from "@/components/dashboard/profile-settings"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "provider")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user || user.role !== "provider") {
    return null
  }

  return (
    <DashboardLayout>
      <ProfileSettings />
    </DashboardLayout>
  )
}