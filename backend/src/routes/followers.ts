import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { sendPushNotification } from "../utils/push";

const router = Router();

// --- Follow user ---
router.post("/follow/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.userId;
    if (!followerId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    if (userId === followerId) {
      return res.status(400).json({ error: "Vous ne pouvez pas vous suivre vous-même" });
    }

    const existingFollowRes = await query(
      "SELECT id, status FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    if (existingFollowRes.rows.length > 0) {
      return res.status(409).json({ error: "Vous suivez déjà cet utilisateur ou une demande est en attente" });
    }

    // Check if target user is public
    const targetUserRes = await query("SELECT is_public FROM users WHERE id = $1", [userId]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const isPublic = targetUserRes.rows[0].is_public;
    const status = isPublic ? 'accepted' : 'pending';

    const followId = uuidv4();
    await query(
      "INSERT INTO follows (id, follower_id, following_id, status) VALUES ($1, $2, $3, $4)",
      [followId, followerId, userId, status]
    );

    // Notify target user
    const notificationType = status === 'accepted' ? "NEW_FOLLOWER" : "FOLLOW_REQUEST";
    await query(
      "INSERT INTO notifications (id, recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4, $5)",
      [uuidv4(), userId, followerId, notificationType, followerId]
    );

    // Send Push Notification
    const subscriptions = await query("SELECT * FROM push_subscriptions WHERE user_id = $1", [userId]);
    const senderRes = await query("SELECT username FROM users WHERE id = $1", [followerId]);
    const senderName = senderRes.rows[0]?.username || "Quelqu'un";

    const payload = JSON.stringify({
      title: status === 'accepted' ? "Nouvel abonné !" : "Demande de suivi",
      body: status === 'accepted' ? `${senderName} vous suit maintenant.` : `${senderName} souhaite vous suivre.`,
      url: `/profile/${senderName}`
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
      req.io.to(`user_${userId}`).emit("notification", {
        title: status === 'accepted' ? "Nouvel abonné !" : "Demande de suivi",
        body: status === 'accepted' ? `${senderName} vous suit maintenant.` : `${senderName} souhaite vous suivre.`,
        url: `/profile/${senderName}`
      });
    }

    return res.status(201).json({
      message: status === 'accepted' ? "Suivi avec succès" : "Demande de suivi envoyée",
      status
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors du suivi" });
  }
});

// ... (rest of the file until accept)

// --- Accept follow request ---
router.post("/accept/:followerId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { followerId } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    await query(
      "UPDATE follows SET status = 'accepted' WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    // Notify the follower that their request was accepted
    await query(
      "INSERT INTO notifications (id, recipient_id, sender_id, type, reference_id) VALUES ($1, $2, $3, $4, $5)",
      [uuidv4(), followerId, userId, "FOLLOW_ACCEPTED", userId]
    );

    // Send Push Notification
    const subscriptions = await query("SELECT * FROM push_subscriptions WHERE user_id = $1", [followerId]);
    const senderRes = await query("SELECT username FROM users WHERE id = $1", [userId]);
    const senderName = senderRes.rows[0]?.username || "Quelqu'un";

    const payload = JSON.stringify({
      title: "Demande acceptée !",
      body: `${senderName} a accepté votre demande de suivi.`,
      url: `/profile/${senderName}`
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
      req.io.to(`user_${followerId}`).emit("notification", {
        title: "Demande acceptée !",
        body: `${senderName} a accepté votre demande de suivi.`,
        url: `/profile/${senderName}`
      });
    }

    return res.json({ message: "Demande acceptée" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'acceptation de la demande" });
  }
});

// --- Unfollow user ---
router.delete("/unfollow/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.userId;
    if (!followerId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    await query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    return res.json({ message: "Non suivi avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors du non-suivi" });
  }
});

// --- Get followers (only accepted) ---
router.get("/followers/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followersRes = await query(
      `SELECT u.id, u.username, u.profile_picture 
        FROM users u
        INNER JOIN follows f ON u.id = f.follower_id
        WHERE f.following_id = $1 AND f.status = 'accepted'`,
      [userId]
    );
    return res.json(followersRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des followers" });
  }
});

// --- Get following (only accepted) ---
router.get("/following/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followingRes = await query(
      `SELECT u.id, u.username, u.profile_picture, u.bio, u.is_public, COUNT(v.id) AS vinyl_count
        FROM users u
        INNER JOIN follows f ON u.id = f.following_id
        LEFT JOIN vinyls v ON u.id = v.user_id
        WHERE f.follower_id = $1 AND f.status = 'accepted'
        GROUP BY u.id, u.bio, u.is_public`,
      [userId]
    );
    return res.json(followingRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération de la liste de suivi" });
  }
});

// --- Get followers and following count (only accepted) ---
router.get("/count/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const followersRes = await query(
      "SELECT COUNT(*) AS count FROM follows WHERE following_id = $1 AND status = 'accepted'",
      [userId]
    );
    const followingRes = await query(
      "SELECT COUNT(*) AS count FROM follows WHERE follower_id = $1 AND status = 'accepted'",
      [userId]
    );

    return res.status(200).json({
      followers: parseInt(followersRes.rows[0]?.count ?? "0"),
      following: parseInt(followingRes.rows[0]?.count ?? "0"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
  }
});

// --- Search users ---
router.get("/search/:searchQuery", async (req: AuthRequest, res: Response) => {
  try {
    const { searchQuery } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Récupère l'id de l'utilisateur courant depuis req.user
    const currentUserId = req.user?.userId;

    const usersRes = await query(
      `SELECT id, username, profile_picture, bio, is_public 
        FROM users 
        WHERE (username ILIKE $1 OR bio ILIKE $2) ${currentUserId ? "AND id != $5" : ""}
        LIMIT $3 OFFSET $4`,
      currentUserId
        ? [`%${searchQuery}%`, `%${searchQuery}%`, limit, offset, currentUserId]
        : [`%${searchQuery}%`, `%${searchQuery}%`, limit, offset]
    );

    return res.json(usersRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});

// --- Get feed (with pagination) ---
router.get("/feed/recent", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    if (!followerId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)
       FROM vinyls v
       INNER JOIN users u ON v.user_id = u.id
       INNER JOIN follows f ON u.id = f.following_id
       WHERE f.follower_id = $1 AND f.status = 'accepted'`,
      [followerId]
    );
    const total = parseInt(countResult.rows[0].count);

    const feedRes = await query(
      `SELECT v.*, u.username, u.profile_picture,
        (SELECT COUNT(*) FROM likes WHERE vinyl_id = v.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE vinyl_id = v.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE vinyl_id = v.id AND user_id = $1) AS has_liked
       FROM vinyls v
       INNER JOIN users u ON v.user_id = u.id
       INNER JOIN follows f ON u.id = f.following_id
       WHERE f.follower_id = $1 AND f.status = 'accepted'
       ORDER BY v.date_added DESC, v.id DESC
       LIMIT $2 OFFSET $3`,
      [followerId, limit, offset]
    );

    return res.json({
      data: feedRes.rows,
      hasMore: offset + feedRes.rows.length < total,
      total
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération du flux" });
  }
});

// --- Check if following ---
router.get("/is-following/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.userId;
    if (!followerId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const existingFollowRes = await query(
      "SELECT status FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    const isFollowedByRes = await query(
      "SELECT status FROM follows WHERE follower_id = $1 AND following_id = $2",
      [userId, followerId]
    );

    const isFollowedBy = isFollowedByRes.rows.length > 0 && isFollowedByRes.rows[0].status === 'accepted';

    if (existingFollowRes.rows.length > 0) {
      const status = existingFollowRes.rows[0].status;
      return res.json({
        isFollowing: status === 'accepted',
        isPending: status === 'pending',
        isFollowedBy,
        status
      });
    }

    return res.json({ isFollowing: false, isPending: false, isFollowedBy, status: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la vérification du suivi" });
  }
});

// --- Get pending requests ---
router.get("/requests/pending", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const requestsRes = await query(
      `SELECT u.id, u.username, u.profile_picture 
       FROM users u
       INNER JOIN follows f ON u.id = f.follower_id
       WHERE f.following_id = $1 AND f.status = 'pending'`,
      [userId]
    );

    return res.json(requestsRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des demandes" });
  }
});

// --- Get sent pending requests ---
router.get("/requests/sent", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const requestsRes = await query(
      `SELECT u.id, u.username, u.profile_picture 
       FROM users u
       INNER JOIN follows f ON u.id = f.following_id
       WHERE f.follower_id = $1 AND f.status = 'pending'`,
      [userId]
    );

    return res.json(requestsRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des demandes envoyées" });
  }
});



// --- Reject follow request ---
router.post("/reject/:followerId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { followerId } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    await query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    return res.json({ message: "Demande rejetée" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors du rejet de la demande" });
  }
});


export default router;
