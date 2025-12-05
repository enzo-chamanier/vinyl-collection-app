"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CollectionAnalytics } from "@/components/analytics/collection-analytics"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await api.get("/analytics/personal")
      setAnalytics(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <FullScreenLoader message="Chargement des statistiques..." />
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Collection Analytics</h1>
        <CollectionAnalytics analytics={analytics} loading={loading} />
      </div>
    </AppLayout>
  )
}
