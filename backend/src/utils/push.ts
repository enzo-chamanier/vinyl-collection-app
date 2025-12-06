import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (!publicVapidKey || !privateVapidKey || !vapidEmail) {
    console.error("VAPID keys or email missing in environment variables");
} else {
    webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
}

export const sendPushNotification = async (subscription: webpush.PushSubscription, payload: string) => {
    try {
        await webpush.sendNotification(subscription, payload);
    } catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
};

export default webpush;
