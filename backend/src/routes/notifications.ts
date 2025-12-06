import { Router, type Response } from "express";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

// Get user notifications
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        const result = await query(
            `SELECT n.id, n.type, n.reference_id, n.is_read, n.created_at,
                    u.username as sender_username, u.profile_picture as sender_profile_picture
             FROM notifications n
             JOIN users u ON n.sender_id = u.id
             WHERE n.recipient_id = $1
             ORDER BY n.created_at DESC
             LIMIT 50`,
            [userId]
        );

        return res.json(result.rows);
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

export default router;
