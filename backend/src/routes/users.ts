import { Router, type Response } from "express";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import type { User } from "../types";

const router = Router();

// Get user profile by username
router.get("/:username", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const requesterId = req.user?.userId;

    // Récupère l'utilisateur
    const userResult = await query<any>(
      "SELECT id, username, email, profile_picture, bio, is_public, created_at, updated_at FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const dbUser = userResult.rows[0];

    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: "", // ne pas exposer le password
      profilePicture: dbUser.profile_picture ?? undefined,
      bio: dbUser.bio ?? undefined,
      isPublic: dbUser.is_public === true,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };

    // Check if requester is allowed to see collection
    let canViewCollection = user.isPublic;
    if (requesterId && requesterId === user.id) {
      canViewCollection = true;
    } else if (requesterId && !user.isPublic) {
      // Check if following
      const followRes = await query(
        "SELECT status FROM follows WHERE follower_id = $1 AND following_id = $2",
        [requesterId, user.id]
      );
      if (followRes.rows.length > 0 && followRes.rows[0].status === 'accepted') {
        canViewCollection = true;
      }
    }

    let vinyls: any[] = [];
    let giftedVinyls: any[] = [];

    if (canViewCollection) {
      // Récupère les vinyles de l'utilisateur (Collection & Reçus & Partagés avec lui)
      const vinylsResult = await query(
        `SELECT v.*, 
                u_gift.username as gifted_by_username, 
                u_share.username as shared_with_username,
                u_owner.username as owner_username
         FROM vinyls v
         JOIN users u_owner ON v.user_id = u_owner.id
         LEFT JOIN users u_gift ON v.gifted_by_user_id = u_gift.id
         LEFT JOIN users u_share ON v.shared_with_user_id = u_share.id
         WHERE v.user_id = $1 OR v.shared_with_user_id = $1
         ORDER BY v.date_added DESC`,
        [user.id]
      );
      vinyls = vinylsResult.rows;

      // Récupère les vinyles offerts PAR l'utilisateur (Offerts)
      const giftedVinylsResult = await query(
        `SELECT v.*, 
                u_owner.username as gifted_to_username, 
                u_share.username as shared_with_username,
                u_gift.username as gifted_by_username
         FROM vinyls v
         JOIN users u_owner ON v.user_id = u_owner.id
         LEFT JOIN users u_share ON v.shared_with_user_id = u_share.id
         JOIN users u_gift ON v.gifted_by_user_id = u_gift.id
         WHERE v.gifted_by_user_id = $1
         ORDER BY v.date_added DESC`,
        [user.id]
      );
      giftedVinyls = giftedVinylsResult.rows;
    }

    // Statistiques
    const statsResult = await query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT genre) as genreCount, COUNT(DISTINCT artist) as artistCount
        FROM vinyls WHERE user_id = $1`,
      [user.id]
    );
    const stats = statsResult.rows[0];

    return res.json({ user, vinyls, giftedVinyls, stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
});

// Update user profile
router.put("/profile/update", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username, bio, profilePicture, isPublic } = req.body;

    await query(
      `UPDATE users SET username = $1, bio = $2, profile_picture = $3, is_public = $4, updated_at = NOW()
        WHERE id = $5`,
      [username, bio, profilePicture, isPublic, req.user?.userId]
    );

    const userResult = await query<any>(
      "SELECT id, username, email, profile_picture, bio, is_public, created_at, updated_at FROM users WHERE id = $1",
      [req.user?.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const dbUser = userResult.rows[0];

    const updatedUser: User = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: "",
      profilePicture: dbUser.profile_picture ?? undefined,
      bio: dbUser.bio ?? undefined,
      isPublic: dbUser.is_public === true,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };

    return res.json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
});

// Get user stats
router.get("/:userId/stats", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const byGenreResult = await query(
      `SELECT genre, COUNT(*) as count FROM vinyls WHERE user_id = $1 GROUP BY genre ORDER BY count DESC`,
      [userId]
    );

    const topArtistsResult = await query(
      `SELECT artist, COUNT(*) as count FROM vinyls WHERE user_id = $1 GROUP BY artist ORDER BY count DESC LIMIT 10`,
      [userId]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM vinyls WHERE user_id = $1`,
      [userId]
    );

    return res.json({
      total: totalResult.rows[0]?.total ?? 0,
      byGenre: byGenreResult.rows,
      topArtists: topArtistsResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
  }
});

export default router;
