"use client"

import { useEffect } from "react"
import MessagePage from "@/app/message/[providerId]/page"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default function DashboardChatPage({ params }: { params: { providerId: string } }) {
  return (
    <DashboardLayout>
      <div className="fixed-layout p-0 m-0 mt-[-16px] overflow-hidden">
        <MessagePage params={params} />
      </div>
    </DashboardLayout>
  )
} 