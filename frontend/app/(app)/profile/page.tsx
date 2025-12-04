"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ProfileCard } from "@/components/profile/profile-card"
import { api } from "@/lib/api"
import { VinylCard } from "@/components/vinyl/vinyl-card"

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

  const [searchQuery, setSearchQuery] = useState("")
  const [groupByArtist, setGroupByArtist] = useState(false)

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
    return (
      <AppLayout>
        <div className="text-center text-text-secondary">Loading profile...</div>
      </AppLayout>
    )
  }

  // ... (existing useEffect and loadProfile)

  const filteredVinyls = profile?.vinyls?.filter((vinyl: any) => {
    const query = searchQuery.toLowerCase()
    return (
      vinyl.title.toLowerCase().includes(query) ||
      vinyl.artist.toLowerCase().includes(query) ||
      vinyl.genre.toLowerCase().includes(query)
    )
  }) || []

  const vinylsByArtist = filteredVinyls.reduce((acc: any, vinyl: any) => {
    const artist = vinyl.artist || "Inconnu"
    if (!acc[artist]) acc[artist] = []
    acc[artist].push(vinyl)
    return acc
  }, {})

  // ... (existing loading check)

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 z-40 bg-background py-4">
              <h2 className="text-2xl text-primary font-bold">Vos Vinyles</h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Rechercher un vinyle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none w-full sm:w-64"
                />

                <button
                  onClick={() => setGroupByArtist(!groupByArtist)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${groupByArtist
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-secondary border-border hover:border-primary"
                    }`}
                >
                  {groupByArtist ? "Vue par Artiste" : "Vue Grille"}
                </button>
              </div>
            </div>

            {groupByArtist ? (
              <div className="space-y-8">
                {Object.entries(vinylsByArtist).map(([artist, vinyls]: [string, any]) => (
                  <div key={artist} className="bg-black rounded-xl p-6 border border-border/50">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-border pb-2">{artist}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {vinyls.map((vinyl: any) => (
                        <VinylCard
                          key={vinyl.id}
                          vinyl={vinyl}
                          onUpdate={() => {
                            loadProfile()
                            setEditing(false)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredVinyls.map((vinyl: any) => (
                  <VinylCard
                    key={vinyl.id}
                    vinyl={vinyl}
                    onUpdate={() => {
                      loadProfile()
                      setEditing(false)
                    }}
                  />
                ))}
              </div>
            )}

            {filteredVinyls.length === 0 && (
              <div className="text-center py-12 text-text-secondary">
                Aucun vinyle trouvé pour cette recherche.
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
