"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ProfileCard } from "@/components/profile/profile-card"
import { api } from "@/lib/api"

interface Vinyl {
  id: string
  title: string
  cover_image?: string
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
      setProfile(profileData)
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center text-text-secondary">Loading profile...</div>
      </AppLayout>
    )
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
            { profile.vinyls && profile.vinyls.length > 0 && (
            <h2 className="text-2xl text-primary font-bold mb-6">Vos Vinyles</h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile.vinyls?.slice(0, 8).map((vinyl: any) => (
                <div key={vinyl.id} className="aspect-square rounded-lg overflow-hidden bg-surface">
                  {vinyl.cover_image ? (
                    <img
                      src={vinyl.cover_image || "/placeholder.svg"}
                      alt={vinyl.title}
                      className="w-full h-full object-cover"
                    />
                    
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                      <p className="text-center px-2 text-white text-xs font-semibold line-clamp-2">{vinyl.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
