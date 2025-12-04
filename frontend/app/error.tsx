"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Oups!</h1>
        <p className="text-text-secondary mb-6">Une erreur est survenue</p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded transition"
          >
            Reessayer
          </button>
          <Link
            href="/dashboard"
            className="block bg-surface hover:bg-surface/80 text-text-primary font-semibold py-3 rounded transition border border-border"
          >
            Retour à la collection
          </Link>
        </div>
      </div>
    </div>
  )
}
