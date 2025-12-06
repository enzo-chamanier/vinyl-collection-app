"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { User, Clock } from "lucide-react"
import Link from "next/link"

interface Request {
    id: string
    username: string
    profile_picture?: string
}

export function SentRequests() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await api.get("/followers/requests/sent")
            setRequests(res)
        } catch (error) {
            console.error("Error fetching sent requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async (userId: string) => {
        try {
            await api.delete(`/followers/unfollow/${userId}`)
            setRequests(prev => prev.filter(r => r.id !== userId))
        } catch (error) {
            console.error("Error cancelling request:", error)
        }
    }

    if (loading) return null
    if (requests.length === 0) return null

    return (
        <div className="mb-12">
            <h2 className="text-2xl text-primary font-bold mb-6">Demandes envoyées</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {requests.map((request) => (
                    <div key={request.id} className="p-4 flex items-center justify-between border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <Link href={`/profile/view?username=${request.username}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                            {request.profile_picture ? (
                                <img
                                    src={request.profile_picture}
                                    alt={request.username}
                                    className="w-12 h-12 rounded-full object-cover border border-border"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white border border-border">
                                    <User size={20} />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="font-bold text-foreground">{request.username}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock size={12} /> En attente
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={() => handleCancel(request.id)}
                            className="px-3 py-1 bg-neutral-800 border border-neutral-600 text-neutral-400 hover:bg-neutral-700 hover:text-white rounded-lg text-sm transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
