import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { PWAReloadPrompt } from "@/components/pwa/pwa-reload-prompt"
import { ThemeProvider } from "@/components/theme-provider"
import { BackendAwakener } from "@/components/backend-awakener"
import { ServiceWorkerRegister } from "@/components/service-worker-register"

import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Discory - Ta collection de vinyles & cd, organisée",
  description: "Organise et gère ta collection de vinyles & cd avec Discory.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Discory",
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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/logo-white.png" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" media="(prefers-color-scheme: light)" />
        <link rel="manifest" href="/manifest-dark.json" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BackendAwakener>
            {children}
          </BackendAwakener>
        </ThemeProvider>
        <PWAReloadPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
