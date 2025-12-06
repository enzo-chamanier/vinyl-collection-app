self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: "/logo.png", // Use standard logo or adapt based on some logic if needed
            badge: "/logo.png", // Small monochrome icon for Android status bar
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: "2",
                url: data.url,
            },
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})

self.addEventListener("notificationclick", function (event) {
    console.log("Notification click received.")
    event.notification.close()
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    )
})
