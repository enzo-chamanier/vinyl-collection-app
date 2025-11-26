"use client"
import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="VinylStack Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-primary mb-2">VinylStack</h1>
          <p className="text-text-secondary">Ta collection de vinyles, organisée</p>
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
