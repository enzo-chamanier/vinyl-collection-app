import { Router, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

// --- Get user's vinyls (with pagination) ---
router.get("/my-collection", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get total count (matching the data query joins to ensure consistency)
    const countResult = await query(
      `SELECT COUNT(*) 
       FROM vinyls v 
       JOIN users u_owner ON v.user_id = u_owner.id
       WHERE v.user_id = $1 OR v.shared_with_user_id = $1`,
      [req.user?.userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT v.*, 
              u_gift.username as gifted_by_username, 
              u_share.username as shared_with_username,
              u_owner.username as owner_username
       FROM vinyls v
       JOIN users u_owner ON v.user_id = u_owner.id
       LEFT JOIN users u_gift ON v.gifted_by_user_id = u_gift.id
       LEFT JOIN users u_share ON v.shared_with_user_id = u_share.id
       WHERE v.user_id = $1 OR v.shared_with_user_id = $1
       ORDER BY v.date_added DESC, v.id DESC
       LIMIT $2 OFFSET $3`,
      [req.user?.userId, limit, offset]
    );

    return res.json({
      data: result.rows,
      hasMore: offset + result.rows.length < total,
      total
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des vinyles" });
  }
});

// --- Get any user's vinyls (with pagination and privacy check) ---
router.get("/user/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check privacy
    const userRes = await query<any>("SELECT is_public FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const isPublic = userRes.rows[0].is_public;
    let canView = isPublic;

    if (requesterId && requesterId === userId) {
      canView = true;
    } else if (!isPublic && requesterId) {
      const followRes = await query<any>(
        "SELECT status FROM follows WHERE follower_id = $1 AND following_id = $2",
        [requesterId, userId]
      );
      if (followRes.rows.length > 0 && followRes.rows[0].status === 'accepted') {
        canView = true;
      }
    }

    if (!canView) {
      return res.status(403).json({ error: "Ce profil est privé" });
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) 
       FROM vinyls v 
       WHERE v.user_id = $1 OR v.shared_with_user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT v.*, 
              u_gift.username as gifted_by_username, 
              u_share.username as shared_with_username,
              u_owner.username as owner_username
       FROM vinyls v
       JOIN users u_owner ON v.user_id = u_owner.id
       LEFT JOIN users u_gift ON v.gifted_by_user_id = u_gift.id
       LEFT JOIN users u_share ON v.shared_with_user_id = u_share.id
       WHERE v.user_id = $1 OR v.shared_with_user_id = $1
       ORDER BY v.date_added DESC, v.id DESC
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
    return res.status(500).json({ error: "Erreur lors de la récupération des vinyles" });
  }
});

// --- Get collection stats (all vinyls for stats calculation) ---
router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT v.genre, v.artist
       FROM vinyls v
       JOIN users u_owner ON v.user_id = u_owner.id
       WHERE v.user_id = $1 OR v.shared_with_user_id = $1`,
      [req.user?.userId]
    );

    const vinyls = result.rows;
    const genreCount: Record<string, number> = {};
    const artistCount: Record<string, number> = {};

    vinyls.forEach((vinyl: { genre?: string; artist?: string }) => {
      const genres = vinyl.genre ? vinyl.genre.split(",").map((g: string) => g.trim()) : ["Inconnu"];
      genres.forEach((g: string) => {
        if (g) genreCount[g] = (genreCount[g] || 0) + 1;
      });

      const artistName = vinyl.artist ? vinyl.artist.replace(/\s*\([^)]*\)/g, "") : "Inconnu";
      artistCount[artistName] = (artistCount[artistName] || 0) + 1;
    });

    return res.json({
      total: vinyls.length,
      genres: Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      topArtists: Object.entries(artistCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      totalArtists: Object.keys(artistCount).length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
});

// --- Get single vinyl by ID ---
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT v.*, 
              u_owner.id as owner_id,
              u_owner.username as owner_username,
              u_owner.profile_picture as owner_profile_picture,
              u_gift.username as gifted_by_username, 
              u_share.username as shared_with_username,
              (SELECT COUNT(*)::int FROM likes WHERE vinyl_id = v.id) as likes_count,
              (SELECT COUNT(*)::int FROM comments WHERE vinyl_id = v.id) as comments_count,
              EXISTS(SELECT 1 FROM likes WHERE vinyl_id = v.id AND user_id = $2) as has_liked
       FROM vinyls v
       JOIN users u_owner ON v.user_id = u_owner.id
       LEFT JOIN users u_gift ON v.gifted_by_user_id = u_gift.id
       LEFT JOIN users u_share ON v.shared_with_user_id = u_share.id
       WHERE v.id = $1`,
      [id, req.user?.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vinyle non trouvé" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération du vinyle" });
  }
});

// --- Add vinyl ---
router.post("/add", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      artist,
      genre,
      releaseYear,
      barcode,
      discogsId,
      coverImage,
      notes,
      rating,
      vinylColor,
      discCount,
      giftedByUserId,
      sharedWithUserId,
      format
    } = req.body;

    const vinylId = uuidv4();
    const newVinyl = await query(
      `INSERT INTO vinyls 
      (id, user_id, title, artist, genre, release_year, barcode, discogs_id, cover_image, notes, rating, vinyl_color, disc_count, gifted_by_user_id, shared_with_user_id, format, date_added, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW()) RETURNING *`,
      [vinylId, req.user?.userId, title, artist, genre, releaseYear, barcode, discogsId, coverImage, notes, rating, vinylColor, discCount || 1, giftedByUserId || null, sharedWithUserId || null, format || "vinyl"]
    );

    return res.status(201).json(newVinyl.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'ajout du vinyle" });
  }
});

// --- Update vinyl ---
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifie que le vinyle appartient à l'utilisateur
    const existing = await query("SELECT * FROM vinyls WHERE id = $1 AND user_id = $2", [id, req.user?.userId]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Vinyle non trouvé" });

    const {
      title,
      artist,
      genre,
      releaseYear,
      coverImage,
      notes,
      rating,
      vinylColor,
      discCount,
      giftedByUserId,
      sharedWithUserId,
      format
    } = req.body;

    const updatedVinyl = await query(
      `UPDATE vinyls SET
        title = $1,
        artist = $2,
        genre = $3,
        release_year = $4,
        cover_image = $5,
        notes = $6,
        rating = $7,
        vinyl_color = $8,
        disc_count = $9,
        gifted_by_user_id = $10,
        shared_with_user_id = $11,
        format = $12,
        updated_at = NOW()
      WHERE id = $13 AND user_id = $14
      RETURNING *`,
      [title, artist, genre, releaseYear, coverImage, notes, rating, vinylColor, discCount || 1, giftedByUserId || null, sharedWithUserId || null, format || "vinyl", id, req.user?.userId]
    );

    if (updatedVinyl.rows.length === 0) {
      return res.status(404).json({ error: "Vinyle non trouvé" });
    }

    return res.json(updatedVinyl.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du vinyle" });
  }
});

// --- Delete vinyl ---
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await query("SELECT * FROM vinyls WHERE id = $1 AND user_id = $2", [id, req.user?.userId]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Vinyle non trouvé" });

    await query("DELETE FROM vinyls WHERE id = $1", [id]);
    return res.json({ message: "Vinyle supprimé" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la suppression du vinyle" });
  }
});

export default router;
