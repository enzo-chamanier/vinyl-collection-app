"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { VinylCollection } from "@/components/vinyl/vinyl-collection"
import { CollectionStats } from "@/components/stats/collection-stats"
import { api } from "@/lib/api"


interface CollectionStatsType {
  total: number
  genres: { name: string; count: number }[]
  topArtists: { name: string; count: number }[]
  totalArtists: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [vinyls, setVinyls] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CollectionStatsType | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
    }

    checkAuth()
    loadVinyls()
  }, [])

  const loadVinyls = async () => {
    try {
      const data = await api.get("/vinyls/my-collection")
      setVinyls(data)
      calculateStats(data)
    } catch (error) {
      console.error("Error loading vinyls:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (vinyls: any[]) => {
    const genreCount: Record<string, number> = {}
    const artistCount: Record<string, number> = {}

    vinyls.forEach((vinyl) => {
      const genres = vinyl.genre ? vinyl.genre.split(",").map((g: string) => g.trim()) : ["Inconnu"]
      genres.forEach((g: string) => {
        if (g) genreCount[g] = (genreCount[g] || 0) + 1
      })

      const artistName = vinyl.artist ? vinyl.artist.replace(/\s*\([^)]*\)/g, "") : "Inconnu"
      artistCount[artistName] = (artistCount[artistName] || 0) + 1
    })

    setStats({
      total: vinyls.length,
      genres: Object.entries(genreCount).map(([name, count]) => ({ name, count })),
      topArtists: Object.entries(artistCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      totalArtists: Object.keys(artistCount).length
    })

  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {stats && <CollectionStats stats={stats} />}
        <VinylCollection vinyls={vinyls} loading={loading} onUpdate={loadVinyls} />
      </div>
    </AppLayout>
  )
}
