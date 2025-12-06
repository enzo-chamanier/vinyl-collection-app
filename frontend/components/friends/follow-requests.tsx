"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Check, X, User } from "lucide-react"
import Link from "next/link"

interface Request {
    id: string
    username: string
    profile_picture?: string
}

export function FollowRequests() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await api.get("/followers/requests/pending")
            setRequests(res)
        } catch (error) {
            console.error("Error fetching requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (followerId: string) => {
        try {
            await api.post(`/followers/accept/${followerId}`, {})
            setRequests(prev => prev.filter(r => r.id !== followerId))
        } catch (error) {
            console.error("Error accepting request:", error)
        }
    }

    const handleReject = async (followerId: string) => {
        try {
            await api.post(`/followers/reject/${followerId}`, {})
            setRequests(prev => prev.filter(r => r.id !== followerId))
        } catch (error) {
            console.error("Error rejecting request:", error)
        }
    }

    if (loading) return null
    if (requests.length === 0) return null

    return (
        <div className="mb-12">
            <h2 className="text-2xl text-primary font-bold mb-6">Demandes d'abonnés</h2>
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
                            <span className="font-bold text-foreground">{request.username}</span>
                        </Link>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAccept(request.id)}
                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-full transition-colors"
                                title="Accepter"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                onClick={() => handleReject(request.id)}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
                                title="Refuser"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
