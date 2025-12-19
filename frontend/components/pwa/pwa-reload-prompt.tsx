"use client"

import { useEffect, useState } from "react"

export function PWAReloadPrompt() {
    const [needRefresh, setNeedRefresh] = useState(false)

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            window.workbox !== undefined
        ) {
            const wb = window.workbox

            wb.addEventListener("waiting", () => {
                setNeedRefresh(true)
            })

            wb.addEventListener("externalwaiting", () => {
                setNeedRefresh(true)
            })
        }
    }, [])

    const reloadPage = () => {
        if (window.workbox) {
            window.workbox.messageSkipWaiting()
            window.workbox.addEventListener("controlling", () => {
                window.location.reload()
            })
        } else {
            window.location.reload()
        }
    }

    if (!needRefresh) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-surface border border-border rounded-lg shadow-lg p-4 flex items-center justify-between gap-4 max-w-sm">
                <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">Mise à jour disponible</h3>
                    <p className="text-text-secondary text-xs mt-1">
                        L'application a été mise à jour, en appuyant sur ok, vous aurez accès à cette nouvelle version.
                    </p>
                </div>
                <button
                    onClick={reloadPage}
                    className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-2 rounded transition whitespace-nowrap"
                >
                    OK
                </button>
            </div>
        </div>
    )
}

// Add type definition for window.workbox
declare global {
    interface Window {
        workbox: any
    }
}
