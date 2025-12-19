"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { VinylCollection } from "@/components/vinyl/vinyl-collection"
import { CollectionStats } from "@/components/stats/collection-stats"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { TopLoader } from "@/components/ui/top-loader"


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
  date_added?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<CollectionStatsType | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const isOnline = useNetworkStatus()

  // Background Sync Effect
  useEffect(() => {
    async function syncCollection() {
      if (!isOnline) return
      try {
        setIsSyncing(true)
        // Fetch all vinyls for offline cache (limit 1000 for MVP)
        const result = await api.get("/vinyls/my-collection?limit=1000&offset=0")
        if (result.data) {
          const { saveVinyls } = await import("@/lib/db")
          await saveVinyls(result.data)
          console.log("Collection synced to offline storage")
        }
      } catch (err) {
        console.error("Background sync failed", err)
      } finally {
        setIsSyncing(false)
      }
    }

    // Sync on mount if online, or when coming back online
    if (isOnline && authChecked) {
      syncCollection()
    }
  }, [isOnline, authChecked])

  const fetchVinyls = useCallback(async (offset: number, limit: number) => {
    // Helper for timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 3000)
    )

    // If offline (or we think we are), read from IndexedDB
    if (!isOnline) {
      const { getVinyls } = await import("@/lib/db")
      const allVinyls = await getVinyls()

      // Sort by date added desc to match backend
      allVinyls.sort((a, b) => {
        const dateA = new Date(a.date_added || 0).getTime()
        const dateB = new Date(b.date_added || 0).getTime()
        return dateB - dateA
      })

      // For now just return as is (offset/limit)
      const sliced = allVinyls.slice(offset, offset + limit)
      return {
        data: sliced,
        total: allVinyls.length,
        hasMore: offset + limit < allVinyls.length
      }
    }

    // Online: Use API with timeout
    try {
      // Race between API call and timeout
      const result = await Promise.race([
        api.get(`/vinyls/my-collection?limit=${limit}&offset=${offset}`),
        timeoutPromise
      ]) as any // Type assertion for the race result

      return result
    } catch (error) {
      // Fallback to DB if API call fails but we thought we were online
      console.warn("API failed or timed out, falling back to offline DB", error)
      const { getVinyls } = await import("@/lib/db")
      const allVinyls = await getVinyls()

      // Sort by date added desc to match backend
      allVinyls.sort((a, b) => {
        const dateA = new Date(a.date_added || 0).getTime()
        const dateB = new Date(b.date_added || 0).getTime()
        return dateB - dateA
      })

      const sliced = allVinyls.slice(offset, offset + limit)
      return {
        data: sliced,
        total: allVinyls.length,
        hasMore: offset + limit < allVinyls.length
      }
    }
  }, [isOnline])

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
        <TopLoader visible={isSyncing} message="Mise à jour de la collection..." />
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
