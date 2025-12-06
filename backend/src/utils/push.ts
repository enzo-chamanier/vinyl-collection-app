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
    } catch (error: any) {
        console.error("Error sending push notification:", error);

        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log("Subscription expired or invalid, removing from DB...");
            // We need to remove this subscription from the database.
            // Since this utility function might not have direct access to the DB logic easily without circular deps or passing the pool,
            // we will throw a specific error or handle it if we import the pool.
            // Let's import the pool here to delete it.
            try {
                const { pool } = require("../config/initDatabase");
                // The subscription object has an endpoint we can use to identify it.
                await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [subscription.endpoint]);
                console.log("Deleted invalid subscription:", subscription.endpoint);
            } catch (dbError) {
                console.error("Failed to delete invalid subscription:", dbError);
            }
        }
    }
};

export default webpush;
