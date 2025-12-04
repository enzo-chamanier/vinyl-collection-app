"use client"

import { VinylCard } from "./vinyl-card"
import { useState, useMemo, useRef, useEffect } from "react"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"
import { api } from "@/lib/api"

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
  title?: string
}

export function VinylCollection({ vinyls, loading, onUpdate, title = "Votre collection" }: VinylCollectionProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [groupByArtist, setGroupByArtist] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [currentUsername, setCurrentUsername] = useState<string | undefined>(undefined)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (user.id) {
      setCurrentUserId(user.id)
      setCurrentUsername(user.username)
    }
  }, [])

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Voulez-vous vraiment supprimer ${selectedIds.size} vinyles ?`)) return

    setDeleting(true)
    try {
      // Execute deletes in parallel
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/vinyls/${id}`)))

      // Reset selection and update
      setIsSelectionMode(false)
      setSelectedIds(new Set())
      onUpdate()
    } catch (error) {
      console.error("Error deleting vinyls:", error)
      alert("Erreur lors de la suppression des vinyles")
    } finally {
      setDeleting(false)
    }
  }

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

  useEffect(() => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect()
      const absoluteTop = rect.top + window.scrollY

      // If we are scrolled past the header (with some buffer), scroll back
      // We use a larger offset (100px) to ensure the header is positioned well below the top of the screen
      // This prevents it from being stuck behind the app header or covering the first item
      if (window.scrollY > absoluteTop - 100) {
        window.scrollTo({ top: absoluteTop - 100, behavior: "auto" })
      }
    }
  }, [filteredVinyls.length, searchQuery, selectedArtist])

  const vinylsByArtist = useMemo(() => {
    return filteredVinyls.reduce((acc: any, vinyl: any) => {
      const artist = vinyl.artist ? vinyl.artist.replace(/\s*\([^)]*\)/g, "") : "Inconnu"
      if (!acc[artist]) acc[artist] = []
      acc[artist].push(vinyl)
      return acc
    }, {})
  }, [filteredVinyls])

  if (loading) {
    return <FullScreenLoader message="Chargement de votre collection..." />
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
      <div ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 md:top-16 z-40 bg-background py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl text-primary font-bold">{title} ({filteredVinyls.length})</h2>
          {isSelectionMode && (
            <span className="text-sm text-text-secondary">{selectedIds.size} sélectionné(s)</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {isSelectionMode ? (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || deleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Suppression..." : `Supprimer (${selectedIds.size})`}
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedIds(new Set())
                }}
                className="bg-surface border border-border text-white px-4 py-2 rounded text-sm font-medium hover:bg-white/10 transition"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="bg-surface border border-border text-text-secondary px-4 py-2 rounded text-sm font-medium hover:text-white hover:border-primary transition"
              >
                Sélectionner
              </button>
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
            </>
          )}
        </div>
      </div>

      <div className="min-h-screen">
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
                    <VinylCard
                      key={vinyl.id}
                      vinyl={vinyl}
                      onUpdate={onUpdate}
                      variant="dark"
                      selectable={isSelectionMode}
                      selected={selectedIds.has(vinyl.id)}
                      onSelect={() => toggleSelection(vinyl.id)}
                      currentUserId={currentUserId}
                      currentUsername={currentUsername}
                      readOnly={currentUserId && vinyl.user_id ? vinyl.user_id !== currentUserId : false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVinyls.map((vinyl) => (
              <VinylCard
                key={vinyl.id}
                vinyl={vinyl}
                onUpdate={onUpdate}
                selectable={isSelectionMode}
                selected={selectedIds.has(vinyl.id)}
                onSelect={() => toggleSelection(vinyl.id)}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                readOnly={currentUserId && vinyl.user_id ? vinyl.user_id !== currentUserId : false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
