"use client"

import { VinylCard } from "./vinyl-card"
import { useState, useMemo, useRef, useEffect } from "react"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"
import { api } from "@/lib/api"
import { SlidersHorizontal } from "lucide-react"

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  cover_image?: string
  rating?: number
  vinyl_color?: string
  disc_count?: number
  gifted_by_username?: string
  shared_with_username?: string
  gifted_by_user_id?: string
  shared_with_user_id?: string
  gifted_to_username?: string
  owner_username?: string
  user_id?: string
  format?: "vinyl" | "cd"
}

interface VinylCollectionProps {
  vinyls: Vinyl[]
  loading: boolean
  onUpdate: () => void
  title?: string
}

export function VinylCollection({ vinyls, loading, onUpdate, title = "Votre collection" }: VinylCollectionProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<"all" | "vinyl" | "cd">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [groupByArtist, setGroupByArtist] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [currentUsername, setCurrentUsername] = useState<string | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (user.id) {
      setCurrentUserId(user.id)
      setCurrentUsername(user.username)
    }
    // Default to open on desktop
    if (window.innerWidth >= 768) {
      setShowFilters(true)
    }
  }, [])

  // Auto-hide filters when scrolling up on mobile
  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Hide filters when scrolling up on mobile
      if (currentScrollY < lastScrollY && window.innerWidth < 768) {
        setShowFilters(false)
      }
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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
    if (!confirm(`Voulez-vous vraiment supprimer ${selectedIds.size} albums ?`)) return

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
      alert("Erreur lors de la suppression des albums")
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

    if (selectedFormat !== "all") {
      result = result.filter((v) => (v.format || "vinyl") === selectedFormat)
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
  }, [vinyls, selectedArtist, selectedFormat, searchQuery])

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
        <p className="text-muted-foreground">Commencez à ajouter des albums pour construire votre collection</p>
      </div>
    )
  }

  return (
    <div>
      <div ref={headerRef} className="flex flex-col gap-4 mb-6 sticky top-0 md:top-16 z-40 bg-background py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl text-primary font-bold">{title} ({filteredVinyls.length})</h2>
            {isSelectionMode && (
              <span className="text-sm text-muted-foreground">{selectedIds.size} sélectionné(s)</span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition md:hidden"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col sm:flex-row gap-4`}>
          {isSelectionMode ? (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || deleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Suppression..." : `Supprimer (${selectedIds.size})`}
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedIds(new Set())
                }}
                className="bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="!bg-white dark:!bg-neutral-900 border border-neutral-200 dark:border-neutral-800 !text-neutral-600 dark:!text-neutral-400 px-4 py-2 rounded-lg text-sm font-medium hover:!text-black dark:hover:!text-white hover:border-primary transition"
              >
                Sélectionner
              </button>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!bg-white dark:!bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm !text-black dark:!text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:border-primary w-full sm:w-48"
              />

              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="!bg-white dark:!bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm !text-black dark:!text-white focus:outline-none focus:border-primary"
              >
                <option value="">Tous les artistes</option>
                {artists.map((artist) => (
                  <option key={artist} value={artist}>
                    {artist}
                  </option>
                ))}
              </select>

              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as "all" | "vinyl" | "cd")}
                className="!bg-white dark:!bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm !text-black dark:!text-white focus:outline-none focus:border-primary"
              >
                <option value="all">Tous les formats</option>
                <option value="vinyl">Vinyles</option>
                <option value="cd">CDs</option>
              </select>

              <button
                onClick={() => setGroupByArtist(!groupByArtist)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${groupByArtist
                  ? "bg-primary text-primary-foreground border-primary"
                  : "!bg-white dark:!bg-neutral-900 !text-neutral-600 dark:!text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-primary"
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
          <div className="text-center py-12 text-muted-foreground">
            Aucun album trouvé.
          </div>
        ) : groupByArtist ? (
          <div className="space-y-8">
            {Object.entries(vinylsByArtist).map(([artist, vinyls]: [string, any]) => (
              <div key={artist} className="bg-card rounded-xl p-6 border border-border/50">
                <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">{artist}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-foreground">
                  {vinyls.map((vinyl: any) => (
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
                      linkToDetail={true}
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
                linkToDetail={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
