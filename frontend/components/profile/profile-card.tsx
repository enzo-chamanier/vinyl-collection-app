"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { FollowListModal } from "./follow-list-modal"
import { EditProfileModal } from "./edit-profile-modal"
import { Settings, UserCheck, UserPlus, Globe, Lock } from "lucide-react"

interface ProfileCardProps {
  profile: any
  isOwnProfile?: boolean
  onUpdate?: () => void
}

export function ProfileCard({ profile, isOwnProfile = false, onUpdate }: ProfileCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
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
    return <div className="text-center text-muted-foreground">Profil non trouvé</div>
  }

  return (
    <>
      <div className="bg-card rounded-xl p-6 mb-8 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center">
              {profile.user.profile_picture ? (
                <img
                  src={profile.user.profile_picture}
                  alt={profile.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground">
                  {profile.user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Info & Stats */}
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{profile.user.username}</h1>
                <p className="text-muted-foreground text-sm mb-3 max-w-md mx-auto md:mx-0 leading-relaxed">
                  {profile.user.bio || "Aucune bio renseignée."}
                </p>

                {profile.user.isPublic && profile.user.profileCategory && (
                  <div className="mb-4 flex justify-center md:justify-start">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                      {profile.user.profileCategory}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center md:justify-start gap-2 w-fit mx-auto md:mx-0">
                  {profile.user.isPublic ? (
                    <span className="flex items-center gap-1.5 text-green-400/90 bg-green-400/10 px-3 py-1 rounded-full text-xs font-medium border border-green-400/20">
                      <Globe size={14} className="text-green-400" />
                      Profil Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-orange-400/90 bg-orange-400/10 px-3 py-1 rounded-full text-xs font-medium border border-orange-400/20">
                      <Lock size={14} className="text-orange-400" />
                      Profil Privé
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center md:justify-end">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Modifier
                  </button>
                ) : (
                  <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    disabled={loadingFollow}
                    className={`px-6 py-2 rounded-lg font-semibold transition text-sm flex items-center gap-2 ${isFollowing
                      ? "bg-background border border-border text-foreground hover:bg-muted"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                      }`}
                  >
                    {loadingFollow ? (
                      "..."
                    ) : isFollowing ? (
                      <>
                        <UserCheck size={16} />
                        Abonné
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        S'abonner
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-8 border-t border-border pt-6">
              <div className="text-center group cursor-default">
                <span className="block text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{profile.stats?.total || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vinyles</span>
              </div>
              <button
                onClick={() => setModalType("followers")}
                className="text-center group hover:bg-muted/50 p-2 -m-2 rounded-lg transition-all"
              >
                <span className="block text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{profile.followersCount || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Abonnés</span>
              </button>
              <button
                onClick={() => setModalType("following")}
                className="text-center group hover:bg-muted/50 p-2 -m-2 rounded-lg transition-all"
              >
                <span className="block text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{profile.followingCount || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Abonnements</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentUser={{
            username: profile.user.username,
            bio: profile.user.bio,
            isPublic: profile.user.isPublic,
            profilePicture: profile.user.profile_picture,
            profileCategory: profile.user.profileCategory
          }}
          onUpdate={() => {
            onUpdate?.()
          }}
        />
      )}

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
