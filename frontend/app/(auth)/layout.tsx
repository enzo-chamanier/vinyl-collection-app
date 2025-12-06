import type React from "react"
import { PWAInstallGate } from "@/components/pwa/pwa-install-gate"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PWAInstallGate>
      <div className="min-h-screen bg-background">{children}</div>
    </PWAInstallGate>
  )
}
