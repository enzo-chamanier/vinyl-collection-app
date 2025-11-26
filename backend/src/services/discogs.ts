import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

interface DiscogsArtist {
  name: string
}

interface DiscogsRelease {
  id: number
  title: string
  artists: DiscogsArtist[]
  year: number
  genres: string[]
  images: Array<{ uri: string; type: string }>
  uri: string
}

export class DiscogsService {
  private apiUrl = "https://api.discogs.com"
  private headers = {
    "User-Agent": "VinylStack/1.0 (+http://vinylstack.app)",
    "Authorization": `Discogs token=${process.env.DISCOGS_API_KEY}`
  }

  async searchByBarcode(barcode: string): Promise<DiscogsRelease | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/database/search`, {
        params: { barcode },
        headers: this.headers,
      })

      if (response.data.results && response.data.results.length > 0) {
        const releaseId = response.data.results[0].id
        return this.getReleaseDetails(releaseId)
      }
      return null
    } catch (error) {
      console.error("Erreur lors de la recherche Discogs par code-barres:", error)
      return null
    }
  }

  async searchByTitle(title: string, artist?: string): Promise<DiscogsRelease | null> {
    try {
      const query = artist ? `${title} ${artist}` : title
      const response = await axios.get(`${this.apiUrl}/database/search`, {
        params: { q: query, type: "release" },
        headers: this.headers,
      })

      if (response.data.results && response.data.results.length > 0) {
        const releaseId = response.data.results[0].id
        return this.getReleaseDetails(releaseId)
      }
      return null
    } catch (error) {
      console.error("Erreur lors de la recherche Discogs par titre:", error)
      return null
    }
  }

  private async getReleaseDetails(releaseId: number): Promise<DiscogsRelease | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/releases/${releaseId}`, {
        headers: this.headers,
      })

      return {
        id: response.data.id,
        title: response.data.title,
        artists: response.data.artists || [],
        year: response.data.year,
        genres: response.data.genres || [],
        images: response.data.images || [],
        uri: response.data.uri,
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails Discogs:", error)
      return null
    }
  }
}

export const discogsService = new DiscogsService()
