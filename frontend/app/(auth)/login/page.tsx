"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/lib/hooks/use-auth"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth(false)

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <FullScreenLoader />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Discory Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-primary mb-2">Discory</h1>
          <p className="text-text-secondary">Ta collection de vinyles & cd, organisée</p>
        </div>

        <AuthForm type="login" />

        <p className="text-center mt-6 text-text-secondary">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Créez-en un
          </Link>
        </p>
      </div>
    </div>
  )
}
