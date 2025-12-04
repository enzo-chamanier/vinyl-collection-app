"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"

export default function RootPage() {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard")
        } else if (!loading && !user) {
            router.push("/login")
        } 
    }, [user, loading, router])

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
    )
}
