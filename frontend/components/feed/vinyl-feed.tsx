import { FullScreenLoader } from "@/components/ui/full-screen-loader"
import { FeedItem } from "./feed-item"
import { useEffect, useState } from "react"

interface FeedItemData {
  id: string
  title: string
  artist: string
  username: string
  profile_picture?: string
  cover_image?: string
  date_added: string
  vinyl_color?: string
  disc_count?: number
  likes_count?: number
  comments_count?: number
  has_liked?: boolean
}

interface VinylFeedProps {
  items?: FeedItemData[] | null
  loading: boolean
}

export function VinylFeed({ items, loading }: VinylFeedProps) {
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Get current user ID from local storage or context if available
    // For now, we can try to parse it from the stored user object
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUserId(user.id)
      }
    } catch (e) {
      console.error("Error parsing user from local storage", e)
    }
  }, [])

  const feedItems = Array.isArray(items) ? items : []

  if (loading) {
    return <FullScreenLoader message="Chargement du fil d'actualité..." />
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Aucun élément dans le fil d'actualité</h3>
        <p className="text-muted-foreground">Suivez des utilisateurs pour voir leurs collections</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedItems.map((item) => (
        <FeedItem key={item.id} item={item} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
