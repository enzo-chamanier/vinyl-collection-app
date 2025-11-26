"use client"

import type React from "react"

import { useState } from "react"
import { api } from "@/lib/api"

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
  })
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = async () => {
    setSearching(true)
    setSearchError("")
    try {
      const result = await api.post("/scan/search", {
        title: formData.title,
        artist: formData.artist,
      })
      onSubmit({
        ...formData,
        ...result,
      })
    } catch (err: any) {
      setSearchError(err.message || "Vinyle non trouvé")
    } finally {
      setSearching(false)
    }
  }

  const handleDirectAdd = () => {
    onSubmit(formData)
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        name="title"
        placeholder="Titre du Vinyle"
        value={formData.title}
        onChange={handleChange}
        className="w-full"
        required
      />

      <input
        type="text"
        name="artist"
        placeholder="Artiste"
        value={formData.artist}
        onChange={handleChange}
        className="w-full"
        required
      />

      <select name="genre" value={formData.genre} onChange={handleChange} className="w-full text-text-secondary bg-black border-border rounded h-10 px-3" required>
        <option value="">Sélectionnez un Genre</option>
        <option value="Rock">Rock</option>
        <option value="Pop">Pop</option>
        <option value="Jazz">Jazz</option>
        <option value="Hip-Hop">Hip-Hop</option>
        <option value="Electronic">Électronique</option>
        <option value="Classical">Classique</option>
        <option value="Soul">Soul</option>
        <option value="Other">Autre</option>
      </select>

      <input
        type="number"
        name="releaseYear"
        placeholder="Année de sortie"
        value={formData.releaseYear}
        onChange={handleChange}
        className="w-full text-text-secondary bg-black border-border rounded h-10 px-3"
      />

      {searchError && (
        <div className="bg-red-500/10 border border-primary text-primary px-4 py-2 rounded text-sm">{searchError}</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          disabled={searching || loading}
          className="flex-1 bg-gray-200 hover:bg-gray-300/90 text-black font-semibold py-3 rounded transition disabled:opacity-50"
        >
          {searching ? "Recherche..." : "Rechercher et Ajouter"}
        </button>

        <button
          onClick={handleDirectAdd}
          disabled={loading}
          className="flex-1 bg-surface hover:bg-surface/80 text-text-primary font-semibold py-3 rounded transition disabled:opacity-50"
        >
          {loading ? "Ajout en cours..." : "Ajouter Manuellement"}
        </button>
      </div>
    </div>
  )
}
