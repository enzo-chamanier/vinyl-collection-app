"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

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
    <div className="bg-surface rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        
        {/* ---- Informations du profil ---- */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{profile.user.username}</h1>
          <p className="text-text-secondary mb-2">{profile.user.bio || "Pas de bio disponible."}</p>
          <p className="text-text-tertiary text-sm">
            {formData.isPublic ? "🌍 Profil public" : "🔒 Profil privé"}
          </p>
        </div>

        {/* ---- Bouton S'abonner / Abonné ---- */}
        {!isOwnProfile && (
          <button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            disabled={loadingFollow}
            className={`
              px-4 py-2 rounded font-semibold transition border 
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isFollowing
                  ? "bg-surface border-primary text-primary hover:bg-surface/80"
                  : "bg-primary text-white border-primary hover:bg-primary/90"
              }
            `}
          >
            {loadingFollow ? "Chargement..." : isFollowing ? "Abonné" : "S'abonner"}
          </button>
        )}
      </div>

      {/* ---- Stats ---- */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-background rounded p-3 text-center">
          <p className="text-2xl font-bold text-primary">{profile.stats?.total || 0}</p>
          <p className="text-text-secondary text-sm">Vinyles</p>
        </div>

        {/* Tu mettras ici plus tard les vrais stats followers/following */}
        <div className="bg-background rounded p-3 text-center">
          <p className="text-2xl text-primary font-bold text-accent">0</p>
          <p className="text-text-secondary text-sm">Abonnés</p>
        </div>
        <div className="bg-background rounded p-3 text-center">
          <p className="text-2xl text-primary font-bold">0</p>
          <p className="text-text-secondary text-sm">Abonnements</p>
        </div>
      </div>

      {/* ---- Mode édition ---- */}
      {isOwnProfile && editing && (
        <div className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Nom d'utilisateur"
            value={formData.username}
            onChange={handleChange}
            className="w-full"
          />

          <textarea
            name="bio"
            placeholder="Votre bio..."
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className="w-full rounded border border-border bg-background text-text-primary p-3"
          />

          <label className="flex items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="w-4 h-4"
            />
            Rendre le profil public
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gray-200 hover:bg-gray-300/90 text-black font-semibold py-2 rounded transition disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 rounded transition border border-border"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ---- Bouton pour activer l'édition ---- */}
      {isOwnProfile && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="w-full bg-secondary hover:bg-secondary/80 text-primary font-semibold py-2 rounded transition"
        >
          Modifier le Profil
        </button>
      )}
    </div>
  )
}
