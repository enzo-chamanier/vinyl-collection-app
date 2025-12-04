import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { PWAReloadPrompt } from "@/components/pwa/pwa-reload-prompt"

import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VinylStack - Ta collection de vinyles, organisée",
  description: "Organise et gère ta collection de vinyles avec VinylStack.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VinylStack",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        {children}
        <PWAReloadPrompt />
      </body>
    </html>
  )
}
