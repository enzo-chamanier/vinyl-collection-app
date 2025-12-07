"use client"

import { useEffect, useState, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { TikTokFeed } from "@/components/feed/tiktok-feed"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

interface FeedItem {
  id: string
  title: string
  artist: string
  cover_image?: string
  vinyl_color?: string
  disc_count?: number
  format?: string
  disc_name?: string
  username: string
  profile_picture?: string
  date_added: string
  likes_count?: number
  comments_count?: number
  has_liked?: boolean
  user_id?: string
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const LIMIT = 10

  const loadFeed = useCallback(async (isInitial = false) => {
    try {
      const currentOffset = isInitial ? 0 : offset
      const result = await api.get(`/followers/feed/recent?limit=${LIMIT}&offset=${currentOffset}`)

      if (isInitial) {
        setFeed(result.data)
      } else {
        setFeed(prev => [...prev, ...result.data])
      }

      setHasMore(result.hasMore)
      setOffset(currentOffset + result.data.length)
    } catch (error) {
      console.error("Erreur lors du chargement du fil d'actualité:", error)
    } finally {
      setLoading(false)
    }
  }, [offset])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadFeed(false)
    }
  }, [hasMore, loading, loadFeed])

  useEffect(() => {
    loadFeed(true)
  }, [])

  if (loading && feed.length === 0) {
    return <FullScreenLoader message="Chargement du fil d'actualité..." />
  }

  return (
    <AppLayout>
      <TikTokFeed items={feed} onLoadMore={loadMore} hasMore={hasMore} />
    </AppLayout>
  )
}
