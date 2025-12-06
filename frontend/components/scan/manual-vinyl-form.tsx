"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { VinylColorPicker, type VinylColorData, getVinylBackground } from "../vinyl/vinyl-color-picker"
import { AlertCircle, Search, Mic2, Loader2, Palette, Disc, Calendar, Music, Layers, Gift, Users, Check } from "lucide-react"

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
    format: "vinyl" as "vinyl" | "cd",
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
      format: result.format || "vinyl",
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
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Recherche Automatique</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              name="title"
              placeholder="Titre de l'Album"
              value={formData.title}
              onChange={handleChange}
              className="w-full !pl-10 pr-3 py-2 text-sm !bg-white dark:!bg-neutral-900 border border-border rounded-lg focus:border-primary outline-none transition-colors !text-black dark:!text-white placeholder:text-muted-foreground"
            />
          </div>
          <div className="relative">
            <Mic2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              name="artist"
              placeholder="Artiste"
              value={formData.artist}
              onChange={handleChange}
              className="w-full !pl-10 pr-3 py-2 text-sm !bg-white dark:!bg-neutral-900 border border-border rounded-lg focus:border-primary outline-none transition-colors !text-black dark:!text-white placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || loading}
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-secondary/50 font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {searching ? "Recherche..." : "Rechercher les infos"}
        </button>

        {searchError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {searchError}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-xs font-semibold text-muted-foreground">Résultats trouvés :</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {searchResults.map((result, idx) => {
                const vinylColor = result.vinylColor || "Black"
                const isTransparent = ["Clear", "Transparent"].includes(vinylColor)
                const displayColor = isTransparent ? "rgba(255, 255, 255, 0.5)" : vinylColor.toLowerCase()
                const discCount = result.discCount || 1

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectResult(result)}
                    className="group cursor-pointer relative aspect-square bg-background rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:scale-105"
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
                      <span className="absolute -bottom-1 -right-1 bg-black text-[6px] text-white px-1 rounded-full border border-white/20">
                        {discCount}
                      </span>
                    </div>

                    {result.coverImage ? (
                      <img src={result.coverImage} alt={result.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs text-center p-2">
                        Pas d'image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-xs font-bold truncate">{result.title}</p>
                      <p className="text-gray-300 text-[10px] truncate">{result.artist}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest">
          <span className="bg-background px-4 text-muted-foreground">Détails de l'Album</span>
        </div>
      </div>

      {/* Manual Details Form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Left Column: Visuals */}
          <div className="w-full sm:w-32 flex flex-col gap-3">
            <label className="text-xs font-bold text-muted-foreground uppercase">Apparence</label>
            <button
              onClick={() => setShowColorPicker(true)}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
            >
              {previewColor ? (
                <div className="w-full h-full relative p-2">
                  <div
                    className="w-full h-full rounded-full shadow-lg animate-in zoom-in duration-300"
                    style={{
                      background: getVinylBackground(previewColor.type, previewColor.primary, previewColor.secondary, previewColor.splatterSize, previewColor.tertiary, previewColor.quaternary)
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-black rounded-full border-2 border-white/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-[10px] text-white px-2 py-0.5 rounded-full border border-white/10 font-mono">
                    {formData.discCount}x
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Palette className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Couleur</span>
                </>
              )}
            </button>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Cliquez pour configurer</p>
            </div>
          </div>

          {/* Right Column: Fields */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full !bg-white dark:!bg-neutral-900 border border-border rounded-lg px-3 py-2 text-sm !text-black dark:!text-white focus:border-primary outline-none placeholder:text-muted-foreground"
                  placeholder="Ex: Dark Side of the Moon"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1">Artiste</label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  className="w-full !bg-white dark:!bg-neutral-900 border border-border rounded-lg px-3 py-2 text-sm !text-black dark:!text-white focus:border-primary outline-none placeholder:text-muted-foreground"
                  placeholder="Ex: Pink Floyd"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1">Format</label>
                <div className="relative">
                  <Disc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleChange}
                    className="w-full !pl-10 pr-3 py-2 !bg-white dark:!bg-neutral-900 border border-border rounded-lg text-sm !text-black dark:!text-white focus:border-primary outline-none appearance-none"
                  >
                    <option value="vinyl">Vinyle</option>
                    <option value="cd">CD</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1">Année</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="number"
                    name="releaseYear"
                    value={formData.releaseYear}
                    onChange={handleChange}
                    className="w-full !pl-10 pr-3 py-2 !bg-white dark:!bg-neutral-900 border border-border rounded-lg text-sm !text-black dark:!text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1">Genre</label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    className="w-full !pl-10 pr-3 py-2 !bg-white dark:!bg-neutral-900 border border-border rounded-lg text-sm !text-black dark:!text-white focus:border-primary outline-none appearance-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Rock">Rock</option>
                    <option value="Pop">Pop</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Electronic">Électronique</option>
                    <option value="Classical">Classique</option>
                    <option value="Soul">Soul</option>
                    <option value="Alternatif">Alternatif</option>
                    <option value="Indie">Indie</option>
                    <option value="Metal">Metal</option>
                    <option value="Rap">Rap</option>
                    <option value="R&B">R&B</option>
                    <option value="Country">Country</option>
                    <option value="K-pop">K-pop</option>
                    <option value="J-pop">J-pop</option>
                    <option value="Other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1">Nombre de disques</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="number"
                    name="discCount"
                    min="1"
                    max="10"
                    value={formData.discCount}
                    onChange={handleChange}
                    className="w-full !pl-10 pr-3 py-2 !bg-white dark:!bg-neutral-900 border border-border rounded-lg text-sm !text-black dark:!text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Origine (Optionnel)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
              <select
                name="giftedByUserId"
                value={formData.giftedByUserId}
                onChange={handleChange}
                className="w-full !pl-10 pr-3 py-2 !bg-white dark:!bg-neutral-900 border border-border rounded-lg text-sm !text-black dark:!text-white focus:border-purple-500 outline-none appearance-none"
              >
                <option value="">C'est un cadeau de...</option>
                {friends.map(friend => (
                  <option key={friend.id} value={friend.id}>{friend.username}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
              <select
                name="sharedWithUserId"
                value={formData.sharedWithUserId}
                onChange={handleChange}
                className="w-full !pl-10 pr-3 py-2 !bg-white dark:!bg-neutral-900 border border-border rounded-lg text-sm !text-black dark:!text-white focus:border-blue-500 outline-none appearance-none"
              >
                <option value="">Collection commune avec...</option>
                {friends.map(friend => (
                  <option key={friend.id} value={friend.id}>{friend.username}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleDirectAdd}
          disabled={loading || !formData.title || !formData.artist}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {loading ? "Ajout en cours..." : "Ajouter à ma collection"}
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
