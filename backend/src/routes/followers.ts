import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

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
      "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    if (existingFollowRes.rows.length > 0) {
      return res.status(409).json({ error: "Vous suivez déjà cet utilisateur" });
    }

    const followId = uuidv4();
    await query(
      "INSERT INTO follows (id, follower_id, following_id) VALUES ($1, $2, $3)",
      [followId, followerId, userId]
    );

    return res.status(201).json({ message: "Suivi avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors du suivi" });
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

// --- Get followers ---
router.get("/followers/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followersRes = await query(
      `SELECT u.id, u.username, u.profile_picture 
        FROM users u
        INNER JOIN follows f ON u.id = f.follower_id
        WHERE f.following_id = $1`,
      [userId]
    );
    return res.json(followersRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des followers" });
  }
});

// --- Get following ---
router.get("/following/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followingRes = await query(
      `SELECT u.id, u.username, u.profile_picture, COUNT(v.id) AS vinyl_count
        FROM users u
        INNER JOIN follows f ON u.id = f.following_id
        LEFT JOIN vinyls v ON u.id = v.user_id
        WHERE f.follower_id = $1
        GROUP BY u.id`,
      [userId]
    );
    return res.json(followingRes.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération de la liste de suivi" });
  }
});

// --- Get followers and following count ---
router.get("/count/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const followersRes = await query(
      "SELECT COUNT(*) AS count FROM follows WHERE following_id = $1",
      [userId]
    );
    const followingRes = await query(
      "SELECT COUNT(*) AS count FROM follows WHERE follower_id = $1",
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
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Récupère l'id de l'utilisateur courant depuis req.user
    const currentUserId = req.user?.userId;

    const usersRes = await query(
      `SELECT id, username, profile_picture, bio, is_public 
        FROM users 
        WHERE (username ILIKE $1 OR bio ILIKE $2) 
          AND is_public = true
          ${currentUserId ? "AND id != $5" : ""}
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

// --- Get feed ---
router.get("/feed/recent", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    if (!followerId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const feedRes = await query(
      `SELECT * FROM (
        SELECT DISTINCT ON (v.user_id) v.*, u.username, u.profile_picture
        FROM vinyls v
        INNER JOIN users u ON v.user_id = u.id
        INNER JOIN follows f ON u.id = f.following_id
        WHERE f.follower_id = $1
        ORDER BY v.user_id, v.date_added DESC
      ) t
      ORDER BY t.date_added DESC
      LIMIT 50`,
      [followerId]
    );

    return res.json(feedRes.rows);
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
      "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, userId]
    );

    return res.json({ isFollowing: existingFollowRes.rows.length > 0 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la vérification du suivi" });
  }
});


export default router;
