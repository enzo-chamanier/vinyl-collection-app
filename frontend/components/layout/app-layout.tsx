"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MobileNav } from "./mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

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
      {/* Header - Always Dark */}
      <header className="bg-neutral-950 border-b border-neutral-800 md:sticky md:top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Discory Logo" className="w-8 h-8 invert" />
            <Link href="/dashboard" className="text-xl font-bold text-white">
              Discory
            </Link>
          </div>

          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="md:hidden text-neutral-400 hover:text-white"
            title="Se déconnecter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <NotificationBell />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-semibold transition ${isActive(item.href) ? "text-white" : "text-neutral-400 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-gray-200 text-black font-semibold px-4 py-2 rounded-lg transition"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-background pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
      </main>

      <MobileNav />

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 mt-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-neutral-400 text-sm">
          © 2025 Discory. Construisez votre collection, partagez votre passion.
        </div>
      </footer>
    </div>
  )
}
