"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const router = useRouter()

    const fetchUnreadCount = async () => {
        try {
            const count = await api.get("/notifications/unread-count")
            setUnreadCount(count.count)
        } catch (error) {
            console.error("Failed to fetch notifications count", error)
        }
    }

    useEffect(() => {
        fetchUnreadCount()

        // Socket.io connection
        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000", {
            withCredentials: true,
        })

        socket.on("connect", () => {
            // We need to join the user room. 
            // Since we don't have the user ID easily accessible here without context, 
            // we rely on the backend session/cookie to identify the user if possible, 
            // OR we fetch the profile to get the ID.
            // Let's fetch the profile to get the ID and then emit join_user.
            api.get("/users/profile/me").then((data) => {
                if (data?.user?.id) {
                    socket.emit("join_user", data.user.id)
                }
            }).catch(err => console.error("Failed to get user for socket", err))
        })

        socket.on("notification", () => {
            // When a notification is received, refresh the count
            fetchUnreadCount()
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    const handleBellClick = () => {
        router.push("/notifications")
    }

    return (
        <div className="relative">
            <button
                onClick={handleBellClick}
                className="relative p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
        </div>
    )
}
