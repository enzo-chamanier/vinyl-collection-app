"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { ArrowLeft, Lock } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { VinylCard } from "@/components/vinyl/vinyl-card"
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
    is_private?: boolean
    is_following?: boolean
    followersCount?: number
    followingCount?: number
    vinyls?: Vinyl[]
    giftedVinyls?: Vinyl[]
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

    const [searchQuery, setSearchQuery] = useState("")
    const [groupByArtist, setGroupByArtist] = useState(false)
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
            let followersCount = 0
            let followingCount = 0

            // Fetch follow status and counts
            try {
                const [followRes, countRes] = await Promise.all([
                    api.get(`/followers/is-following/${userId}`),
                    api.get(`/followers/count/${userId}`)
                ])
                isFollowing = followRes.isFollowing
                followersCount = countRes.followers
                followingCount = countRes.following
            } catch (e) {
                console.warn("Could not fetch follow info", e)
            }

            // Construct profile object matching the interface
            const profileData: Profile = {
                ...data.user,
                vinyls: data.vinyls,
                giftedVinyls: data.giftedVinyls,
                stats: data.stats,
                is_following: isFollowing,
                followersCount,
                followingCount,
                // Ensure legacy fields mapping if needed
                profile_picture: data.user.profilePicture,
                is_private: !data.user.isPublic
            }

            setProfile(profileData)
        } catch (err: any) {
            console.error("Error loading profile:", err)
            setError("Impossible de charger le profil.")
        } finally {
            setLoading(false)
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

    if (loading) {
        return <FullScreenLoader message="Chargement du profil..." />
    }

    if (error || !profile) {
        return (
            <div className="text-center text-red-500 py-8">{error || "Utilisateur introuvable"}</div>
        )
    }

    const isOwner = currentUser?.id === profile.id

    const getDisplayedVinyls = () => {
        if (activeTab === "gifted_to") {
            return profile.vinyls?.filter((v: any) => v.gifted_by_user_id) || []
        }
        if (activeTab === "gifted_by") {
            return profile.giftedVinyls || []
        }
        return profile.vinyls || []
    }

    const displayedVinyls = getDisplayedVinyls()

    const filteredVinyls = displayedVinyls.filter((vinyl: any) => {
        const query = searchQuery.toLowerCase()
        return (
            vinyl.title.toLowerCase().includes(query) ||
            (vinyl.artist && vinyl.artist.toLowerCase().includes(query)) ||
            (vinyl.genre && vinyl.genre.toLowerCase().includes(query))
        )
    })

    const vinylsByArtist = filteredVinyls.reduce((acc: any, vinyl: any) => {
        const artist = vinyl.artist ? vinyl.artist.replace(/\s*\([^)]*\)/g, "") : "Inconnu"
        if (!acc[artist]) acc[artist] = []
        acc[artist].push(vinyl)
        return acc
    }, {})

    const isPrivate = profile.is_private && !profile.is_following && !isOwner

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-black hover:text-text-secondary hover:cursor-pointer mb-4 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
            </button>

            {/* Header Profil */}
            <div className="bg-surface rounded-xl p-6 mb-8 border border-border">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        {profile.profile_picture ? (
                            <img
                                src={profile.profile_picture}
                                alt={profile.username}
                                className="w-24 h-24 rounded-full object-cover border-4 border-background"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold border-4 border-background">
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-white mb-2">{profile.username}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-6 text-text-secondary">
                            <div className="text-center">
                                <span className="block text-xl font-bold text-white">{profile.followersCount || 0}</span>
                                <span className="text-xs uppercase tracking-wider">Abonnés</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-bold text-white">{profile.followingCount || 0}</span>
                                <span className="text-xs uppercase tracking-wider">Abonnements</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-bold text-white">{profile.vinyls?.length || 0}</span>
                                <span className="text-xs uppercase tracking-wider">Vinyles</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu (Collection ou Privé) */}
            {isPrivate ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-surface/50 rounded-xl border border-border border-dashed">
                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-text-secondary" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Ce profil est privé</h2>
                    <p className="text-text-secondary max-w-md">
                        Abonnez-vous à cet utilisateur pour voir sa collection de vinyles.
                    </p>
                </div>
            ) : (
                <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <button
                                onClick={() => setActiveTab("collection")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === "collection" ? "bg-primary text-white" : "bg-surface text-text-secondary hover:text-white"}`}
                            >
                                Collection
                            </button>
                            <button
                                onClick={() => setActiveTab("gifted_to")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === "gifted_to" ? "bg-primary text-white" : "bg-surface text-text-secondary hover:text-white"}`}
                            >
                                Reçus 🎁
                            </button>
                            <button
                                onClick={() => setActiveTab("gifted_by")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === "gifted_by" ? "bg-primary text-white" : "bg-surface text-text-secondary hover:text-white"}`}
                            >
                                Offerts 💝
                            </button>
                        </div>

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
                                                onUpdate={fetchProfile}
                                                variant="dark"
                                                readOnly={!isOwner || activeTab === "gifted_by"}
                                                currentUserId={currentUser?.id}
                                                currentUsername={currentUser?.username}
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
                                    onUpdate={fetchProfile}
                                    variant="dark"
                                    readOnly={!isOwner || activeTab === "gifted_by"}
                                    currentUserId={currentUser?.id}
                                    currentUsername={currentUser?.username}
                                />
                            ))}
                        </div>
                    )}

                    {filteredVinyls.length === 0 && (
                        <div className="text-center py-12 text-text-secondary bg-surface/30 rounded-lg">
                            Aucun vinyle trouvé.
                        </div>
                    )}
                </div>
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
