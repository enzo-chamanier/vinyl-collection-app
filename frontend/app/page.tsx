"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function RootPage() {
    const router = useRouter()
    const { user, loading } = useAuth(false)

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard")
        } else if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    return (
        <FullScreenLoader message="Chargement de Discory..." />
    )
}
