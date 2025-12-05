import { Router, type Request, type Response } from "express"
import { authMiddleware, type AuthRequest } from "../middleware/auth"
import { discogsService } from "../services/discogs"
import { coverArtService } from "../services/coverArt"

const router = Router()

// Scan by barcode
router.post("/barcode", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.body

    if (!barcode) {
      return res.status(400).json({ error: "Code-barres requis" })
    }

    let release = await discogsService.searchByBarcode(barcode)
    let isFromDiscogs = true

    // Fallback to iTunes if not found on Discogs
    if (!release) {
      console.log(`Barcode ${barcode} not found on Discogs, trying iTunes...`)
      release = await coverArtService.searchByUpc(barcode)
      isFromDiscogs = false
    }

    if (!release) {
      return res.status(404).json({ error: "Album non trouvé (ni sur Discogs, ni sur iTunes)" })
    }

    const artistName =
      release.artists && release.artists.length > 0
        ? release.artists[0].name
        : "Artiste inconnu"

    const mainGenre =
      release.genres && release.genres.length > 0
        ? release.genres[0]
        : "Non classifié"

    let coverImage =
      release.images && release.images.length > 0
        ? release.images[0].uri
        : undefined

    // If from Discogs but no image, try fallback
    if (isFromDiscogs && !coverImage) {
      coverImage = await coverArtService.getCoverArt(artistName, release.title) || undefined
    }

    const vinylColor = isFromDiscogs ? discogsService.extractColor(release.formats || []) : null

    return res.json({
      title: release.title,
      artist: artistName,
      genre: mainGenre,
      releaseYear: release.year,
      barcode,
      discogsId: release.id.toString(),
      coverImage,
      genres: release.genres,
      vinylColor,
      discCount: release.discCount || 1,
      format: release.format || "vinyl"
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

    let release = await discogsService.searchByTitle(title, artist)
    let isFromDiscogs = true

    // Fallback to iTunes if not found on Discogs
    if (!release) {
      console.log(`Album "${title}" by "${artist}" not found on Discogs, trying iTunes...`)
      release = await coverArtService.searchAlbum(artist || "", title)
      isFromDiscogs = false
    }

    if (!release) {
      return res.status(404).json({ error: "Album non trouvé" })
    }

    const artistName =
      release.artists && release.artists.length > 0
        ? release.artists[0].name
        : artist || "Artiste inconnu"

    const mainGenre =
      release.genres && release.genres.length > 0
        ? release.genres[0]
        : "Non classifié"

    let coverImage =
      release.images && release.images.length > 0
        ? release.images[0].uri
        : undefined

    // If from Discogs but no image, try fallback
    if (isFromDiscogs && !coverImage) {
      coverImage = await coverArtService.getCoverArt(artistName, release.title) || undefined
    }

    const vinylColor = isFromDiscogs ? discogsService.extractColor(release.formats || []) : null

    return res.json({
      title: release.title,
      artist: artistName,
      genre: mainGenre,
      releaseYear: release.year,
      discogsId: release.id.toString(),
      coverImage,
      genres: release.genres,
      vinylColor,
      format: release.format || "vinyl"
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Erreur lors de la recherche" })
  }
})

export default router
