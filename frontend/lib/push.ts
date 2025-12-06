import { api } from "./api"

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    )
}

// Check current permission status
export function getPushPermissionStatus(): NotificationPermission | "unsupported" {
    if (!isPushSupported()) return "unsupported"
    return Notification.permission
}

// Request notification permission (iOS requires user gesture)
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
    if (!isPushSupported()) {
        console.error("Push notifications not supported")
        return null
    }

    try {
        // Request permission - this MUST be called from a user gesture on iOS
        const permission = await Notification.requestPermission()
        console.log("Notification permission:", permission)
        return permission
    } catch (error) {
        console.error("Error requesting notification permission:", error)
        return null
    }
}

// Subscribe user to push notifications
export async function subscribeUserToPush(): Promise<boolean> {
    if (!publicVapidKey) {
        console.error("Public VAPID key is missing")
        return false
    }

    if (!isPushSupported()) {
        console.error("Push notifications not supported on this device")
        return false
    }

    try {
        // First, check/request permission
        let permission = Notification.permission

        if (permission === "default") {
            permission = await Notification.requestPermission()
        }

        if (permission !== "granted") {
            console.log("Notification permission denied or dismissed")
            return false
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
        })

        console.log("Service Worker registered:", registration)

        // Wait for service worker to be ready
        const swRegistration = await navigator.serviceWorker.ready
        console.log("Service Worker ready:", swRegistration)

        // Check for existing subscription
        let subscription = await swRegistration.pushManager.getSubscription()

        if (subscription) {
            console.log("Existing push subscription found, reusing...")
        } else {
            // Create new subscription
            subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            })
            console.log("New push subscription created")
        }

        // Send subscription to backend
        await api.post("/notifications/subscribe", subscription)
        console.log("Push Notification Subscribed successfully")
        return true

    } catch (error: any) {
        console.error("Push Notification Subscription Failed:", error)

        // Specific error handling
        if (error.name === "NotAllowedError") {
            console.error("Permission was denied")
        } else if (error.name === "AbortError") {
            console.error("Subscription was aborted")
        }

        return false
    }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            await subscription.unsubscribe()
            console.log("Unsubscribed from push notifications")
            return true
        }

        return false
    } catch (error) {
        console.error("Error unsubscribing from push:", error)
        return false
    }
}
