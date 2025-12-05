"use client"

import Link from "next/link"
import {  Lock, Globe } from "lucide-react"

interface ProfilePreviewCardProps {
    profile: {
        id: string
        username: string
        profile_picture?: string
        bio?: string
        is_public?: boolean
        vinyl_count?: number
    }
}

export function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
    return (
        <Link href={`/profile/view?username=${profile.username}`} className="block group">
            <div className="bg-surface rounded-xl p-4 border border-border hover:border-primary/50 transition-all hover:bg-surface/80 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                    {profile.profile_picture ? (
                        <img
                            src={profile.profile_picture}
                            alt={profile.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center text-white font-bold text-xl">
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-border">
                        {profile.is_public !== false ? (
                            <Globe size={12} className="text-green-400" />
                        ) : (
                            <Lock size={12} className="text-orange-400" />
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-lg truncate group-hover:text-primary transition-colors">
                            {profile.username}
                        </h3>
                    </div>

                    <p className="text-text-secondary text-sm line-clamp-2 mb-2">
                        {profile.bio || "Pas de bio disponible."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-white">{profile.vinyl_count || 0}</span>
                            <span>vinyles</span>
                        </div>
                        {profile.is_public !== false && (
                            <span className="text-green-400/80 bg-green-400/10 px-1.5 py-0.5 rounded">
                                Profil Public
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
