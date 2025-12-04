"use client"

import type React from "react"
import { useState } from "react"
import { api } from "@/lib/api"
import { FollowListModal } from "./follow-list-modal"

interface ProfileCardProps {
  profile: any
  isOwnProfile?: boolean
  onUpdate?: () => void
}

export function ProfileCard({ profile, isOwnProfile = false, onUpdate }: ProfileCardProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: profile?.user?.username || "",
    bio: profile?.user?.bio || "",
    isPublic: profile?.user?.is_public !== false,
  })
  const [saving, setSaving] = useState(false)

  const [isFollowing, setIsFollowing] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null)

  // // 🟦 Charger si on suit déjà l'utilisateur
  // useEffect(() => {
  //   if (isOwnProfile) return

  //   const checkFollow = async () => {
  //     try {
  //       const res = await api.get(`/followers/is-following/${profile.user.id}`)
  //       setIsFollowing(res.data.isFollowing)
  //     } catch (error) {
  //       console.error("Error checking follow:", error)
  //     }
  //   }

  //   checkFollow()
  // }, [profile.user.id, isOwnProfile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put("/users/profile/update", formData)
      setEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleFollow = async () => {
    setLoadingFollow(true)
    try {
      await api.post(`/followers/follow/${profile.user.id}`, {})
      setIsFollowing(true)
    } catch (error) {
      console.error("Error following user:", error)
    } finally {
      setLoadingFollow(false)
    }
  }

  const handleUnfollow = async () => {
    setLoadingFollow(true)
    try {
      await api.delete(`/followers/unfollow/${profile.user.id}`)
      setIsFollowing(false)
    } catch (error) {
      console.error("Error unfollowing user:", error)
    } finally {
      setLoadingFollow(false)
    }
  }

  if (!profile?.user) {
    return <div className="text-center text-text-secondary">Profil non trouvé</div>
  }

  return (
    <>
      <div className="bg-surface rounded-xl p-6 mb-8 border border-border">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {profile.user.profile_picture ? (
              <img
                src={profile.user.profile_picture}
                alt={profile.user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-background"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold border-4 border-background">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info & Stats */}
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{profile.user.username}</h1>
                {!editing && (
                  <>
                    <p className="text-text-secondary text-sm mb-2">{profile.user.bio || "Pas de bio disponible."}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-text-tertiary">
                      <span>{formData.isPublic ? "🌍 Public" : "🔒 Privé"}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center md:justify-end">
                {isOwnProfile && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-secondary/10 hover:bg-secondary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg font-medium transition text-sm"
                  >
                    Modifier
                  </button>
                )}

                {!isOwnProfile && (
                  <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    disabled={loadingFollow}
                    className={`px-6 py-2 rounded-lg font-semibold transition text-sm ${isFollowing
                      ? "bg-surface border border-primary text-primary hover:bg-surface/80"
                      : "bg-primary text-white hover:bg-primary/90"
                      }`}
                  >
                    {loadingFollow ? "..." : isFollowing ? "Abonné" : "S'abonner"}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {!editing && (
              <div className="flex items-center justify-center md:justify-start gap-8 border-t border-border pt-4 mt-2">
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">{profile.stats?.total || 0}</span>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Vinyles</span>
                </div>
                <button
                  onClick={() => setModalType("followers")}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <span className="block text-xl font-bold text-white">{profile.followersCount || 0}</span>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Abonnés</span>
                </button>
                <button
                  onClick={() => setModalType("following")}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <span className="block text-xl font-bold text-white">{profile.followingCount || 0}</span>
                  <span className="text-xs text-text-secondary uppercase tracking-wider">Abonnements</span>
                </button>
              </div>
            )}

            {/* Edit Form */}
            {isOwnProfile && editing && (
              <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border mt-2">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Nom d'utilisateur</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-black border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={2}
                      className="w-full bg-black border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleChange}
                      className="rounded border-border bg-black text-primary focus:ring-primary"
                    />
                    Rendre le profil public
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded text-sm transition"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 bg-surface hover:bg-surface/80 text-text-primary font-medium py-2 rounded text-sm transition border border-border"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {profile?.user?.id && (
        <FollowListModal
          userId={profile.user.id}
          type={modalType || "followers"}
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  )
}
