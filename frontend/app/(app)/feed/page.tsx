"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { VinylFeed } from "@/components/feed/vinyl-feed"
import { api } from "@/lib/api"

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
      console.error("Erreur lors du chargement du fil d'actualité   :", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black">Votre Fil d'actualité</h1>
        <VinylFeed items={feed} loading={loading} />
      </div>
    </AppLayout>
  )
}
