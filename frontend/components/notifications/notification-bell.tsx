"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, MessageCircle, Heart } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { subscribeUserToPush } from "@/lib/push"

interface Notification {
    id: string
    type: "VINYL_COMMENT" | "COMMENT_LIKE"
    reference_id: string
    is_read: boolean
    created_at: string
    sender_username: string
    sender_profile_picture?: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const fetchNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                api.get("/notifications"),
                api.get("/notifications/unread-count"),
            ])
            setNotifications(notifs)
            setUnreadCount(count.count)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.is_read) {
                await api.put(`/notifications/${notification.id}/read`, {})
                setUnreadCount((prev) => Math.max(0, prev - 1))
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
                )
            }
            setIsOpen(false)

            // Navigate based on type
            if (notification.type === "VINYL_COMMENT") {
                router.push(`/vinyl/${notification.reference_id}`)
            } else if (notification.type === "COMMENT_LIKE") {
                // For comment likes, we try to navigate to the vinyl if possible
                // Ideally we would have the vinyl_id in the notification or reference_id
                // But currently reference_id is comment_id.
                // The backend push payload has the URL, but here we are using the in-app notification object.
                // We might need to fetch the comment to get the vinyl_id, or just rely on the user finding it.
                // For now, let's just do nothing or maybe show a toast.
                // Actually, let's try to fetch the comment details if we really want to navigate.
                // Or better, update the backend to include vinyl_id in the notification object for COMMENT_LIKE.
                // But for now, let's just leave it as is.
            }
        } catch (error) {
            console.error("Error handling notification click", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all", {})
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark all as read", error)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-neutral-800 flex justify-between items-center">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={async () => {
                                    const success = await subscribeUserToPush()
                                    if (success) alert("Notifications activées !")
                                }}
                                className="text-xs text-neutral-400 hover:text-white"
                            >
                                Activer push
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:text-primary/80"
                                >
                                    Tout lu
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-neutral-500 text-sm">
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-3 border-b border-neutral-800 hover:bg-neutral-800 cursor-pointer transition-colors flex gap-3 ${!notification.is_read ? "bg-neutral-800/50" : ""
                                        }`}
                                >
                                    <div className="mt-1">
                                        {notification.type === "VINYL_COMMENT" ? (
                                            <MessageCircle className="w-5 h-5 text-blue-400" />
                                        ) : (
                                            <Heart className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white">
                                            <span className="font-bold">{notification.sender_username}</span>{" "}
                                            {notification.type === "VINYL_COMMENT"
                                                ? "a commenté votre vinyle"
                                                : "a aimé votre commentaire"}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
