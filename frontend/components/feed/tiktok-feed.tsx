"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, MessageCircle, User, Volume2, VolumeX, Play, Pause } from "lucide-react"
import { api } from "@/lib/api"
import { CommentsSection } from "./comments-section"
import { VinylColorData, getVinylBackground } from "../vinyl/vinyl-color-picker"
import Link from "next/link"

interface FeedItemData {
    id: string
    title: string
    artist: string
    username: string
    profile_picture?: string
    cover_image?: string
    date_added: string
    vinyl_color?: string
    disc_count?: number
    disc_name?: string
    format?: string
    likes_count?: number
    comments_count?: number
    has_liked?: boolean
    user_id?: string
}

interface TikTokFeedProps {
    items: FeedItemData[]
    onLoadMore?: () => void
    hasMore?: boolean
}

interface DeezerTrack {
    id: number
    title: string
    preview: string
    artist: { name: string }
}

export function TikTokFeed({ items, onLoadMore, hasMore = true }: TikTokFeedProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
    const [showComments, setShowComments] = useState(false)
    const [likedItems, setLikedItems] = useState<{ [key: string]: boolean }>({})
    const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({})
    const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>({})
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [audioLoading, setAudioLoading] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null)
    const [audioUnlocked, setAudioUnlocked] = useState(false)
    const [showHeartAnimation, setShowHeartAnimation] = useState(false)
    const [commentsFullscreen, setCommentsFullscreen] = useState(false)
    const wasPlayingRef = useRef(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef(0)
    const lastTapTime = useRef(0)
    const commentsDragStartY = useRef(0)

    // Cleanup navbar visibility on unmount
    useEffect(() => {
        return () => {
            window.dispatchEvent(new CustomEvent('toggle-navbar', { detail: { hidden: false } }))
        }
    }, [])

    // Initialize states from items
    useEffect(() => {
        const liked: { [key: string]: boolean } = {}
        const likes: { [key: string]: number } = {}
        const comments: { [key: string]: number } = {}
        items.forEach(item => {
            liked[item.id] = item.has_liked || false
            likes[item.id] = Number(item.likes_count) || 0
            comments[item.id] = Number(item.comments_count) || 0
        })
        setLikedItems(liked)
        setLikeCounts(likes)
        setCommentCounts(comments)
    }, [items])

    // Get current user
    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                const user = JSON.parse(userStr)
                setCurrentUserId(user.id)
            }
        } catch (e) {
            console.error("Error parsing user", e)
        }
    }, [])

    // Fetch audio preview from Deezer via backend proxy
    const fetchAudioPreview = useCallback(async (artist: string, title: string) => {
        setAudioLoading(true)
        setAudioUrl(null)

        try {
            // Clean artist and title (remove parentheses content)
            const cleanArtist = artist.replace(/\s*\([^)]*\)/g, "").trim()
            const cleanTitle = title.replace(/\s*\([^)]*\)/g, "").trim()
            const query = `${cleanArtist} ${cleanTitle}`

            // Use our backend proxy to avoid CORS
            const data = await api.get(`/music/search?q=${encodeURIComponent(query)}`)

            if (data.data && data.data.length > 0) {
                const track = data.data[0] as DeezerTrack
                if (track.preview) {
                    setAudioUrl(track.preview)
                    return
                }
            }
        } catch (error) {
            console.error("Error fetching audio preview:", error)
        } finally {
            setAudioLoading(false)
        }
    }, [])

    // Load audio when slide changes
    useEffect(() => {
        if (items[currentIndex]) {
            const item = items[currentIndex]
            fetchAudioPreview(item.artist, item.title)
            setShowComments(false)
        }
    }, [currentIndex, items, fetchAudioPreview])



    // Play/pause audio (without changing source)
    useEffect(() => {
        if (audioRef.current && audioUrl) {
            if (isPlaying && !isMuted) {
                audioRef.current.play().catch(() => {
                    // Browser blocked autoplay - that's ok, user can click play
                })
            } else {
                audioRef.current.pause()
            }
        }
    }, [isPlaying, isMuted])

    // Unlock audio on first user interaction
    const unlockAudio = useCallback(() => {
        if (!audioUnlocked && audioRef.current && !audioLoading) {
            setAudioUnlocked(true)
            if (audioUrl) {
                // Set src and play immediately within the user interaction event
                audioRef.current.src = audioUrl
                audioRef.current.load() // Required for iOS sometimes
                const playPromise = audioRef.current.play()

                if (playPromise !== undefined) {
                    playPromise.catch((e) => {
                        console.error("Unlock play failed:", e)
                    })
                }
                setIsPlaying(true)
            }
        }
    }, [audioUnlocked, audioUrl, audioLoading])

    // Auto-play when audio loads (only if already unlocked and track changes)
    useEffect(() => {
        if (audioUrl && !isMuted && audioRef.current && audioUnlocked) {
            // Only play if the src is different (new track)
            // We compare the end of the src because the browser might resolve it to a full URL
            if (!audioRef.current.src.endsWith(audioUrl)) {
                setIsPlaying(true)
                audioRef.current.src = audioUrl
                audioRef.current.load() // Ensure we load the new source
                audioRef.current.play().catch(() => { })
            }
        }
    }, [audioUrl, audioUnlocked, isMuted])

    // Navigate to slide
    const goToSlide = useCallback((index: number, direction?: 'up' | 'down') => {
        if (!audioUnlocked) return

        if (index >= 0 && index < items.length) {
            setSwipeDirection(direction || null)
            setTimeout(() => {
                setCurrentIndex(index)
                setSwipeDirection(null)
            }, 250)
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)

            // Load more items when approaching the end (3 items before end)
            if (index >= items.length - 3 && hasMore && onLoadMore) {
                onLoadMore()
            }
        }
    }, [items.length, hasMore, onLoadMore, audioUnlocked])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showComments) return

            if (e.key === "ArrowDown" || e.key === "j") {
                e.preventDefault()
                goToSlide(currentIndex + 1, 'up')
            } else if (e.key === "ArrowUp" || e.key === "k") {
                e.preventDefault()
                goToSlide(currentIndex - 1, 'down')
            } else if (e.key === " ") {
                e.preventDefault()
                setIsPlaying(prev => !prev)
            } else if (e.key === "m") {
                setIsMuted(prev => !prev)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [currentIndex, goToSlide, showComments])

    // Touch/swipe navigation
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY
        const diff = touchStartY.current - touchEndY

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToSlide(currentIndex + 1, 'up')
            } else {
                goToSlide(currentIndex - 1, 'down')
            }
        }
    }

    // Wheel navigation
    const handleWheel = useCallback((e: WheelEvent) => {
        if (showComments) return

        e.preventDefault()
        if (e.deltaY > 50) {
            goToSlide(currentIndex + 1, 'up')
        } else if (e.deltaY < -50) {
            goToSlide(currentIndex - 1, 'down')
        }
    }, [currentIndex, goToSlide, showComments])

    useEffect(() => {
        const container = containerRef.current
        if (container) {
            container.addEventListener("wheel", handleWheel, { passive: false })
            return () => container.removeEventListener("wheel", handleWheel)
        }
    }, [handleWheel])

    // Like handler
    const handleLike = async (itemId: string) => {
        const newLiked = !likedItems[itemId]
        setLikedItems(prev => ({ ...prev, [itemId]: newLiked }))
        setLikeCounts(prev => ({ ...prev, [itemId]: prev[itemId] + (newLiked ? 1 : -1) }))

        try {
            await api.post(`/interactions/likes/${itemId}`, {})
        } catch (error) {
            setLikedItems(prev => ({ ...prev, [itemId]: !newLiked }))
            setLikeCounts(prev => ({ ...prev, [itemId]: prev[itemId] + (newLiked ? -1 : 1) }))
        }
    }

    // Single tap to pause/play, double tap to like
    const singleTapTimeout = useRef<NodeJS.Timeout | null>(null)

    const handleTap = useCallback(() => {
        const now = Date.now()
        const DOUBLE_TAP_DELAY = 300

        if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            // Double tap detected - cancel single tap action and like
            if (singleTapTimeout.current) {
                clearTimeout(singleTapTimeout.current)
                singleTapTimeout.current = null
            }
            const itemId = items[currentIndex]?.id
            if (itemId && !likedItems[itemId]) {
                handleLike(itemId)
            }
            // Show heart animation
            setShowHeartAnimation(true)
            setTimeout(() => setShowHeartAnimation(false), 800)
        } else {
            // Single tap - schedule pause/play after delay
            singleTapTimeout.current = setTimeout(() => {
                setIsPlaying(prev => !prev)
            }, DOUBLE_TAP_DELAY)
        }
        lastTapTime.current = now
    }, [currentIndex, items, likedItems])

    // Open comments - don't pause audio (only fullscreen pauses)
    const openComments = useCallback(() => {
        setShowComments(true)
        setCommentsFullscreen(false)
        window.dispatchEvent(new CustomEvent('toggle-navbar', { detail: { hidden: true } }))
    }, [])

    // Close comments - resume audio if was playing before fullscreen
    const closeComments = useCallback(() => {
        setShowComments(false)
        if (commentsFullscreen && wasPlayingRef.current) {
            setIsPlaying(true)
        }
        setCommentsFullscreen(false)
        window.dispatchEvent(new CustomEvent('toggle-navbar', { detail: { hidden: false } }))
    }, [commentsFullscreen])

    // Toggle fullscreen - pause/resume audio accordingly
    const toggleCommentsFullscreen = useCallback(() => {
        if (!commentsFullscreen) {
            // Going fullscreen - save state and pause
            wasPlayingRef.current = isPlaying
            setIsPlaying(false)
            setCommentsFullscreen(true)
        } else {
            // Leaving fullscreen - resume if was playing
            if (wasPlayingRef.current) {
                setIsPlaying(true)
            }
            setCommentsFullscreen(false)
        }
    }, [commentsFullscreen, isPlaying])

    // Handle drag on comments modal
    const handleCommentsDragStart = (e: React.TouchEvent) => {
        commentsDragStartY.current = e.touches[0].clientY
    }

    const handleCommentsDragEnd = (e: React.TouchEvent) => {
        const dragEndY = e.changedTouches[0].clientY
        const diff = commentsDragStartY.current - dragEndY

        if (diff > 80 && !commentsFullscreen) {
            // Dragged up - go fullscreen
            toggleCommentsFullscreen()
        } else if (diff < -80) {
            // Dragged down - close or minimize
            if (commentsFullscreen) {
                toggleCommentsFullscreen()
            } else {
                closeComments()
            }
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-center px-8">
                <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Aucun vinyle récent</h3>
                    <p className="text-white/60">Les personnes que vous suivez n'ont pas ajouté de vinyles ce mois-ci</p>
                    <p className="text-white/40 text-sm mt-4">Suivez plus de collectionneurs pour découvrir de nouvelles perles !</p>
                </div>
            </div>
        )
    }

    const currentItem = items[currentIndex]

    // Parse vinyl color
    let colorData: VinylColorData | VinylColorData[] | null = null
    if (currentItem.vinyl_color) {
        try {
            const parsed = JSON.parse(currentItem.vinyl_color)
            if ((Array.isArray(parsed) && parsed.length > 0) || (parsed.type && parsed.primary)) {
                colorData = parsed
            }
        } catch (e) {
            if (currentItem.vinyl_color !== "Black") {
                colorData = {
                    type: ["Clear", "Transparent"].includes(currentItem.vinyl_color) ? "transparent" : "solid",
                    primary: currentItem.vinyl_color
                }
            }
        }
    }

    const discCount = currentItem.disc_count || 1
    const displayColors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : [])

    return (
        <div
            ref={containerRef}
            className="fixed left-0 right-0 top-16 bottom-16 md:top-16 md:bottom-0 bg-black overflow-hidden z-10"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <audio ref={audioRef} loop playsInline preload="auto" />

            {/* Audio unlock overlay */}
            {!audioUnlocked && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
                    onClick={() => {
                        if (!audioLoading) {
                            unlockAudio()
                        }
                    }}
                >
                    <div className="text-center animate-pulse">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                            {audioLoading ? (
                                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : audioUrl ? (
                                <Volume2 size={40} className="text-white" />
                            ) : (
                                <Play size={40} className="text-white" />
                            )}
                        </div>
                        <p className="text-white text-lg font-medium">
                            {audioLoading
                                ? "Chargement de l'extrait..."
                                : audioUrl
                                    ? "Appuyez pour activer le son"
                                    : "Appuyez pour commencer"}
                        </p>
                    </div>
                </div>
            )}

            {/* Heart animation on double tap */}
            {showHeartAnimation && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                    <Heart
                        size={100}
                        fill="#ff2d55"
                        className="text-[#ff2d55] drop-shadow-lg"
                        style={{
                            animation: 'heartPop 0.6s ease-out forwards',
                        }}
                    />
                </div>
            )}

            {/* Main content */}
            <div
                className="relative w-full h-full flex flex-col"
                onClick={handleTap}
            >
                {/* Cover image as background */}
                <div className="absolute inset-0">
                    {currentItem.cover_image ? (
                        <img
                            src={currentItem.cover_image}
                            alt={currentItem.title}
                            className="w-full h-full object-cover blur-2xl opacity-30"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-black" />
                    )}
                </div>

                {/* Top section - Album cover centered */}
                <div
                    className={`flex-1 flex items-center justify-center px-4 transition-all duration-300 ease-out ${swipeDirection === 'up'
                        ? '-translate-y-full opacity-0 scale-90'
                        : swipeDirection === 'down'
                            ? 'translate-y-full opacity-0 scale-90'
                            : 'translate-y-0 opacity-100 scale-100'
                        }`}
                >
                    {/* Vinyl disc animation with cover - responsive sizes */}
                    <div className="relative w-32 h-32 min-[350px]:w-44 min-[350px]:h-44 min-[400px]:w-52 min-[400px]:h-52 sm:w-64 sm:h-64 md:w-72 md:h-72">
                        {/* Spinning vinyl discs behind cover */}
                        {Array.from({ length: Math.min(discCount, 4) }).map((_, i) => {
                            // Calculate offset: first disc (i=0) is closest to cover
                            // We want them to stack to the left
                            // i=0 -> -25% (standard)
                            // i=1 -> -37%
                            // i=2 -> -49%
                            const offset = -25 - (i * 12)
                            const zIndex = -1 - i // Stack backwards
                            const color = displayColors[i % displayColors.length]

                            // Determine border color based on brightness
                            let borderColor = "rgba(255, 255, 255, 0.3)" // Default light border for dark vinyls
                            if (color && color.primary) {
                                // Simple brightness check
                                const hex = color.primary.replace('#', '')
                                const r = parseInt(hex.substr(0, 2), 16)
                                const g = parseInt(hex.substr(2, 2), 16)
                                const b = parseInt(hex.substr(4, 2), 16)
                                const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000

                                // If bright vinyl, use dark border. If dark vinyl, use light border.
                                if (brightness > 155) {
                                    borderColor = "rgba(0, 0, 0, 0.3)"
                                } else {
                                    borderColor = "rgba(255, 255, 255, 0.4)" // Stronger white border
                                }
                            }

                            return (
                                <div
                                    key={i}
                                    className={`absolute inset-0 rounded-full shadow-xl ${isPlaying ? 'animate-spin' : ''}`}
                                    style={{
                                        animation: isPlaying ? 'spin 3s linear infinite' : 'none',
                                        background: color
                                            ? getVinylBackground(color.type, color.primary, color.secondary)
                                            : '#1a1a1a',
                                        transform: `translateX(${offset}%)`,
                                        zIndex: zIndex,
                                        transition: 'transform 0.3s ease-out',
                                        border: `1px solid ${borderColor}`
                                    }}
                                >
                                    {/* Center label with disc name */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/60 flex flex-col items-center justify-center border border-white/10">
                                            <span className="text-[6px] sm:text-[8px] text-white/60 font-medium uppercase">
                                                {currentItem.format === 'CD' ? 'CD' : 'Vinyl'}
                                            </span>
                                            {(currentItem.disc_name || discCount > 1) && (
                                                <span className="text-[5px] sm:text-[7px] text-white/40 text-center px-1 truncate max-w-full">
                                                    {discCount > 1 ? `Disc ${i + 1}` : currentItem.disc_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Grooves */}
                                    <div className="absolute inset-3 sm:inset-4 rounded-full border border-white/5" />
                                    <div className="absolute inset-6 sm:inset-8 rounded-full border border-white/5" />
                                    <div className="absolute inset-9 sm:inset-12 rounded-full border border-white/5" />
                                </div>
                            )
                        })}

                        {/* Album cover */}
                        <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl z-10">
                            {currentItem.cover_image ? (
                                <img
                                    src={currentItem.cover_image}
                                    alt={currentItem.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <span className="text-white text-sm sm:text-lg font-bold text-center px-4">{currentItem.title}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom section - Info left, Actions right */}
                <div className="relative z-20 p-4 pb-16 flex items-end justify-between">
                    {/* Left side - Info */}
                    <div className="flex-1 pr-16">
                        {/* Username */}
                        <Link href={`/profile/view?username=${currentItem.username}`} className="flex items-center gap-2 mb-2">
                            {currentItem.profile_picture ? (
                                <img
                                    src={currentItem.profile_picture}
                                    alt={currentItem.username}
                                    className="w-8 h-8 rounded-full object-cover border border-white/50"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border border-white/50">
                                    <User size={16} className="text-white" />
                                </div>
                            )}
                            <span className="text-white font-semibold text-sm">@{currentItem.username}</span>
                        </Link>

                        {/* Title & Artist */}
                        <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2">{currentItem.title}</h2>
                        <p className="text-sm text-white/70">{currentItem.artist.replace(/\s*\([^)]*\)/g, "")}</p>

                        {/* Format badge */}
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentItem.format === 'CD'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                {currentItem.format === 'cd' ? '💿 CD' : '🎵 Vinyle'}
                            </span>
                            {discCount && (
                                <span className="text-white/50 text-xs">{discCount} disque{discCount > 1 ? 's' : ''}</span>
                            )}
                            {currentItem.disc_name && (
                                <span className="text-white/40 text-xs italic">"{currentItem.disc_name}"</span>
                            )}
                        </div>

                        {/* Audio controls */}
                        <div className="mt-3 flex items-center gap-3">
                            {audioLoading ? (
                                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                            ) : audioUrl ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsPlaying(!isPlaying)
                                        }}
                                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                    >
                                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsMuted(!isMuted)
                                        }}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                    >
                                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>

                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-white/50 bg-white/10 px-3 py-1.5 rounded-full">
                                    <VolumeX size={14} />
                                    <span className="text-xs font-medium">Pas d'extrait audio</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Like */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleLike(currentItem.id)
                            }}
                            className="flex flex-col items-center"
                        >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${likedItems[currentItem.id] ? 'bg-red-500' : 'bg-white/20'}`}>
                                <Heart
                                    size={24}
                                    fill={likedItems[currentItem.id] ? "white" : "none"}
                                    className="text-white"
                                />
                            </div>
                            <span className="text-white text-xs mt-1 font-medium">{likeCounts[currentItem.id] || 0}</span>
                        </button>

                        {/* Comments */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                openComments()
                            }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageCircle size={24} className="text-white" />
                            </div>
                            <span className="text-white text-xs mt-1 font-medium">{commentCounts[currentItem.id] || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Keyboard hints (desktop) */}
                <div className="hidden md:flex absolute bottom-4 left-4 gap-4 text-white/50 text-xs">
                    <span>↑↓ Naviguer</span>
                    <span>Espace Pause</span>
                    <span>M Muet</span>
                </div>
            </div>

            {/* Comments Modal */}
            {
                showComments && (
                    <div
                        className={`fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 ${commentsFullscreen ? 'pb-0' : 'pb-4'}`}
                        style={{
                            animation: 'fadeIn 0.2s ease-out',
                            // Removed manual height to rely on CSS fixed positioning
                        }}
                        onClick={closeComments}
                    >
                        <div
                            className={`bg-neutral-900 w-full max-w-lg flex flex-col transition-all duration-300 ${commentsFullscreen
                                ? 'h-full mt-0 rounded-none mx-0 pb-0' // Full height when fullscreen
                                : 'h-[65%] rounded-3xl'
                                }`}
                            style={{ animation: 'slideUp 0.3s ease-out' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drag handle - click or drag to toggle fullscreen */}
                            <div
                                className="flex flex-col items-center pt-3 pb-1 cursor-pointer touch-none"
                                onTouchStart={handleCommentsDragStart}
                                onTouchEnd={handleCommentsDragEnd}
                                onClick={toggleCommentsFullscreen}
                            >
                                <div className="w-12 h-1.5 bg-white/40 rounded-full hover:bg-white/60 transition-colors" />
                                <p className="text-white/30 text-xs mt-2 md:hidden">Glissez pour agrandir</p>
                            </div>
                            <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-800">
                                <h3 className="font-bold text-white">Commentaires</h3>
                                <div className="flex items-center gap-3">
                                    {/* Fullscreen toggle button (visible on desktop) */}
                                    <button
                                        onClick={toggleCommentsFullscreen}
                                        className="hidden md:block text-white/60 hover:text-white text-sm"
                                    >
                                        {commentsFullscreen ? '↓ Réduire' : '↑ Agrandir'}
                                    </button>
                                    <button onClick={closeComments} className="text-white/60 hover:text-white text-lg">
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 px-3 min-h-0 flex flex-col">
                                <CommentsSection
                                    vinylId={currentItem.id}
                                    currentUserId={currentUserId}
                                    vinylOwnerId={currentItem.user_id}
                                    onCommentAdded={() => setCommentCounts(prev => ({ ...prev, [currentItem.id]: (prev[currentItem.id] || 0) + 1 }))}
                                    variant="modal"
                                    onInputFocus={() => {
                                        if (!commentsFullscreen) {
                                            toggleCommentsFullscreen()
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
