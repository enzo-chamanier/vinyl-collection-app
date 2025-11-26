import { Router, type Request, type Response } from "express"
import { authMiddleware, type AuthRequest } from "../middleware/auth"
import { discogsService } from "../services/discogs"

const router = Router()

// Scan by barcode
router.post("/barcode", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.body

    if (!barcode) {
      return res.status(400).json({ error: "Code-barres requis" })
    }

    const release = await discogsService.searchByBarcode(barcode)

    if (!release) {
      return res.status(404).json({ error: "Vinyle non trouvé dans la base Discogs" })
    }

    const artistName =
      release.artists && release.artists.length > 0
        ? release.artists[0].name
        : "Artiste inconnu"

    const mainGenre =
      release.genres && release.genres.length > 0
        ? release.genres[0]
        : "Non classifié"

    const coverImage =
      release.images && release.images.length > 0
        ? release.images[0].uri
        : undefined

    return res.json({
      title: release.title,
      artist: artistName,
      genre: mainGenre,
      releaseYear: release.year,
      barcode,
      discogsId: release.id.toString(),
      coverImage,
      genres: release.genres,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Erreur lors du scan du code-barres" })
  }
})

// Search by title (manual search)
router.post("/search", async (req: Request, res: Response) => {
  try {
    const { title, artist } = req.body

    if (!title) {
      return res.status(400).json({ error: "Titre requis" })
    }

    const release = await discogsService.searchByTitle(title, artist)

    if (!release) {
      return res.status(404).json({ error: "Vinyle non trouvé" })
    }

    const artistName =
      release.artists && release.artists.length > 0
        ? release.artists[0].name
        : artist || "Artiste inconnu"

    const mainGenre =
      release.genres && release.genres.length > 0
        ? release.genres[0]
        : "Non classifié"

    const coverImage =
      release.images && release.images.length > 0
        ? release.images[0].uri
        : undefined

    return res.json({
      title: release.title,
      artist: artistName,
      genre: mainGenre,
      releaseYear: release.year,
      discogsId: release.id.toString(),
      coverImage,
      genres: release.genres,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Erreur lors de la recherche" })
  }
})

export default router
