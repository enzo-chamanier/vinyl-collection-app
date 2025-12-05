"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/lib/hooks/use-auth"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function RegisterPage() {
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
          <h1 className="text-4xl font-bold text-primary mb-2">Discory</h1>
          <p className="text-text-secondary">Rejoignez nous et commencez à organiser votre collection de vinyles</p>
        </div>

        <AuthForm type="register" />

        <p className="text-center mt-6 text-text-secondary">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  )
}
