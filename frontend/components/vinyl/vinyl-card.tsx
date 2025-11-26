"use client"

import Image from "next/image"
import { useState } from "react"
import { api } from "@/lib/api"

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  cover_image?: string
  rating?: number
}

interface VinylCardProps {
  vinyl: Vinyl
  onUpdate: () => void
}

export function VinylCard({ vinyl, onUpdate }: VinylCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/vinyls/${vinyl.id}`)
      onUpdate()
    } catch (error) {
      console.error("Error deleting vinyl:", error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group relative">
      <div className="relative aspect-square bg-surface rounded-lg overflow-hidden">
        {vinyl.cover_image ? (
          <Image
            src={vinyl.cover_image || "/placeholder.svg"}
            alt={vinyl.title}
            fill
            className="object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
            <div className="text-center px-4">
              <p className="text-white font-semibold text-sm line-clamp-2">{vinyl.title}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 ml-2 mb-2">
        <h3 className="font-semibold text-black text-sm line-clamp-1">{vinyl.title}</h3>
        <p className="text-text-secondary text-xs">{vinyl.artist}</p>
        <p className="text-text-tertiary text-xs">{vinyl.genre}</p>
      </div>

      {showDelete && (
        <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center gap-2 p-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-white hover:bg-white/90 text-black text-xs font-semibold py-2 rounded"
          >
            {deleting ? "Supprimer" : "Confirmer"}
          </button>
          <button
            onClick={() => setShowDelete(false)}
            className="flex-1 bg-gray-300 hover:bg-gray-300/90 text-black text-xs font-semibold py-2 rounded"
          >
            Annuler 
          </button>
        </div>
      )}

      {!showDelete && (
        <button
          onClick={() => setShowDelete(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-primary/80 hover:bg-primary text-white p-1 rounded"
        >
          ×
        </button>
      )}
    </div>
  )
}
