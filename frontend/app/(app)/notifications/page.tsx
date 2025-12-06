"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, UserPlus, UserCheck, Loader2, Check, X, Bell, ArrowLeft, AlertCircle } from "lucide-react"
import { subscribeUserToPush, isPushSupported, getPushPermissionStatus } from "@/lib/push"

interface Notification {
    id: string
    type: "VINYL_COMMENT" | "COMMENT_LIKE" | "VINYL_LIKE" | "FOLLOW_REQUEST" | "NEW_FOLLOWER" | "FOLLOW_ACCEPTED"
    reference_id: string
    is_read: boolean
    created_at: string
    sender_username: string
    sender_profile_picture?: string
    sender_id: string
    is_following_back: boolean
    has_accepted_request: boolean
    // Local state for UI
    isAccepted?: boolean
    isFollowingBack?: boolean
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [isPushEnabled, setIsPushEnabled] = useState(false)
    const [pushSupported, setPushSupported] = useState(true)
    const [permissionStatus, setPermissionStatus] = useState<string>("default")
    const [isSubscribing, setIsSubscribing] = useState(false)
    const router = useRouter()

    const fetchNotifications = async () => {
        try {
            const notifs = await api.get("/notifications")
            // Initialize local state from backend data
            const mappedNotifs = notifs.map((n: Notification) => ({
                ...n,
                isAccepted: n.has_accepted_request,
                isFollowingBack: n.is_following_back
            }))
            setNotifications(mappedNotifs)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()

        // Check push support and permission
        const supported = isPushSupported()
        setPushSupported(supported)

        if (supported) {
            const status = getPushPermissionStatus()
            setPermissionStatus(status)
            setIsPushEnabled(status === "granted")
        }
    }, [])

    const handleEnablePush = async () => {
        setIsSubscribing(true)
        try {
            const success = await subscribeUserToPush()
            if (success) {
                setIsPushEnabled(true)
                setPermissionStatus("granted")
            } else {
                // Re-check permission status after attempt
                const status = getPushPermissionStatus()
                setPermissionStatus(status)
            }
        } finally {
            setIsSubscribing(false)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.is_read) {
                await api.put(`/notifications/${notification.id}/read`, {})
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
                )
            }

            if (notification.type === "VINYL_COMMENT" || notification.type === "VINYL_LIKE") {
                router.push(`/vinyl/${notification.reference_id}`)
            } else if (notification.type === "NEW_FOLLOWER" || notification.type === "FOLLOW_ACCEPTED") {
                router.push(`/profile/view?username=${notification.sender_username}`)
            } else if (notification.type === "FOLLOW_REQUEST") {
                // Do nothing, actions are handled by buttons
            }
        } catch (error) {
            console.error("Error handling notification click", error)
        }
    }

    const handleAcceptFollow = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation()
        try {
            await api.post(`/followers/accept/${notification.sender_id}`, {})
            // Update UI to show "Accepted" state and "Follow back" button
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isAccepted: true } : n))
            )
        } catch (error) {
            console.error("Failed to accept follow", error)
        }
    }

    const handleRejectFollow = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation()
        try {
            await api.post(`/followers/reject/${notification.sender_id}`, {})
            // Remove notification from list
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
        } catch (error) {
            console.error("Failed to reject follow", error)
        }
    }

    const handleFollowBack = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation()
        try {
            await api.post(`/followers/follow/${notification.sender_id}`, {})
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isFollowingBack: true } : n))
            )
        } catch (error: any) {
            console.error("Failed to follow back", error)
            // If already following or pending, treat as success for UI
            if (error.message && (error.message.includes("déjà") || error.message.includes("already"))) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, isFollowingBack: true } : n))
                )
            }
        }
    }

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all", {})
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        } catch (error) {
            console.error("Failed to mark all as read", error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "VINYL_COMMENT":
                return <MessageCircle className="w-5 h-5 text-blue-400" />
            case "COMMENT_LIKE":
            case "VINYL_LIKE":
                return <Heart className="w-5 h-5 text-red-400" />
            case "FOLLOW_REQUEST":
                return <UserPlus className="w-5 h-5 text-orange-400" />
            case "NEW_FOLLOWER":
            case "FOLLOW_ACCEPTED":
                return <UserCheck className="w-5 h-5 text-green-400" />
            default:
                return <MessageCircle className="w-5 h-5 text-gray-400" />
        }
    }

    const getText = (notification: Notification) => {
        const username = notification.sender_username
        switch (notification.type) {
            case "VINYL_COMMENT":
                return <span><span className="font-bold">{username}</span> a commenté votre vinyle</span>
            case "COMMENT_LIKE":
                return <span><span className="font-bold">{username}</span> a aimé votre commentaire</span>
            case "VINYL_LIKE":
                return <span><span className="font-bold">{username}</span> a aimé votre vinyle</span>
            case "FOLLOW_REQUEST":
                return <span><span className="font-bold">{username}</span> souhaite vous suivre</span>
            case "NEW_FOLLOWER":
                return <span><span className="font-bold">{username}</span> vous suit maintenant</span>
            case "FOLLOW_ACCEPTED":
                return <span><span className="font-bold">{username}</span> a accepté votre demande</span>
            default:
                return <span>Notification de <span className="font-bold">{username}</span></span>
        }
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <div className="max-w-2xl mx-auto">
                <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b border-neutral-800 mb-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                    </div>
                    <div className="flex gap-2 pl-2 flex-wrap">
                        {!pushSupported ? (
                            <div className="text-sm text-neutral-500 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Push non supporté
                            </div>
                        ) : permissionStatus === "denied" ? (
                            <div className="text-sm text-orange-400 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Push bloqué (vérifiez les paramètres)
                            </div>
                        ) : !isPushEnabled ? (
                            <button
                                onClick={handleEnablePush}
                                disabled={isSubscribing}
                                className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubscribing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Bell size={14} />
                                )}
                                {isSubscribing ? "Activation..." : "Activer push"}
                            </button>
                        ) : null}
                        {notifications.some(n => !n.is_read) && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-primary hover:text-primary/80"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 pt-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">
                            Aucune notification pour le moment
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex gap-4 ${!notification.is_read ? "bg-neutral-900" : "bg-black/20"
                                        }`}
                                >
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-white mb-1">
                                            {getText(notification)}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {new Date(notification.created_at).toLocaleDateString()} à {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        {notification.type === "FOLLOW_REQUEST" && !notification.isAccepted && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={(e) => handleAcceptFollow(e, notification)}
                                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                                                >
                                                    <Check size={14} /> Accepter
                                                </button>
                                                <button
                                                    onClick={(e) => handleRejectFollow(e, notification)}
                                                    className="px-3 py-1.5 bg-neutral-800 text-white text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-1"
                                                >
                                                    <X size={14} /> Refuser
                                                </button>
                                            </div>
                                        )}

                                        {notification.type === "FOLLOW_REQUEST" && notification.isAccepted && !notification.isFollowingBack && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={(e) => handleFollowBack(e, notification)}
                                                    className="px-3 py-1.5 bg-neutral-800 text-white text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-1"
                                                >
                                                    <UserPlus size={14} /> S'abonner en retour
                                                </button>
                                            </div>
                                        )}

                                        {notification.type === "FOLLOW_REQUEST" && notification.isAccepted && notification.isFollowingBack && (
                                            <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                                <Check size={12} /> Demande acceptée et suivi en retour
                                            </div>
                                        )}
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
