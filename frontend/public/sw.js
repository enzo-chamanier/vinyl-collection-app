// Service Worker for Discory PWA
// Handles push notifications and caching

// Install event - skip waiting to activate immediately
self.addEventListener("install", function (event) {
    console.log("[SW] Installing service worker...")
    self.skipWaiting()
})

// Activate event - claim all clients
self.addEventListener("activate", function (event) {
    console.log("[SW] Activating service worker...")
    event.waitUntil(clients.claim())
})

// Push notification event
self.addEventListener("push", function (event) {
    console.log("[SW] Push received:", event)

    if (event.data) {
        try {
            const data = event.data.json()
            const options = {
                body: data.body || "Nouvelle notification",
                icon: "/logo.png",
                badge: "/logo.png",
                vibrate: [100, 50, 100],
                tag: data.tag || "discory-notification",
                renotify: true,
                requireInteraction: false,
                data: {
                    dateOfArrival: Date.now(),
                    url: data.url || "/notifications",
                },
            }

            event.waitUntil(
                self.registration.showNotification(data.title || "Discory", options)
            )
        } catch (error) {
            console.error("[SW] Error parsing push data:", error)
            // Fallback for text data
            event.waitUntil(
                self.registration.showNotification("Discory", {
                    body: event.data.text() || "Nouvelle notification",
                    icon: "/logo.png",
                })
            )
        }
    }
})

// Notification click event
self.addEventListener("notificationclick", function (event) {
    console.log("[SW] Notification clicked:", event)
    event.notification.close()

    const urlToOpen = event.notification.data?.url || "/notifications"

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(urlToOpen)
                    return client.focus()
                }
            }
            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
        })
    )
})

// Notification close event (for analytics if needed)
self.addEventListener("notificationclose", function (event) {
    console.log("[SW] Notification closed:", event)
})
