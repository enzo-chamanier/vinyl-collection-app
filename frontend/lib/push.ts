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

export async function subscribeUserToPush() {
    if (!publicVapidKey) {
        console.error("Public VAPID key is missing")
        return
    }

    if (!("serviceWorker" in navigator)) {
        console.error("Service Worker not supported")
        return
    }

    try {
        await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
        })

        const register = await navigator.serviceWorker.ready

        const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        })

        await api.post("/notifications/subscribe", subscription)
        console.log("Push Notification Subscribed")
        return true
    } catch (error) {
        console.error("Push Notification Subscription Failed", error)
        return false
    }
}
