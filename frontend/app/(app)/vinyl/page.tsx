"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { AppLayout } from "@/components/layout/app-layout"
import { CommentsSection } from "@/components/feed/comments-section"
import { Heart, MessageCircle, ArrowLeft, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { getVinylBackground, type VinylColorData } from "@/components/vinyl/vinyl-color-picker"

interface VinylDetail {
    id: string
    title: string
    artist: string
    genre: string
    release_year?: number
    cover_image?: string
    vinyl_color?: string
    disc_count?: number
    format?: "vinyl" | "cd"
    owner_id: string
    owner_username: string
    owner_profile_picture?: string
    gifted_by_username?: string
    shared_with_username?: string
    likes_count: number
    comments_count: number
    has_liked: boolean
}

function VinylDetailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const vinylId = searchParams.get("id")
    const scrollToCommentId = searchParams.get("commentId")
    const commentsRef = useRef<HTMLDivElement>(null)

    const [vinyl, setVinyl] = useState<VinylDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [liked, setLiked] = useState(false)
    const [likesCount, setLikesCount] = useState(0)
    const [commentsCount, setCommentsCount] = useState(0)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        setCurrentUserId(user.id || null)
        if (vinylId) {
            fetchVinyl()
        }
    }, [vinylId])

    const fetchVinyl = async () => {
        if (!vinylId) return
        try {
            const data = await api.get(`/vinyls/${vinylId}`)
            setVinyl(data)
            setLiked(data.has_liked)
            setLikesCount(data.likes_count)
            setCommentsCount(data.comments_count)
        } catch (err: any) {
            console.error("Error fetching vinyl:", err)
            setError("Impossible de charger le vinyle.")
        } finally {
            setLoading(false)
        }
    }

    // Note: On desktop, comments are visible side-by-side, no scroll needed

    const handleLike = async () => {
        if (!vinyl) return
        try {
            await api.post(`/interactions/like/${vinyl.id}`, {})
            setLiked(!liked)
            setLikesCount(prev => liked ? prev - 1 : prev + 1)
        } catch (error) {
            console.error("Error toggling like:", error)
        }
    }

    // Parse vinyl color
    let colorData: VinylColorData | VinylColorData[] | null = null
    if (vinyl?.vinyl_color) {
        try {
            colorData = JSON.parse(vinyl.vinyl_color)
        } catch {
            colorData = null
        }
    }

    const displayColors: VinylColorData[] = colorData
        ? Array.isArray(colorData) ? colorData : [colorData]
        : [{ type: "solid", primary: "#000000" }]

    if (!vinylId) {
        return (
            <AppLayout>
                <div className="max-w-2xl mx-auto text-center py-12">
                    <p className="text-red-400 mb-4">ID du vinyle manquant</p>
                    <button
                        onClick={() => router.back()}
                        className="text-primary hover:underline"
                    >
                        Retour
                    </button>
                </div>
            </AppLayout>
        )
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        )
    }

    if (error || !vinyl) {
        return (
            <AppLayout>
                <div className="max-w-2xl mx-auto text-center py-12">
                    <p className="text-red-400 mb-4">{error || "Vinyle non trouvé"}</p>
                    <button
                        onClick={() => router.back()}
                        className="text-primary hover:underline"
                    >
                        Retour
                    </button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Détail du vinyle</h1>
                </div>

                {/* Desktop: Two columns / Mobile: Single column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[70vh]">
                    {/* Left Column: Cover + Info */}
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden md:overflow-y-auto">
                        {/* Owner Header */}
                        <Link
                            href={`/profile/view?username=${vinyl.owner_username}`}
                            className="flex items-center gap-3 p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                        >
                            {vinyl.owner_profile_picture ? (
                                <img
                                    src={vinyl.owner_profile_picture}
                                    alt={vinyl.owner_username}
                                    className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                                    <User className="w-5 h-5 text-neutral-400" />
                                </div>
                            )}
                            <span className="font-semibold">{vinyl.owner_username}</span>
                        </Link>

                        {/* Cover Image */}
                        <div className="relative aspect-square md:aspect-video md:max-h-72 bg-neutral-800 flex items-center justify-center">
                            {vinyl.cover_image ? (
                                <img
                                    src={vinyl.cover_image}
                                    alt={vinyl.title}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div
                                        className="w-32 h-32 rounded-full"
                                        style={{
                                            background: getVinylBackground(
                                                displayColors[0].type,
                                                displayColors[0].primary,
                                                displayColors[0].secondary,
                                                displayColors[0].splatterSize,
                                                displayColors[0].tertiary,
                                                displayColors[0].quaternary
                                            )
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            {/* Actions */}
                            <div className="flex items-center gap-4 mb-4">
                                <button
                                    onClick={handleLike}
                                    className="flex items-center gap-2 transition-colors"
                                >
                                    <Heart
                                        className={`w-6 h-6 ${liked ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-400"}`}
                                    />
                                    <span className="text-sm text-neutral-400">{likesCount}</span>
                                </button>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <MessageCircle className="w-6 h-6" />
                                    <span className="text-sm">{commentsCount}</span>
                                </div>
                            </div>

                            {/* Title & Artist */}
                            <h2 className="text-xl font-bold mb-1">{vinyl.title}</h2>
                            <p className="text-neutral-400 mb-2">{vinyl.artist}</p>

                            {/* Meta */}
                            <div className="flex flex-wrap gap-2 text-sm text-neutral-500">
                                {vinyl.genre && (
                                    <span className="bg-neutral-800 px-2 py-1 rounded">{vinyl.genre}</span>
                                )}
                                {vinyl.release_year && (
                                    <span className="bg-neutral-800 px-2 py-1 rounded">{vinyl.release_year}</span>
                                )}
                                {vinyl.format && (
                                    <span className="bg-neutral-800 px-2 py-1 rounded uppercase">{vinyl.format}</span>
                                )}
                                {vinyl.disc_count && vinyl.disc_count > 1 && (
                                    <span className="bg-neutral-800 px-2 py-1 rounded">{vinyl.disc_count} disques</span>
                                )}
                            </div>

                            {/* Gift/Shared info */}
                            {vinyl.gifted_by_username && (
                                <p className="text-sm text-purple-400 mt-3">
                                    🎁 Offert par {vinyl.gifted_by_username}
                                </p>
                            )}
                            {vinyl.shared_with_username && (
                                <p className="text-sm text-blue-400 mt-1">
                                    👥 Partagé avec {vinyl.shared_with_username}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Comments */}
                    <div ref={commentsRef} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex flex-col overflow-hidden">
                        <h3 className="font-semibold mb-4 flex-shrink-0">Commentaires</h3>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <CommentsSection
                                vinylId={vinyl.id}
                                currentUserId={currentUserId || ""}
                                vinylOwnerId={vinyl.owner_id}
                                onCommentAdded={() => setCommentsCount(prev => prev + 1)}
                                variant="modal"
                                scrollToCommentId={scrollToCommentId || undefined}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default function VinylDetailPage() {
    return (
        <Suspense fallback={
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        }>
            <VinylDetailContent />
        </Suspense>
    )
}
