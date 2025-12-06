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

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // Use the new /profile/me endpoint which uses the token's user ID
      // This avoids issues with stale username in localStorage
      const profileData = await api.get(`/users/profile/me`)

      // Fetch stats (followers count is not in the main profile object yet?)
      // Actually, let's check if the backend returns it.
      // The backend returns { user, vinyls, giftedVinyls, stats }
      // But followersCount/followingCount are fetched separately in the original code.
      // Let's keep fetching them using the ID from the profileData.user

      if (profileData && profileData.user) {
        try {
          const countRes = await api.get(`/followers/count/${profileData.user.id}`)
          profileData.followersCount = countRes.followers
          profileData.followingCount = countRes.following
        } catch (e) {
          console.warn("Could not fetch stats", e)
        }

        // Also update localStorage with the fresh user data to keep it in sync
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
        if (storedUser.username !== profileData.user.username) {
          storedUser.username = profileData.user.username
          localStorage.setItem("user", JSON.stringify(storedUser))
        }
      }

      setProfile(profileData)
    } catch (error) {
      console.error("Error loading profile:", error)
      // If 401, maybe redirect to login?
      // For now just log it.
    } finally {
      setLoading(false)
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
              vinyls={profile.vinyls || []}
              loading={false}
              onUpdate={loadProfile}
              title="Vos Vinyles"
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
