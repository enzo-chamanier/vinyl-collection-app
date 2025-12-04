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
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const profileData = await api.get(`/users/${user.username}`)

      // Fetch stats
      if (profileData && profileData.user) {
        try {
          const countRes = await api.get(`/followers/count/${profileData.user.id}`)
          profileData.followersCount = countRes.followers
          profileData.followingCount = countRes.following
        } catch (e) {
          console.warn("Could not fetch stats", e)
        }
      }

      setProfile(profileData)
    } catch (error) {
      console.error("Error loading profile:", error)
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
