import { Router, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

// --- Get user's vinyls ---
router.get("/my-collection", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM vinyls WHERE user_id = $1 ORDER BY date_added DESC",
      [req.user?.userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des vinyles" });
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
    } = req.body;

    const vinylId = uuidv4();
    const newVinyl = await query(
      `INSERT INTO vinyls 
      (id, user_id, title, artist, genre, release_year, barcode, discogs_id, cover_image, notes, rating, vinyl_color, disc_count, date_added, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW()) RETURNING *`,
      [vinylId, req.user?.userId, title, artist, genre, releaseYear, barcode, discogsId, coverImage, notes, rating, vinylColor, discCount || 1]
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
        updated_at = NOW()
      WHERE id = $10 AND user_id = $11
      RETURNING *`,
      [title, artist, genre, releaseYear, coverImage, notes, rating, vinylColor, discCount || 1, id, req.user?.userId]
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
