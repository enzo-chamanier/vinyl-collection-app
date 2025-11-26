import { Router, type Request, type Response } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { query } from "../config/database";

const router = Router();

// --- Get comprehensive collection analytics for any user ---
router.get("/collection/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Total vinyls
    const totalRes = await query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM vinyls WHERE user_id = $1",
      [userId]
    );
    const total = totalRes.rows[0]?.total ?? 0;

    // Genre distribution
    const byGenreRes = await query(
      "SELECT genre, COUNT(*) AS count FROM vinyls WHERE user_id = $1 GROUP BY genre ORDER BY count DESC",
      [userId]
    );
    const byGenre = byGenreRes.rows;

    // Top artists (15)
    const topArtistsRes = await query(
      "SELECT artist, COUNT(*) AS count FROM vinyls WHERE user_id = $1 GROUP BY artist ORDER BY count DESC LIMIT 15",
      [userId]
    );
    const topArtists = topArtistsRes.rows;

    // Year distribution
    const byYearRes = await query(
      "SELECT release_year, COUNT(*) AS count FROM vinyls WHERE user_id = $1 AND release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC",
      [userId]
    );
    const byYear = byYearRes.rows;

    // Average rating
    const avgRatingRes = await query<{ avg_rating: number | null }>(
      "SELECT AVG(rating) AS avg_rating FROM vinyls WHERE user_id = $1 AND rating IS NOT NULL",
      [userId]
    );
    const avgRating = avgRatingRes.rows[0]?.avg_rating ?? 0;

    // Recent additions (last 7 days)
    const recentRes = await query<{ count: number }>(
      `SELECT COUNT(*) AS count 
        FROM vinyls 
        WHERE user_id = $1 AND date_added >= NOW() - INTERVAL '7 days'`,
      [userId]
    );
    const recentAdditions = recentRes.rows[0]?.count ?? 0;

    return res.json({ total, byGenre, topArtists, byYear, avgRating, recentAdditions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des analytics" });
  }
});

// --- Get personal collection stats (authenticated) ---
router.get("/personal", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const statsRes = await query(
      `SELECT 
          COUNT(*) AS total_vinyls,
          COUNT(DISTINCT genre) AS unique_genres,
          COUNT(DISTINCT artist) AS unique_artists,
          COUNT(DISTINCT release_year) AS year_span,
          AVG(rating) AS avg_rating,
          MIN(date_added) AS first_added,
          MAX(date_added) AS last_added
      FROM vinyls
      WHERE user_id = $1`,
      [userId]
    );

    return res.json(statsRes.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des stats personnelles" });
  }
});

// --- Compare collections between two users ---
router.get("/compare", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId1 = req.query.userId1 as string;
    const userId2 = req.query.userId2 as string;

    if (!userId1 || !userId2) {
      return res.status(400).json({ error: "userId1 et userId2 sont requis" });
    }

    // Total vinyls
    const user1Res = await query<{ total: number }>("SELECT COUNT(*) AS total FROM vinyls WHERE user_id = $1", [userId1]);
    const user2Res = await query<{ total: number }>("SELECT COUNT(*) AS total FROM vinyls WHERE user_id = $1", [userId2]);

    // Common genres
    const commonGenresRes = await query(
      `SELECT genre 
        FROM vinyls 
        WHERE user_id = $1 
        INTERSECT 
        SELECT genre 
        FROM vinyls 
        WHERE user_id = $2`,
      [userId1, userId2]
    );

    // Common artists
    const commonArtistsRes = await query(
      `SELECT artist 
        FROM vinyls 
        WHERE user_id = $1 
        INTERSECT 
        SELECT artist 
        FROM vinyls 
        WHERE user_id = $2`,
      [userId1, userId2]
    );

    return res.json({
      user1: { total: user1Res.rows[0]?.total ?? 0 },
      user2: { total: user2Res.rows[0]?.total ?? 0 },
      commonGenresCount: commonGenresRes.rows.length,
      commonArtistsCount: commonArtistsRes.rows.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la comparaison des collections" });
  }
});

export default router;
