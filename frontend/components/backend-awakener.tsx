"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { TopLoader } from "@/components/ui/top-loader"
import { useNetworkStatus } from "@/hooks/use-network-status"

export function BackendAwakener({ children }: { children: React.ReactNode }) {
    const [isAwake, setIsAwake] = useState(false)


    const isOnline = useNetworkStatus()

    useEffect(() => {
        const checkBackend = async () => {
            // If offline, we assume "awake" (local mode) immediately so we don't block
            if (!isOnline) {
                setIsAwake(true)
                return
            }

            try {
                // Determine if we need to wake up (simple health check)
                await api.get("/health")
                setIsAwake(true)
            } catch (error) {
                console.log("Backend sleeping (or network error), retrying...", error)
                setTimeout(checkBackend, 2000)
            }
        }

        // Only confirm awake if we haven't already
        if (!isAwake) {
            checkBackend()
        }
    }, [isAwake, isOnline])

    // Show top loader if not awake yet
    // Note: If offline, this might keep spinning. That's okay for now or we could check navigator.onLine
    // But user wants "Chargement de l'application" visual.

    return (
        <>
            <TopLoader visible={!isAwake} message="Démarrage de Discory..." />
            {children}
        </>
    )
}
