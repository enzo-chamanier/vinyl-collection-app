"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ProfileCard } from "@/components/profile/profile-card"
import { api } from "@/lib/api"
import { VinylCollection } from "@/components/vinyl/vinyl-collection"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  cover_image?: string
  rating?: number
  vinyl_color?: string
  disc_count?: number
}

interface Profile {
  vinyls?: Vinyl[]
  [key: string]: any
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [_editing, setEditing] = useState(false)

  // Vinyl pagination state
  const [vinyls, setVinyls] = useState<Vinyl[]>([])
  const [loadingVinyls, setLoadingVinyls] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10

  useEffect(() => {
    loadProfile()
    fetchVinyls(true)
  }, [])

  const loadProfile = async () => {
    try {
      const profileData = await api.get(`/users/profile/me`)

      if (profileData && profileData.user) {
        try {
          const countRes = await api.get(`/followers/count/${profileData.user.id}`)
          profileData.followersCount = countRes.followers
          profileData.followingCount = countRes.following
        } catch (e) {
          console.warn("Could not fetch stats", e)
        }

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
        if (storedUser.username !== profileData.user.username) {
          storedUser.username = profileData.user.username
          localStorage.setItem("user", JSON.stringify(storedUser))
        }
      }

      setProfile(profileData)
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVinyls = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoadingVinyls(true)
        setOffset(0)
      } else {
        setLoadingMore(true)
      }

      const currentOffset = isInitial ? 0 : offset
      const result = await api.get(`/vinyls/my-collection?limit=${LIMIT}&offset=${currentOffset}`)

      if (isInitial) {
        setVinyls(result.data)
      } else {
        setVinyls(prev => {
          const existingIds = new Set(prev.map(v => v.id))
          const newVinyls = result.data.filter((v: Vinyl) => !existingIds.has(v.id))
          return [...prev, ...newVinyls]
        })
      }

      setHasMore(result.hasMore)
      setTotalCount(result.total)
      setOffset(currentOffset + result.data.length)
    } catch (error) {
      console.error("Failed to fetch vinyls", error)
    } finally {
      setLoadingVinyls(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchVinyls(false)
    }
  }

  if (loading) {
    return <FullScreenLoader message="Chargement du profil..." />
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <ProfileCard
          profile={profile}
          isOwnProfile
          onUpdate={() => {
            loadProfile()
            setEditing(false)
          }}
        />

        {profile && (
          <div className="mt-8">
            <VinylCollection
              vinyls={vinyls}
              loading={loadingVinyls}
              onUpdate={() => {
                loadProfile()
                fetchVinyls(true)
              }}
              title="Vos Vinyles"
              totalCount={totalCount}
              onLoadMore={loadMore}
              loadingMore={loadingMore}
              hasMore={hasMore}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
