// app/dashboard/page.tsx
"use client";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { useAuth } from "../../context/auth-context";

export default function DashboardPage() {
  const { user, loading } = useAuth(); // Now has access to context

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the dashboard</div>;
  }

  return <DashboardOverview />;
}