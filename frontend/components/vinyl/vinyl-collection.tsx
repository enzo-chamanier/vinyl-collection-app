"use client"

import { VinylCard } from "./vinyl-card"
import { useState, useMemo } from "react"

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  cover_image?: string
  rating?: number
  vinyl_color?: string
}

interface VinylCollectionProps {
  vinyls: Vinyl[]
  loading: boolean
  onUpdate: () => void
}

export function VinylCollection({ vinyls, loading, onUpdate }: VinylCollectionProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [groupByArtist, setGroupByArtist] = useState(false)

  const artists = useMemo(() => {
    const uniqueArtists = new Set(vinyls.map((v) => v.artist.replace(/\s*\([^)]*\)/g, "")))
    return Array.from(uniqueArtists).sort()
  }, [vinyls])

  const filteredVinyls = useMemo(() => {
    let result = vinyls

    if (selectedArtist) {
      result = result.filter((v) => v.artist.replace(/\s*\([^)]*\)/g, "") === selectedArtist)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((v) =>
        v.title.toLowerCase().includes(query) ||
        v.artist.toLowerCase().includes(query) ||
        v.genre.toLowerCase().includes(query)
      )
    }

    return result
  }, [vinyls, selectedArtist, searchQuery])

  const vinylsByArtist = useMemo(() => {
    return filteredVinyls.reduce((acc: any, vinyl: any) => {
      const artist = vinyl.artist ? vinyl.artist.replace(/\s*\([^)]*\)/g, "") : "Inconnu"
      if (!acc[artist]) acc[artist] = []
      acc[artist].push(vinyl)
      return acc
    }, {})
  }, [filteredVinyls])

  if (loading) {
    return <div className="text-center text-text-secondary">Chargement de votre collection...</div>
  }

  if (vinyls.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Votre collection est vide</h3>
        <p className="text-text-secondary">Commencez à ajouter des vinyles pour construire votre collection</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 z-40 bg-background py-4">
        <h2 className="text-2xl text-primary font-bold">Votre collection ({filteredVinyls.length})</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary w-full sm:w-48"
          />

          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          >
            <option value="">Tous les artistes</option>
            {artists.map((artist) => (
              <option key={artist} value={artist}>
                {artist}
              </option>
            ))}
          </select>

          <button
            onClick={() => setGroupByArtist(!groupByArtist)}
            className={`px-4 py-2 rounded text-sm font-medium transition border ${groupByArtist
              ? "bg-primary text-white border-primary"
              : "bg-surface text-text-secondary border-border hover:border-primary"
              }`}
          >
            {groupByArtist ? "Par Artiste" : "Grille"}
          </button>
        </div>
      </div>

      {filteredVinyls.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          Aucun vinyle trouvé.
        </div>
      ) : groupByArtist ? (
        <div className="space-y-8">
          {Object.entries(vinylsByArtist).map(([artist, vinyls]: [string, any]) => (
            <div key={artist} className="bg-black rounded-xl p-6 border border-border/50">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-border pb-2">{artist}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-white">
                {vinyls.map((vinyl: any) => (
                  <VinylCard key={vinyl.id} vinyl={vinyl} onUpdate={onUpdate} variant="dark" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVinyls.map((vinyl) => (
            <VinylCard key={vinyl.id} vinyl={vinyl} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}
