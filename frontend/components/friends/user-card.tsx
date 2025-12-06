"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"

interface UserCardProps {
  user: any
}

export function UserCard({ user }: UserCardProps) {
  const [followStatus, setFollowStatus] = useState<'accepted' | 'pending' | null>(null)
  const [isFollowedBy, setIsFollowedBy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{ followers: number; following: number } | null>(null)

  // Check if already following + get stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Vérifie si l'utilisateur est suivi
        const followRes = await api.get(`/followers/is-following/${user.id}`);
        setFollowStatus(followRes.status);
        setIsFollowedBy(followRes.isFollowedBy);

        // Récupère les stats followers/following
        const statsRes = await api.get(`/followers/count/${user.id}`);
        if (!statsRes) {
          setStats({ followers: 0, following: 0 });
        } else {
          setStats({
            followers: Number(statsRes.followers ?? 0),
            following: Number(statsRes.following ?? 0),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des infos utilisateur :", error);
        setStats({ followers: 0, following: 0 });
      }
    };

    fetchData();
  }, [user.id]);

  const handleFollowToggle = async () => {
    setLoading(true)
    try {
      if (followStatus === 'accepted' || followStatus === 'pending') {
        // Se désabonner ou annuler la demande
        await api.delete(`/followers/unfollow/${user.id}`)
        setFollowStatus(null)
        if (followStatus === 'accepted') {
          setStats(prev => prev ? { ...prev, followers: prev.followers - 1 } : prev)
        }
      } else {
        // Suivre
        const res = await api.post(`/followers/follow/${user.id}`, {})
        setFollowStatus(res.status)
        if (res.status === 'accepted') {
          setStats(prev => prev ? { ...prev, followers: prev.followers + 1 } : prev)
        }
      }
    } catch (error) {
      console.error("Erreur lors du suivi/désabonnement :", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link href={`/profile/view?username=${user.username}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover border border-neutral-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold border border-neutral-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-white">{user.username}</h3>
            <p className="text-neutral-400 text-sm">Voir la collection</p>
          </div>
        </Link>

        {/* Bouton abonné / s'abonner */}
        <button
          onClick={handleFollowToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${followStatus === 'accepted'
            ? "bg-neutral-800 border border-neutral-600 text-white hover:bg-neutral-700"
            : followStatus === 'pending'
              ? "bg-neutral-800 border border-neutral-600 text-neutral-400 hover:bg-neutral-700"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
        >
          {loading ? "..." : followStatus === 'accepted' ? "Abonné" : followStatus === 'pending' ? "Demande envoyée" : isFollowedBy ? "S'abonner en retour" : "S'abonner"}
        </button>
      </div>

      {stats && (
        <div className="text-sm text-neutral-400 flex gap-4">
          <p><strong className="text-white">{stats.followers}</strong> abonnés</p>
          <p><strong className="text-white">{stats.following}</strong> abonnements</p>
        </div>
      )}
    </div>
  )
}
