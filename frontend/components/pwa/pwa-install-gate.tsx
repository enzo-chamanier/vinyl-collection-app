"use client"

import { useState, useEffect, ReactNode } from "react"
import { Smartphone, Share, Plus, MoreVertical, Download } from "lucide-react"

interface PWAInstallGateProps {
    children: ReactNode
}

export function PWAInstallGate({ children }: PWAInstallGateProps) {
    const [showGate, setShowGate] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") return

        const checkPWA = () => {
            // Detect mobile by user agent only
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

            // Detect standalone mode (PWA installed)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone === true

            // Detect iOS (for instructions)
            const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
            setIsIOS(iOS)

            // If mobile AND not standalone → show gate
            if (isMobile && !isStandalone) {
                setShowGate(true)
            }

            setIsLoading(false)
        }

        checkPWA()
    }, [])

    // Show nothing while checking
    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Show gate if needed
    if (showGate) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
                {/* Header */}
                <div className="p-6 text-center border-b border-neutral-800">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <img src="/logo.png" alt="Discory" className="w-10 h-10 invert" />
                        <h1 className="text-2xl font-bold">Discory</h1>
                    </div>
                    <p className="text-neutral-400 text-sm">Votre collection de vinyles</p>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                    <div className="bg-neutral-900 rounded-2xl p-6 max-w-sm w-full border border-neutral-800">
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <Smartphone className="w-8 h-8 text-primary" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-center mb-2">
                            Installez l'application
                        </h2>
                        <p className="text-neutral-400 text-center text-sm mb-6">
                            Pour une meilleure expérience, ajoutez Discory à votre écran d'accueil.
                        </p>

                        {isIOS ? (
                            // iOS Instructions
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-neutral-300 uppercase tracking-wide">
                                    Instructions pour iOS
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 bg-neutral-800/50 rounded-lg p-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-blue-400 font-bold text-sm">1</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                Appuyez sur le bouton <strong>Partager</strong>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-blue-400">
                                                <Share className="w-5 h-5" />
                                                <span className="text-xs">(carré avec flèche vers le haut)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-neutral-800/50 rounded-lg p-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-blue-400 font-bold text-sm">2</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-blue-400">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-neutral-800/50 rounded-lg p-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-blue-400 font-bold text-sm">3</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                Appuyez sur <strong>"Ajouter"</strong> pour confirmer
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Android Instructions
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-neutral-300 uppercase tracking-wide">
                                    Instructions pour Android
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 bg-neutral-800/50 rounded-lg p-3">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-green-400 font-bold text-sm">1</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                Appuyez sur le <strong>menu</strong> (trois points)
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-green-400">
                                                <MoreVertical className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-neutral-800/50 rounded-lg p-3">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-green-400 font-bold text-sm">2</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                Appuyez sur <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-green-400">
                                                <Download className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-neutral-800/50 rounded-lg p-3">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-green-400 font-bold text-sm">3</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                Confirmez l'installation
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-neutral-500 text-xs text-center mt-6 max-w-xs">
                        Une fois installée, ouvrez l'application depuis votre écran d'accueil pour profiter de toutes les fonctionnalités.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 text-center border-t border-neutral-800">
                    <p className="text-neutral-500 text-xs">
                        © 2025 Discory
                    </p>
                </div>
            </div>
        )
    }

    // Show children if PWA or desktop
    return <>{children}</>
}
