"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MobileNav } from "./mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { PWAInstallGate } from "@/components/pwa/pwa-install-gate"
import { useNetworkStatus } from "@/hooks/use-network-status"

import { useEffect } from "react" // Added import

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isOnline = useNetworkStatus()

  useEffect(() => {
    if (!isOnline && pathname !== "/dashboard") {
      router.replace("/dashboard")
    }
  }, [isOnline, pathname, router])

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

  // If redirecting, don't show content
  if (!isOnline && pathname !== "/dashboard") {
    return null
  }

  return (
    <PWAInstallGate>
      <div className="min-h-screen flex flex-col">
        {/* Header - Always Dark */}
        <header className="hidden md:block bg-neutral-950 border-b border-neutral-800 fixed top-0 w-full z-50">
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
              {isOnline && <NotificationBell />}
              {isOnline && navItems.map((item) => (
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

        {/* Mobile Top Bar - visible only on mobile, scrolls with content */}
        <div className="md:hidden h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Discory Logo" className="w-8 h-8 invert" />
            <span className="font-bold text-xl text-white">Discory</span>
          </div>
          {isOnline && <NotificationBell />}
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-background pb-16 md:pb-0 app-main">
          <div className="max-w-7xl mx-auto px-4 py-4">{children}</div>
        </main>

        <MobileNav />

        {/* Footer */}
        <footer className="bg-neutral-950 border-t border-neutral-800 mt-12 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-neutral-400 text-sm">
            © 2025 Discory. Construisez votre collection, partagez votre passion.
          </div>
        </footer>
      </div>
    </PWAInstallGate>
  )
}
