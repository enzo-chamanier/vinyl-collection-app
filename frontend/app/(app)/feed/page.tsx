"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { TikTokFeed } from "@/components/feed/tiktok-feed"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function FeedPage() {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    try {
      const data = await api.get("/followers/feed/recent")
      setFeed(data)
    } catch (error) {
      console.error("Erreur lors du chargement du fil d'actualité:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <FullScreenLoader message="Chargement du fil d'actualité..." />
  }

  return (
    <AppLayout>
      <TikTokFeed items={feed} />
    </AppLayout>
  )
}
