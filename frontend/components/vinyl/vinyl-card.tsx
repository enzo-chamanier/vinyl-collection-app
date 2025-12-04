"use client"

import Image from "next/image"
import { useState } from "react"
import { api } from "@/lib/api"
import { VinylColorPicker, type VinylColorData, getVinylBackground } from "./vinyl-color-picker"
import { AlertCircle } from "lucide-react"

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  cover_image?: string
  rating?: number
  vinyl_color?: string
  disc_count?: number
}

interface VinylCardProps {
  vinyl: Vinyl
  onUpdate: () => void
  variant?: "default" | "dark"
}

export function VinylCard({ vinyl, onUpdate, variant = "default" }: VinylCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

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

  const handleColorSave = async (colorData: VinylColorData | VinylColorData[], newDiscCount: number) => {
    try {
      await api.put(`/vinyls/${vinyl.id}`, {
        ...vinyl,
        coverImage: vinyl.cover_image,
        vinylColor: JSON.stringify(colorData),
        discCount: newDiscCount
      })
      onUpdate()
    } catch (error) {
      console.error("Error updating vinyl color:", error)
    }
  }

  // Parse vinyl color
  let colorData: VinylColorData | VinylColorData[] | null = null
  let isMissingColor = true

  if (vinyl.vinyl_color) {
    try {
      const parsed = JSON.parse(vinyl.vinyl_color)
      // Check if it's a valid color object or array
      if ((Array.isArray(parsed) && parsed.length > 0) || (parsed.type && parsed.primary)) {
        colorData = parsed
        isMissingColor = false
      }
    } catch (e) {
      // Fallback for legacy string colors
      if (vinyl.vinyl_color !== "Black") {
        colorData = {
          type: ["Clear", "Transparent"].includes(vinyl.vinyl_color) ? "transparent" : "solid",
          primary: vinyl.vinyl_color
        }
        isMissingColor = false
      }
    }
  }

  const discCount = vinyl.disc_count || 1
  const displayColors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : [])

  return (
    <>
      <div className="group relative">
        <div className="relative aspect-square bg-surface rounded-lg overflow-hidden">
          {/* Vinyl Color Icons - Stacked for multi-disc */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowColorPicker(true)
            }}
            className="absolute top-2 left-2 z-20 flex -space-x-2 transition-transform hover:scale-110"
            title={isMissingColor ? "Définir les couleurs" : "Modifier les couleurs"}
          >
            {isMissingColor ? (
              <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white/20 shadow-lg flex items-center justify-center">
                <AlertCircle size={16} className="text-white" />
              </div>
            ) : (
              Array.from({ length: Math.min(discCount, 3) }).map((_, i) => {
                const color = displayColors[i]
                return (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center relative"
                    style={{
                      background: color ? getVinylBackground(color.type, color.primary, color.secondary) : "#1a1a1a",
                      border: "2px solid rgba(255,255,255,0.2)",
                      zIndex: 30 - i
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-black/20" />
                    {/* Number indicator for multi-disc */}
                    {discCount > 1 && (
                      <span className="absolute -bottom-1 -right-1 bg-black text-[8px] text-white px-1 rounded-full border border-white/20">
                        {i + 1}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </button>

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
          <h3 className={`font-semibold text-sm line-clamp-1 ${variant === "dark" ? "text-white" : "text-black"}`}>{vinyl.title}</h3>
          <p className="text-text-secondary text-xs">{vinyl.artist.replace(/\s*\([^)]*\)/g, "")}</p>
          <div className="flex justify-between items-center pr-2">
            <p className="text-text-tertiary text-xs">{vinyl.genre}</p>
            <span className="text-[10px] bg-surface border border-border px-1.5 rounded text-text-secondary">{discCount}xLP</span>
          </div>
        </div>

        {showDelete && (
          <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center gap-2 p-2 z-10">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-white hover:bg-white/90 text-black text-xs font-semibold py-2 rounded"
            >
              {deleting ? "Supprimer" : "Confirmer"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDelete(false)
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-300/90 text-black text-xs font-semibold py-2 rounded"
            >
              Annuler
            </button>
          </div>
        )}

        {!showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDelete(true)
            }}
            className="absolute top-2 right-2 bg-black/50 hover:bg-red-500/80 text-white p-1.5 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
            title="Supprimer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        )}
      </div>

      {showColorPicker && (
        <VinylColorPicker
          initialColor={colorData || vinyl.vinyl_color}
          discCount={discCount}
          onSave={handleColorSave}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </>
  )
}
