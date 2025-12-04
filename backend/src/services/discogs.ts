import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

interface DiscogsArtist {
  name: string
}

interface DiscogsFormat {
  name: string
  qty: string
  descriptions?: string[]
  text?: string
}

interface DiscogsRelease {
  id: number
  title: string
  artists: DiscogsArtist[]
  year: number
  genres: string[]
  images: Array<{ uri: string; type: string }>
  uri: string
  formats?: DiscogsFormat[]
  discCount?: number
}

export class DiscogsService {
  private apiUrl = "https://api.discogs.com"
  private headers = {
    "User-Agent": "VinylStack/1.0 (+http://vinylstack.app)",
    "Authorization": `Discogs token=${process.env.DISCOGS_API_KEY}`
  }

  // ... (search methods remain same)

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

      const data = response.data;
      const formats: DiscogsFormat[] = data.formats?.map((f: any) => ({
        name: f.name,
        qty: f.qty,
        descriptions: f.descriptions,
        text: f.text
      })) || [];

      return {
        id: data.id,
        title: data.title,
        artists: data.artists || [],
        year: data.year,
        genres: data.genres || [],
        images: data.images || [],
        uri: data.uri,
        formats: formats,
        discCount: this.extractDiscCount(formats) // Calculate discCount
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails Discogs:", error)
      return null
    }
  }

  extractColor(formats: DiscogsFormat[]): string | null {
    if (!formats || formats.length === 0) return null

    const colors = [
      "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink",
      "White", "Clear", "Gold", "Silver", "Grey", "Transparent",
      "Maroon", "Teal", "Turquoise", "Violet", "Magenta"
    ]
    const colorKeywords = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'White', 'Clear', 'Gold', 'Silver', 'Transparent', 'Splatter', 'Marbled'];

    for (const format of formats) {
      // Check descriptions
      if (format.descriptions) {
        for (const desc of format.descriptions) {
          const foundColor = colors.find(c => desc.toLowerCase().includes(c.toLowerCase()))
          if (foundColor) return foundColor
        }
      }
      // Check text
      if (format.text) {
        const foundColor = colors.find(c => format.text!.toLowerCase().includes(c.toLowerCase()))
        if (foundColor) return foundColor
      }

      // Updated logic from the provided edit
      const textToCheck = [
        ...(format.descriptions || []),
        format.text || ''
      ].join(' ').toLowerCase();

      for (const color of colorKeywords) {
        if (textToCheck.includes(color.toLowerCase())) {
          return color;
        }
      }
    }
    return null // Default to black if no color found (handled by frontend)
  }

  extractDiscCount(formats: DiscogsFormat[]): number {
    let maxQty = 1;
    for (const format of formats) {
      // Check qty field (e.g. "2" for 2xLP)
      const qty = parseInt(format.qty || "1");
      if (!isNaN(qty) && qty > maxQty) {
        maxQty = qty;
      }

      // Check descriptions for "2xLP", "3xCD", etc.
      const textToCheck = [
        ...(format.descriptions || []),
        format.text || ''
      ].join(' ');

      const match = textToCheck.match(/(\d+)x(LP|CD|Vinyl)/i);
      if (match && match[1]) {
        const count = parseInt(match[1]);
        if (count > maxQty) maxQty = count;
      }
    }
    return maxQty;
  }
}

export const discogsService = new DiscogsService()
