"use client"

import { useState } from "react"
import { VinylColorData, getVinylBackground } from "../vinyl/vinyl-color-picker"
import { Heart, MessageCircle } from "lucide-react"
import { api } from "@/lib/api"
import { CommentsSection } from "./comments-section"

interface FeedItemProps {
    item: {
        id: string
        title: string
        artist: string
        username: string
        profile_picture?: string
        cover_image?: string
        date_added: string
        vinyl_color?: string
        disc_count?: number
        likes_count?: number
        comments_count?: number
        has_liked?: boolean
        user_id?: string
    }
    currentUserId?: string
}

export function FeedItem({ item, currentUserId }: FeedItemProps) {
    const [liked, setLiked] = useState(item.has_liked || false)
    const [likesCount, setLikesCount] = useState(Number(item.likes_count) || 0)
    const [commentsCount, setCommentsCount] = useState(Number(item.comments_count) || 0)
    const [showComments, setShowComments] = useState(false)
    const [likeAnimating, setLikeAnimating] = useState(false)

    // Parse vinyl color
    let colorData: VinylColorData | VinylColorData[] | null = null
    if (item.vinyl_color) {
        try {
            const parsed = JSON.parse(item.vinyl_color)
            if ((Array.isArray(parsed) && parsed.length > 0) || (parsed.type && parsed.primary)) {
                colorData = parsed
            }
        } catch (e) {
            if (item.vinyl_color !== "Black") {
                colorData = {
                    type: ["Clear", "Transparent"].includes(item.vinyl_color) ? "transparent" : "solid",
                    primary: item.vinyl_color
                }
            }
        }
    }

    const discCount = item.disc_count || 1
    const displayColors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : [])

    const handleLike = async () => {
        // Optimistic update
        const newLiked = !liked
        setLiked(newLiked)
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1)
        setLikeAnimating(true)
        setTimeout(() => setLikeAnimating(false), 300)

        try {
            await api.post(`/interactions/likes/${item.id}`, {})
        } catch (error) {
            console.error("Error toggling like:", error)
            // Revert on error
            setLiked(!newLiked)
            setLikesCount(prev => !newLiked ? prev + 1 : prev - 1)
        }
    }

    return (
        <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
            <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                    {/* Vinyl Color Icons */}
                    <div className="absolute top-1 left-1 z-20 flex -space-x-2">
                        {Array.from({ length: Math.min(discCount, 3) }).map((_, i) => {
                            const color = displayColors[i]
                            return (
                                <div
                                    key={i}
                                    className="w-5 h-5 rounded-full shadow-sm flex items-center justify-center relative"
                                    style={{
                                        background: color ? getVinylBackground(color.type, color.primary, color.secondary) : "#1a1a1a",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        zIndex: 30 - i
                                    }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                                </div>
                            )
                        })}
                    </div>

                    {item.cover_image ? (
                        <img
                            src={item.cover_image}
                            alt={item.title}
                            className="w-full h-full rounded object-cover"
                        />
                    ) : (
                        <div className="w-full h-full rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold text-center px-2">
                            {item.title}
                        </div>
                    )}

                    {/* Disc Count Badge */}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white px-1 rounded border border-white/20">
                        {discCount}xLP
                    </span>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        {item.profile_picture ? (
                            <img
                                src={item.profile_picture}
                                alt={item.username}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black border border-neutral-700 text-white flex items-center justify-center text-sm font-bold">
                                {item.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="font-bold text-white">{item.username}</span>
                        <span className="text-neutral-500 text-xs ml-auto">
                            {new Date(item.date_added).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-neutral-400 text-sm">{item.artist.replace(/\s*\([^)]*\)/g, "")}</p>

                    {/* Interactions */}
                    <div className="flex items-center gap-6 mt-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-neutral-400 hover:text-white"}`}
                        >
                            <Heart
                                size={18}
                                fill={liked ? "currentColor" : "none"}
                                className={`transition-transform ${likeAnimating ? "scale-125" : "scale-100"}`}
                            />
                            <span>{likesCount}</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? "text-white" : "text-neutral-400 hover:text-white"}`}
                        >
                            <MessageCircle size={18} />
                            <span>{commentsCount}</span>
                        </button>
                    </div>
                </div>
            </div>

            {showComments && (
                <CommentsSection
                    vinylId={item.id}
                    currentUserId={currentUserId}
                    vinylOwnerId={item.user_id}
                    onCommentAdded={() => setCommentsCount(prev => prev + 1)}
                />
            )}
        </div>
    )
}
