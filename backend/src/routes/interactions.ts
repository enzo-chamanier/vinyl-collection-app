import { Router, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { sendPushNotification } from "../utils/push";

const router = Router();

// --- Likes ---

// Toggle like
router.post("/likes/:vinylId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { vinylId } = req.params;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        // Check if already liked
        const existingLike = await query(
            "SELECT id FROM likes WHERE user_id = $1 AND vinyl_id = $2",
            [userId, vinylId]
        );

        if (existingLike.rows.length > 0) {
            // Unlike
            await query(
                "DELETE FROM likes WHERE user_id = $1 AND vinyl_id = $2",
                [userId, vinylId]
            );
            return res.json({ liked: false });
        } else {
            // Like
            const likeId = uuidv4();
            await query(
                "INSERT INTO likes (id, user_id, vinyl_id) VALUES ($1, $2, $3)",
                [likeId, userId, vinylId]
            );

            // Notify vinyl owner
            const vinylRes = await query("SELECT user_id, title FROM vinyls WHERE id = $1", [vinylId]);
            if (vinylRes.rows.length > 0) {
                const ownerId = vinylRes.rows[0].user_id;
                const vinylTitle = vinylRes.rows[0].title;

                if (ownerId !== userId) {
                    await query(
                        "INSERT INTO notifications (id, recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4, $5)",
                        [uuidv4(), ownerId, userId, "VINYL_LIKE", vinylId]
                    );

                    // Send Push Notification
                    const subscriptions = await query("SELECT * FROM push_subscriptions WHERE user_id = $1", [ownerId]);
                    const senderRes = await query("SELECT username FROM users WHERE id = $1", [userId]);
                    const senderName = senderRes.rows[0]?.username || "Quelqu'un";

                    const payload = JSON.stringify({
                        title: "Nouveau like !",
                        body: `${senderName} a aimé votre vinyle "${vinylTitle}".`,
                        url: `/vinyl/${vinylId}`
                    });

                    for (const sub of subscriptions.rows) {
                        try {
                            await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
                        } catch (err) {
                            console.error("Failed to send push", err);
                        }
                    }

                    // Emit socket event
                    if (req.io) {
                        req.io.to(`user_${ownerId}`).emit("notification", {
                            title: "Nouveau like !",
                            body: `${senderName} a aimé votre vinyle "${vinylTitle}".`,
                            url: `/vinyl/${vinylId}`
                        });
                    }
                }
            }

            return res.json({ liked: true });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors du like" });
    }
});

// --- Comments ---

// Get comments for a vinyl
router.get("/comments/:vinylId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { vinylId } = req.params;
        const userId = req.user?.userId;

        const commentsRes = await query(
            `SELECT c.id, c.content, c.created_at, u.username, u.profile_picture, c.user_id, c.parent_id,
        (SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = c.id) AS likes_count,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) AS has_liked
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.vinyl_id = $1
       ORDER BY c.created_at ASC`,
            [vinylId, userId]
        );
        return res.json(commentsRes.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de la récupération des commentaires" });
    }
});

// Add a comment
router.post("/comments/:vinylId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { vinylId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });
        if (!content) return res.status(400).json({ error: "Contenu requis" });

        const commentId = uuidv4();
        await query(
            "INSERT INTO comments (id, user_id, vinyl_id, content, parent_id) VALUES ($1, $2, $3, $4, $5)",
            [commentId, userId, vinylId, content, parentId || null]
        );

        // Return the new comment with user info
        const newCommentRes = await query(
            `SELECT c.id, c.content, c.created_at, u.username, u.profile_picture, c.user_id, c.parent_id,
        0 AS likes_count,
        false AS has_liked
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
            [commentId]
        );

        // Notify vinyl owner
        const vinylRes = await query("SELECT user_id FROM vinyls WHERE id = $1", [vinylId]);
        if (vinylRes.rows.length > 0) {
            const ownerId = vinylRes.rows[0].user_id;
            if (ownerId !== userId) {
                await query(
                    "INSERT INTO notifications (id, recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4, $5)",
                    [uuidv4(), ownerId, userId, "VINYL_COMMENT", vinylId]
                );

                // Send Push Notification
                const subscriptions = await query("SELECT * FROM push_subscriptions WHERE user_id = $1", [ownerId]);
                const senderRes = await query("SELECT username FROM users WHERE id = $1", [userId]);
                const senderName = senderRes.rows[0]?.username || "Quelqu'un";

                const payload = JSON.stringify({
                    title: "Nouveau commentaire !",
                    body: `${senderName} a commenté votre vinyle.`,
                    url: `/vinyl/${vinylId}`
                });

                for (const sub of subscriptions.rows) {
                    try {
                        await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
                    } catch (err) {
                        console.error("Failed to send push", err);
                    }
                }

                // Emit socket event
                if (req.io) {
                    req.io.to(`user_${ownerId}`).emit("notification", {
                        title: "Nouveau commentaire !",
                        body: `${senderName} a commenté votre vinyle.`,
                        url: `/vinyl/${vinylId}`
                    });
                }
            }
        }

        return res.status(201).json(newCommentRes.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de l'ajout du commentaire" });
    }
});

// Delete a comment
router.delete("/comments/:commentId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        // Check ownership
        const commentRes = await query("SELECT user_id FROM comments WHERE id = $1", [commentId]);
        if (commentRes.rows.length === 0) return res.status(404).json({ error: "Commentaire non trouvé" });

        if (commentRes.rows[0].user_id !== userId) {
            return res.status(403).json({ error: "Non autorisé" });
        }

        await query("DELETE FROM comments WHERE id = $1", [commentId]);
        return res.json({ message: "Commentaire supprimé" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors de la suppression du commentaire" });
    }
});

// --- Comment Likes ---

// Toggle comment like
router.post("/comments/:commentId/like", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

        // Check if already liked
        const existingLike = await query(
            "SELECT id FROM comment_likes WHERE user_id = $1 AND comment_id = $2",
            [userId, commentId]
        );

        if (existingLike.rows.length > 0) {
            // Unlike
            await query(
                "DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2",
                [userId, commentId]
            );
            return res.json({ liked: false });
        } else {
            // Like
            const likeId = uuidv4();
            await query(
                "INSERT INTO comment_likes (id, user_id, comment_id) VALUES ($1, $2, $3)",
                [likeId, userId, commentId]
            );

            // Notify comment author
            const commentRes = await query("SELECT user_id FROM comments WHERE id = $1", [commentId]);
            if (commentRes.rows.length > 0) {
                const authorId = commentRes.rows[0].user_id;
                if (authorId !== userId) {
                    await query(
                        "INSERT INTO notifications (id, recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4, $5)",
                        [uuidv4(), authorId, userId, "COMMENT_LIKE", commentId]
                    );

                    // Send Push Notification
                    const subscriptions = await query("SELECT * FROM push_subscriptions WHERE user_id = $1", [authorId]);
                    const senderRes = await query("SELECT username FROM users WHERE id = $1", [userId]);
                    const senderName = senderRes.rows[0]?.username || "Quelqu'un";



                    // We need vinyl_id for the URL. Let's fetch it.
                    const vinylIdRes = await query("SELECT vinyl_id FROM comments WHERE id = $1", [commentId]);
                    const vinylId = vinylIdRes.rows[0]?.vinyl_id;
                    const pushPayload = JSON.stringify({
                        title: "Nouveau like !",
                        body: `${senderName} a aimé votre commentaire.`,
                        url: vinylId ? `/vinyl/${vinylId}` : "/"
                    });

                    for (const sub of subscriptions.rows) {
                        try {
                            await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, pushPayload);
                        } catch (err) {
                            console.error("Failed to send push", err);
                            // Optional: Delete invalid subscription
                        }
                    }

                    // Emit socket event
                    if (req.io) {
                        req.io.to(`user_${authorId}`).emit("notification", {
                            title: "Nouveau like !",
                            body: `${senderName} a aimé votre commentaire.`,
                            url: vinylId ? `/vinyl/${vinylId}` : "/"
                        });
                    }
                }
            }

            return res.json({ liked: true });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur lors du like du commentaire" });
    }
});

export default router;
