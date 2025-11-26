"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: "/dashboard", label: "Collection" },
    { href: "/feed", label: "Fil d'actualité" },
    { href: "/analytics", label: "Statistiques" },
    { href: "/scan", label: "Ajouter" },
    { href: "/friends", label: "Amis" },
    { href: "/profile", label: "Profil" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="VinylStack Logo" className="w-8 h-8" />
            <Link href="/dashboard" className="text-xl font-bold text-white">
              VinylStack
            </Link>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-semibold transition ${
                  isActive(item.href) ? "text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-white/90 text-black font-semibold px-4 py-2 rounded transition"
            >
              Déconnexion
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-text-primary">
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-surface border-t border-border px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block font-semibold text-text-primary hover:text-primary transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded transition mt-2"
            >
              Déconnexion
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-text-secondary text-sm">
          © 2025 VinylStack. Construisez votre collection, partagez votre passion.
        </div>
      </footer>
    </div>
  )
}
