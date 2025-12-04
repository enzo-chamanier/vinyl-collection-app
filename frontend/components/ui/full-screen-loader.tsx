"use client"

import { Disc } from "lucide-react"

interface FullScreenLoaderProps {
    message?: string
}

export function FullScreenLoader({ message = "Chargement..." }: FullScreenLoaderProps) {
    return (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />

                {/* Inner vinyl icon */}
                <div className="relative bg-black rounded-full p-4 shadow-2xl shadow-primary/20 animate-[spin_3s_linear_infinite]">
                    <Disc size={64} className="text-secondary" />
                    {/* Visual cue for rotation (reflection) */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[0.5px]" />
                </div>
            </div>

            <p className="mt-6 text-lg font-medium text-black animate-pulse">
                {message}
            </p>
        </div>
    )
}
