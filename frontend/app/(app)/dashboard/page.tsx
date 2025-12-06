"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { VinylCollection } from "@/components/vinyl/vinyl-collection"
import { CollectionStats } from "@/components/stats/collection-stats"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"


interface CollectionStatsType {
  total: number
  genres: { name: string; count: number }[]
  topArtists: { name: string; count: number }[]
  totalArtists: number
}

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  cover_image?: string
  rating?: number
  vinyl_color?: string
  disc_count?: number
  format?: "vinyl" | "cd"
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<CollectionStatsType | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const fetchVinyls = useCallback(async (offset: number, limit: number) => {
    const result = await api.get(`/vinyls/my-collection?limit=${limit}&offset=${offset}`)
    return result
  }, [])

  const {
    data: vinyls,
    loading,
    loadingMore,
    hasMore,
    total,
    loadMore,
    refresh,
  } = useInfiniteScroll<Vinyl>({
    fetchFn: fetchVinyls,
    limit: 10,
    initialLoad: false,
  })

  // Fetch stats separately (calculates on all vinyls)
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await api.get("/vinyls/stats")
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return false
      }
      return true
    }

    if (checkAuth()) {
      setAuthChecked(true)
      refresh()
      fetchStats()
    }
  }, [router, refresh, fetchStats])

  if (!authChecked || loading) {
    return <FullScreenLoader message="Chargement de votre collection..." />
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {stats && <CollectionStats stats={stats} />}
        <VinylCollection
          vinyls={vinyls}
          loading={loading}
          onUpdate={() => { refresh(); fetchStats(); }}
          totalCount={total}
          onLoadMore={loadMore}
          loadingMore={loadingMore}
          hasMore={hasMore}
        />
      </div>
    </AppLayout>
  )
}
