"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { VinylColorPicker, type VinylColorData, getVinylBackground } from "../vinyl/vinyl-color-picker"
import { AlertCircle } from "lucide-react"

interface ManualVinylFormProps {
  onSubmit: (vinyl: any) => void
  loading?: boolean
}

export function ManualVinylForm({ onSubmit, loading = false }: ManualVinylFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    genre: "",
    releaseYear: new Date().getFullYear(),
    vinylColor: null as VinylColorData | VinylColorData[] | null,
    discCount: 1,
    giftedByUserId: "",
    sharedWithUserId: ""
  })
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [friends, setFriends] = useState<any[]>([])

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (user.id) {
          const res = await api.get(`/followers/following/${user.id}`)
          setFriends(res)
        }
      } catch (e) {
        console.error("Error fetching friends", e)
      }
    }
    fetchFriends()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = async () => {
    if (!formData.title && !formData.artist) {
      setSearchError("Veuillez entrer un titre ou un artiste")
      return
    }

    setSearching(true)
    setSearchError("")
    setSearchResults([])

    try {
      const result = await api.post("/scan/search", {
        title: formData.title,
        artist: formData.artist,
      })

      const results = Array.isArray(result) ? result : [result]
      setSearchResults(results)

      if (results.length === 0) {
        setSearchError("Aucun résultat trouvé")
      }
    } catch (err: any) {
      setSearchError(err.message || "Erreur lors de la recherche")
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result: any) => {
    let colorData: VinylColorData | VinylColorData[] | null = null

    // Parse color from result if available
    if (result.vinylColor) {
      if (typeof result.vinylColor === "string") {
        colorData = {
          type: ["Clear", "Transparent"].includes(result.vinylColor) ? "transparent" : "solid",
          primary: result.vinylColor
        }
      } else {
        colorData = result.vinylColor
      }
    }

    setFormData({
      ...formData,
      title: result.title,
      artist: result.artist,
      genre: result.genre || "",
      releaseYear: result.releaseYear || new Date().getFullYear(),
      vinylColor: colorData,
      discCount: result.discCount || 1,
      // Store other fields if needed by parent but not in state
      ...result
    })
  }

  const handleDirectAdd = () => {
    onSubmit({
      ...formData,
      vinylColor: formData.vinylColor ? JSON.stringify(formData.vinylColor) : null
    })
  }

  // Helper to get preview color (first disc)
  const previewColor = Array.isArray(formData.vinylColor)
    ? formData.vinylColor[0]
    : formData.vinylColor

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <input
          type="text"
          name="title"
          placeholder="Titre du Vinyle"
          value={formData.title}
          onChange={handleChange}
          className="w-full text-text-secondary bg-black border-border rounded h-10 px-3"
        />

        <input
          type="text"
          name="artist"
          placeholder="Artiste"
          value={formData.artist}
          onChange={handleChange}
          className="w-full text-text-secondary bg-black border-border rounded h-10 px-3"
        />

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={searching || loading}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded transition disabled:opacity-50"
          >
            {searching ? "Recherche..." : "Rechercher"}
          </button>
        </div>
      </div>

      {searchError && (
        <div className="bg-red-500/10 border border-primary text-primary px-4 py-2 rounded text-sm">{searchError}</div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="font-semibold text-text-secondary">Sélectionnez votre version</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
            {searchResults.map((result, idx) => {
              // Determine icon color for preview
              const vinylColor = result.vinylColor || "Black"
              const isTransparent = ["Clear", "Transparent"].includes(vinylColor)
              const displayColor = isTransparent ? "rgba(255, 255, 255, 0.5)" : vinylColor.toLowerCase()
              const discCount = result.discCount || 1

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className="group cursor-pointer relative aspect-square bg-surface rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:scale-105"
                >
                  {/* Vinyl Color Icon */}
                  <div
                    className="absolute top-2 left-2 z-20 w-5 h-5 rounded-full shadow-md flex items-center justify-center"
                    style={{
                      backgroundColor: displayColor,
                      border: isTransparent || vinylColor.toLowerCase() === "white" ? "1px solid #ccc" : "1px solid rgba(0,0,0,0.1)"
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                    {/* Number indicator for multi-disc */}
                    <span className="absolute -bottom-1 -right-1 bg-black text-[6px] text-white px-1 rounded-full border border-white/20">
                      {discCount}
                    </span>
                  </div>

                  {result.coverImage ? (
                    <img src={result.coverImage} alt={result.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 text-xs text-center p-2">
                      Pas d'image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-bold truncate">{result.title}</p>
                    <p className="text-gray-300 text-[10px] truncate">{result.artist}</p>
                    {result.year && <p className="text-gray-400 text-[10px]">{result.year}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-text-secondary">Détails du Vinyle</span>
        </div>
      </div>

      <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex gap-4">
          {/* Color Picker Trigger */}
          <div className="w-24 flex-shrink-0">
            <label className="block text-xs text-text-secondary mb-1">Couleur</label>
            <button
              onClick={() => setShowColorPicker(true)}
              className="w-full aspect-square rounded-lg border border-border flex items-center justify-center transition hover:border-primary relative overflow-hidden"
              style={{
                background: previewColor
                  ? getVinylBackground(previewColor.type, previewColor.primary, previewColor.secondary, previewColor.splatterSize, previewColor.tertiary, previewColor.quaternary)
                  : "#1a1a1a"
              }}
            >
              {previewColor ? (
                <div className="w-full h-full relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full border-2 border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/20 rounded-full" />
                  </div>
                  {/* Number indicator for multi-disc */}
                  <span className="absolute bottom-1 right-1 bg-black text-[8px] text-white px-1.5 py-0.5 rounded-full border border-white/20">
                    {formData.discCount}x
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-text-secondary">
                  <AlertCircle size={24} className="mb-1 text-red-500" />
                  <span className="text-[10px]">Définir</span>
                </div>
              )}
            </button>
          </div>

          <div className="flex-1 space-y-3">
            <input
              type="text"
              name="title"
              placeholder="Titre"
              value={formData.title}
              onChange={handleChange}
              className="w-full text-text-secondary bg-black border-border rounded h-10 px-3"
            />
            <input
              type="text"
              name="artist"
              placeholder="Artiste"
              value={formData.artist}
              onChange={handleChange}
              className="w-full text-text-secondary bg-black border-border rounded h-10 px-3"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <select name="genre" value={formData.genre} onChange={handleChange} className="flex-1 text-text-secondary bg-black border-border rounded h-10 px-3">
            <option value="">Genre</option>
            <option value="Rock">Rock</option>
            <option value="Pop">Pop</option>
            <option value="Jazz">Jazz</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="Electronic">Électronique</option>
            <option value="Classical">Classique</option>
            <option value="Soul">Soul</option>
            <option value="Alternatif">Alternatif</option>
            <option value="Other">Autre</option>
          </select>

          <div className="flex gap-2 w-40">
            <input
              type="number"
              name="releaseYear"
              placeholder="Année"
              value={formData.releaseYear}
              onChange={handleChange}
              className="w-20 text-text-secondary bg-black border-border rounded h-10 px-3"
            />
            <input
              type="number"
              name="discCount"
              placeholder="Disques"
              min="1"
              max="10"
              value={formData.discCount}
              onChange={handleChange}
              className="w-16 text-text-secondary bg-black border-border rounded h-10 px-2 text-center"
              title="Nombre de disques"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            name="giftedByUserId"
            value={formData.giftedByUserId}
            onChange={handleChange}
            className="w-full text-text-secondary bg-black border-border rounded h-10 px-3 text-sm"
          >
            <option value="">🎁 Offert par...</option>
            {friends.map(friend => (
              <option key={friend.id} value={friend.id}>{friend.username}</option>
            ))}
          </select>

          <select
            name="sharedWithUserId"
            value={formData.sharedWithUserId}
            onChange={handleChange}
            className="w-full text-text-secondary bg-black border-border rounded h-10 px-3 text-sm"
          >
            <option value="">🤝 Commun avec...</option>
            {friends.map(friend => (
              <option key={friend.id} value={friend.id}>{friend.username}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDirectAdd}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded transition disabled:opacity-50"
        >
          {loading ? "Ajout en cours..." : "Ajouter à la collection"}
        </button>
      </div>

      {showColorPicker && (
        <VinylColorPicker
          initialColor={formData.vinylColor || undefined}
          discCount={Number(formData.discCount) || 1}
          initialGiftedBy={formData.giftedByUserId}
          initialSharedWith={formData.sharedWithUserId}
          onSave={(color, newDiscCount, giftedBy, sharedWith) => {
            setFormData(prev => ({
              ...prev,
              vinylColor: color,
              discCount: newDiscCount,
              giftedByUserId: giftedBy || prev.giftedByUserId,
              sharedWithUserId: sharedWith || prev.sharedWithUserId
            }))
          }}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  )
}
