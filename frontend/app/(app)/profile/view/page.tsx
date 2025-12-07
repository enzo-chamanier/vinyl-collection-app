"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { ArrowLeft, Lock, Loader2 } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
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
    id: string
    username: string
    profile_picture?: string
    bio?: string
    is_private?: boolean
    is_following?: boolean
    is_pending?: boolean
    is_followed_by?: boolean
    followersCount?: number
    followingCount?: number
    vinyls?: Vinyl[]
    giftedVinyls?: Vinyl[]
    profileCategory?: string
    [key: string]: any
}

function ProfileContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const username = searchParams.get("username")
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loadingFollow, setLoadingFollow] = useState(false)

    // Vinyl pagination state for main collection
    const [vinyls, setVinyls] = useState<Vinyl[]>([])
    const [loadingVinyls, setLoadingVinyls] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const LIMIT = 10

    const [activeTab, setActiveTab] = useState<"collection" | "gifted_to" | "gifted_by">("collection")

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        setCurrentUser(user)
    }, [])

    const fetchProfile = async () => {
        if (!username) return
        try {
            setLoading(true)
            // Fetch user profile by username
            const data = await api.get(`/users/${username}`)

            if (!data || !data.user) {
                throw new Error("Données utilisateur incomplètes")
            }

            const userId = data.user.id
            let isFollowing = false
            let isPending = false
            let isFollowedBy = false
            let followersCount = 0
            let followingCount = 0

            // Fetch follow status and counts
            try {
                const [followRes, countRes] = await Promise.all([
                    api.get(`/followers/is-following/${userId}`),
                    api.get(`/followers/count/${userId}`)
                ])
                isFollowing = followRes.isFollowing
                isPending = followRes.isPending
                isFollowedBy = followRes.isFollowedBy
                followersCount = countRes.followers
                followingCount = countRes.following
            } catch (e) {
                console.warn("Could not fetch follow info", e)
            }

            // Construct profile object matching the interface
            const profileData: Profile = {
                ...data.user,
                // We don't use data.vinyls for the main collection anymore, but we keep it for reference or initial load if needed
                // giftedVinyls are still used for "gifted_by" (gifted TO others)
                giftedVinyls: data.giftedVinyls,
                stats: data.stats,
                is_following: isFollowing,
                is_pending: isPending,
                is_followed_by: isFollowedBy,
                followersCount,
                followingCount,
                profile_picture: data.user.profilePicture,
                is_private: !data.user.isPublic,
                profileCategory: data.user.profileCategory
            }

            setProfile(profileData)

            // Fetch vinyls if we can view them
            const isOwner = currentUser?.id === userId
            const canView = data.user.isPublic || isOwner || (isFollowing && !isPending)

            if (canView) {
                fetchVinyls(userId, true)
            }

        } catch (err: any) {
            console.error("Error loading profile:", err)
            setError("Impossible de charger le profil.")
        } finally {
            setLoading(false)
        }
    }

    const fetchVinyls = async (userId: string, isInitial = false) => {
        try {
            if (isInitial) {
                setLoadingVinyls(true)
                setOffset(0)
            } else {
                setLoadingMore(true)
            }

            const currentOffset = isInitial ? 0 : offset
            const result = await api.get(`/vinyls/user/${userId}?limit=${LIMIT}&offset=${currentOffset}`)

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
            // If error is 403 (private), it's handled by UI
        } finally {
            setLoadingVinyls(false)
            setLoadingMore(false)
        }
    }

    const loadMore = () => {
        if (!loadingMore && hasMore && profile) {
            fetchVinyls(profile.id, false)
        }
    }

    useEffect(() => {
        if (username) {
            fetchProfile()
        } else {
            setLoading(false)
            setError("Aucun utilisateur spécifié")
        }
    }, [username])

    const isOwner = currentUser?.id === profile?.id
    const isPrivate = profile?.is_private && !profile?.is_following && !isOwner

    const handleFollowToggle = async () => {
        if (!profile) return
        setLoadingFollow(true)
        try {
            if (profile.is_following || profile.is_pending) {
                await api.delete(`/followers/unfollow/${profile.id}`)
                setProfile(prev => prev ? {
                    ...prev,
                    is_following: false,
                    is_pending: false,
                    followersCount: prev.is_following ? (prev.followersCount || 0) - 1 : prev.followersCount
                } : null)
            } else {
                const res = await api.post(`/followers/follow/${profile.id}`, {})
                setProfile(prev => prev ? {
                    ...prev,
                    is_following: res.status === 'accepted',
                    is_pending: res.status === 'pending',
                    followersCount: res.status === 'accepted' ? (prev.followersCount || 0) + 1 : prev.followersCount
                } : null)

                // If accepted immediately, fetch vinyls
                if (res.status === 'accepted') {
                    fetchVinyls(profile.id, true)
                }
            }
        } catch (error) {
            console.error("Error toggling follow:", error)
        } finally {
            setLoadingFollow(false)
        }
    }

    // Determine which vinyls to show based on active tab
    const getTabVinyls = () => {
        if (!profile) return []
        if (activeTab === "gifted_to") {
            // "Reçus": Vinyls gifted TO this user (gifted_by_user_id is set)
            // These are part of the main collection, but we need to filter them.
            // Since we are paginating the main collection, we might not have all of them.
            // Ideally we should have a separate endpoint or filter param for this.
            // For now, let's filter the LOADED vinyls, which is imperfect but safe.
            // OR, we can use the `giftedVinyls` from profile if it contained them?
            // Wait, backend `giftedVinyls` are vinyls gifted BY the user.

            // Let's filter the `vinyls` state.
            return vinyls.filter(v => (v as any).gifted_by_user_id)
        }
        if (activeTab === "gifted_by") {
            // "Offerts": Vinyls gifted BY this user (from profile.giftedVinyls)
            return profile.giftedVinyls || []
        }
        // "Collection": All vinyls
        return vinyls
    }

    const tabVinyls = getTabVinyls()

    return (
        <div className="max-w-4xl mx-auto relative">
            <div className="sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b border-neutral-800 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : error || !profile ? (
                <div className="text-center text-red-500 py-8">{error || "Utilisateur introuvable"}</div>
            ) : (
                <>
                    {/* Header Profil */}
                    <div className="bg-neutral-900 rounded-xl p-6 mb-8 border border-neutral-800">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                {profile.profile_picture ? (
                                    <img
                                        src={profile.profile_picture}
                                        alt={profile.username}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-neutral-800"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white text-3xl font-bold border-4 border-neutral-800 border-neutral-700">
                                        {profile.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                    <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
                                    {!isOwner && (
                                        <button
                                            onClick={handleFollowToggle}
                                            disabled={loadingFollow}
                                            className={`px-6 py-2 rounded-lg font-semibold transition text-sm ${profile.is_following
                                                ? "bg-neutral-800 border border-neutral-600 text-white hover:bg-neutral-700"
                                                : profile.is_pending
                                                    ? "bg-neutral-800 border border-neutral-600 text-neutral-400 hover:bg-neutral-700"
                                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                                }`}
                                        >
                                            {loadingFollow ? "..." : profile.is_following ? "Abonné" : profile.is_pending ? "Demande envoyée" : profile.is_followed_by ? "S'abonner en retour" : "S'abonner"}
                                        </button>
                                    )}
                                </div>
                                {profile.bio && (
                                    <p className="text-neutral-400 mb-2 max-w-2xl mx-auto md:mx-0">{profile.bio}</p>
                                )}
                                {profile.profileCategory && !isPrivate && (
                                    <div className="mb-4 flex justify-center md:justify-start">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                            {profile.profileCategory}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-center md:justify-start gap-6 text-neutral-400">
                                    <div className="text-center">
                                        <span className="block text-xl font-bold text-white">{profile.followersCount || 0}</span>
                                        <span className="text-xs uppercase tracking-wider">Abonnés</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-xl font-bold text-white">{profile.followingCount || 0}</span>
                                        <span className="text-xs uppercase tracking-wider">Abonnements</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-xl font-bold text-white">{totalCount || profile.vinyls?.length || 0}</span>
                                        <span className="text-xs uppercase tracking-wider">Vinyles</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenu (Collection ou Privé) */}
                    {isPrivate ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-card/50 rounded-xl border border-border border-dashed">
                            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">Ce profil est privé</h2>
                            <p className="text-muted-foreground max-w-md">
                                Abonnez-vous à cet utilisateur pour voir sa collection de vinyles.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                        <button
                                            onClick={() => setActiveTab("collection")}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === "collection" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                                        >
                                            Collection
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("gifted_to")}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === "gifted_to" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                                        >
                                            Reçus 🎁
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("gifted_by")}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === "gifted_by" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                                        >
                                            Offerts 💝
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {activeTab === "collection" ? (
                                <div className="mt-4">
                                    <VinylCollection
                                        vinyls={vinyls}
                                        loading={loadingVinyls}
                                        onUpdate={() => fetchVinyls(profile.id, true)}
                                        title=""
                                        totalCount={totalCount}
                                        onLoadMore={loadMore}
                                        loadingMore={loadingMore}
                                        hasMore={hasMore}
                                    />
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <VinylCollection
                                        vinyls={tabVinyls}
                                        loading={false}
                                        onUpdate={() => fetchVinyls(profile.id, true)}
                                        title={activeTab === "gifted_to" ? "Vinyles reçus" : "Vinyles offerts"}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default function UserProfilePage() {
    return (
        <AppLayout>
            <Suspense fallback={<FullScreenLoader message="Chargement..." />}>
                <ProfileContent />
            </Suspense>
        </AppLayout>
    )
}
