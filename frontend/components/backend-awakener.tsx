"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export function BackendAwakener({ children }: { children: React.ReactNode }) {
    const [isAwake, setIsAwake] = useState(false)

    useEffect(() => {
        const checkBackend = async () => {
            try {
                // We use a simple fetch here to avoid the api wrapper's error handling 
                // which might log errors or redirect on 401 (though health shouldn't be protected)
                // But wait, api wrapper adds base URL. Let's use api.get but handle error gracefully.
                // Actually, let's just use the api wrapper to be consistent with base URL config.
                await api.get("/health")
                setIsAwake(true)
            } catch (error) {
                console.log("Backend sleeping, retrying...", error)
                setTimeout(checkBackend, 2000)
            }
        }

        checkBackend()
    }, [])

    if (!isAwake) {
        return <FullScreenLoader message="Démarrage de Discory..." />
    }

    return <>{children}</>
}
