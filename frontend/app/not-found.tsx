import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-text-secondary mb-6">Page not found</p>
        <Link
          href="/dashboard"
          className="inline-block bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
