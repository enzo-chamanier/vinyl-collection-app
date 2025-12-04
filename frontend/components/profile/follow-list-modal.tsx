"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { X } from "lucide-react"
import Link from "next/link"

interface User {
    id: string
    username: string
    profile_picture?: string
}

interface FollowListModalProps {
    userId: string
    type: "followers" | "following"
    isOpen: boolean
    onClose: () => void
}

export function FollowListModal({ userId, type, isOpen, onClose }: FollowListModalProps) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && userId) {
            loadUsers()
        }
    }, [isOpen, userId, type])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const endpoint = type === "followers"
                ? `/followers/followers/${userId}`
                : `/followers/following/${userId}`
            const data = await api.get(endpoint)
            setUsers(data)
        } catch (error) {
            console.error("Error loading users:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-white">
                        {type === "followers" ? "Abonnés" : "Abonnements"}
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="text-center text-text-secondary py-4">Chargement...</div>
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <Link
                                    href={`/profile/view?username=${user.username}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 hover:opacity-80 transition"
                                >
                                    {user.profile_picture ? (
                                        <img
                                            src={user.profile_picture}
                                            alt={user.username}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-medium text-white">{user.username}</span>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-text-secondary py-8">
                            Aucun utilisateur trouvé.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
