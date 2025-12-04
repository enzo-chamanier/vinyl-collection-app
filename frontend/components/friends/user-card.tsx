"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"

interface UserCardProps {
  user: any
}

export function UserCard({ user }: UserCardProps) {
  const [following, setFollowing] = useState<boolean | null>(null) // null = loading initial
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{ followers: number; following: number } | null>(null)

  // Check if already following + get stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Vérifie si l'utilisateur est suivi
        const followRes = await api.get(`/followers/is-following/${user.id}`);
        const isFollowing = followRes.isFollowing ?? false;
        setFollowing(isFollowing);

        // Récupère les stats followers/following
        const statsRes = await api.get(`/followers/count/${user.id}`);
        if (!statsRes) {
          console.warn("Pas de données reçues du backend pour les stats.");
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
    if (following === null) return; // sécurité
    setLoading(true)
    try {
      if (!following) {
        // Suivre
        await api.post(`/followers/follow/${user.id}`, {})
        setFollowing(true)
        setStats(prev => prev ? { ...prev, followers: prev.followers + 1 } : prev)
      } else {
        // Se désabonner
        await api.delete(`/followers/unfollow/${user.id}`)
        setFollowing(false)
        setStats(prev => prev ? { ...prev, followers: prev.followers - 1 } : prev)
      }
    } catch (error) {
      console.error("Erreur lors du suivi/désabonnement :", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link href={`/profile/view?username=${user.username}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h3 className="font-semibold">{user.username}</h3>
            <p className="text-text-secondary text-sm">Voir la collection</p>
          </div>
        </Link>

        {/* Bouton abonné / s'abonner */}
        {following !== null && (
          <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`px-4 py-2 rounded font-semibold transition border border-primary
              ${following
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-white text-primary hover:bg-primary/90 hover:text-white"
              }`}
          >
            {loading ? "Chargement..." : following ? "Abonné" : "S'abonner"}
          </button>
        )}
      </div>

      {stats && (
        <div className="text-sm text-text-secondary flex gap-4">
          <p><strong>{stats.followers}</strong> followers</p>
          <p><strong>{stats.following}</strong> following</p>
        </div>
      )}
    </div>
  )
}
