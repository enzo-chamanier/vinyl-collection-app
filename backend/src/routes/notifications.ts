import { Router, type Response } from "express";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

// Get user notifications (with pagination)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM notifications WHERE recipient_id = $1`,
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query(
            `SELECT n.id, n.type, n.reference_id, n.is_read, n.created_at, n.sender_id,
                    u.username as sender_username, u.profile_picture as sender_profile_picture,
                    EXISTS(
                        SELECT 1 FROM follows f 
                        WHERE f.follower_id = $1 AND f.following_id = n.sender_id AND f.status = 'accepted'
                    ) as is_following_back,
                    EXISTS(
                        SELECT 1 FROM follows f 
                        WHERE f.follower_id = n.sender_id AND f.following_id = $1 AND f.status = 'accepted'
                    ) as has_accepted_request,
                    CASE WHEN n.type = 'VINYL_COMMENT' THEN c.vinyl_id ELSE NULL END as vinyl_id
             FROM notifications n
             LEFT JOIN users u ON n.sender_id = u.id
             LEFT JOIN comments c ON n.type = 'VINYL_COMMENT' AND n.reference_id = c.id
             WHERE n.recipient_id = $1
             ORDER BY n.created_at DESC, n.id DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        return res.json({
            data: result.rows,
            hasMore: offset + result.rows.length < total,
            total
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
});

// Mark notification as read
router.put("/:id/read", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        await query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2",
            [id, userId]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
    }
});

// Mark all as read
router.put("/read-all", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        await query(
            "UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1",
            [userId]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de la mise à jour des notifications" });
    }
});

// Get unread count
router.get("/unread-count", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        const result = await query(
            "SELECT COUNT(*)::int as count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE",
            [userId]
        );

        return res.json({ count: result.rows[0].count });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors du comptage des notifications" });
    }
});

// Subscribe to push notifications
router.post("/subscribe", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const subscription = req.body;

        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });
        if (!subscription || !subscription.endpoint) return res.status(400).json({ error: "Subscription invalide" });

        await query(
            `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, endpoint) DO NOTHING`,
            [
                require("uuid").v4(),
                userId,
                subscription.endpoint,
                subscription.keys.p256dh,
                subscription.keys.auth
            ]
        );

        return res.status(201).json({ message: "Subscription added" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de l'abonnement push" });
    }
});

export default router;
