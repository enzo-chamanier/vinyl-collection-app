"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { VinylColorPicker, type VinylColorData, getVinylBackground } from "./vinyl-color-picker"
import { AlertCircle, CheckCircle } from "lucide-react"
import { CommentsSection } from "../feed/comments-section"

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

interface VinylCardProps {
  vinyl: Vinyl
  onUpdate: () => void
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
  readOnly?: boolean
  currentUserId?: string
  currentUsername?: string
}

export function VinylCard({
  vinyl,
  onUpdate,
  selectable = false,
  selected = false,
  onSelect,
  readOnly = false,
  currentUsername,
  currentUserId
}: VinylCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)

  useEffect(() => {
    if (showCommentsModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showCommentsModal])

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

  const handleColorSave = async (colorData: VinylColorData | VinylColorData[], newDiscCount: number, giftedBy?: string, sharedWith?: string, format?: "vinyl" | "cd") => {
    try {
      await api.put(`/vinyls/${vinyl.id}`, {
        ...vinyl,
        coverImage: vinyl.cover_image,
        vinylColor: JSON.stringify(colorData),
        discCount: newDiscCount,
        giftedByUserId: giftedBy,
        sharedWithUserId: sharedWith,
        format: format
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
      <div
        className="group relative"
        onClick={() => {
          if (!selectable && !readOnly) {
            setShowCommentsModal(true)
          }
        }}
      >
        <div className="relative aspect-square bg-card rounded-lg overflow-hidden cursor-pointer">
          {selectable && (
            <div
              className={`absolute inset-0 z-30 flex items-center justify-center transition-colors ${selected ? "bg-primary/70" : "bg-black/10 hover:bg-black/70"}`}
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.()
              }}
            >
              {selected ? (
                <CheckCircle className="text-white w-12 h-12 drop-shadow-lg" fill="black" />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-black/50" />
              )}
            </div>
          )}

          {/* Vinyl Color Icons - Stacked for multi-disc */}
          {!selectable && (
            <div
              onClick={(e) => {
                if (readOnly) return
                e.stopPropagation()
                // If clicking the color icon specifically, open color picker
                // Otherwise the parent click handler will open comments
              }}
              className="absolute top-2 left-2 z-20 flex -space-x-2"
            >
              <button
                onClick={(e) => {
                  if (readOnly) return
                  e.stopPropagation()
                  setShowColorPicker(true)
                }}
                className={`flex -space-x-2 transition-transform ${readOnly ? '' : 'hover:scale-110 cursor-pointer'}`}
                title={readOnly ? "Voir les couleurs" : (isMissingColor ? "Définir les couleurs" : "Modifier les couleurs")}
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
                          background: color ? getVinylBackground(color.type, color.primary, color.secondary, color.splatterSize, color.tertiary, color.quaternary) : "#1a1a1a",
                          border: "2px solid rgba(255,255,255,0.2)",
                          zIndex: 30 - i
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-black/20" />
                        {/* Number indicator for multi-disc */}
                        <span className="absolute -bottom-1 -right-1 bg-black text-[8px] text-white px-1 rounded-full border border-white/20">
                          {i + 1}
                        </span>
                      </div>
                    )
                  })
                )}
              </button>
            </div>
          )}

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
          <h3 className={`font-semibold text-sm line-clamp-1 text-foreground`}>{vinyl.title}</h3>
          <p className="text-muted-foreground text-xs">{vinyl.artist.replace(/\s*\([^)]*\)/g, "")}</p>
          <div className="flex justify-between items-center pr-2">
            <p className="text-muted-foreground text-xs">{vinyl.genre}</p>
            <div className="flex gap-1">
              <span className="text-[10px] bg-card border border-border px-1.5 rounded text-muted-foreground uppercase">{vinyl.format || "vinyl"}</span>
              <span className="text-[10px] bg-card border border-border px-1.5 rounded text-muted-foreground">{discCount}x</span>
            </div>
          </div>

          {(vinyl.gifted_by_username || vinyl.shared_with_username) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {vinyl.gifted_by_username && (
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                  🎁 {vinyl.gifted_by_username}
                </span>
              )}
              {vinyl.shared_with_username && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                  🤝 {vinyl.shared_with_username}
                </span>
              )}
              {vinyl.owner_username && vinyl.user_id !== vinyl.shared_with_user_id && (
                <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                  🔗 Partagé par {(currentUsername && vinyl.owner_username && vinyl.owner_username.toLowerCase() === currentUsername.toLowerCase()) ? "vous" : vinyl.owner_username}
                </span>
              )}
              {vinyl.gifted_to_username && (
                <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                  🎁 Offert à {vinyl.gifted_to_username}
                </span>
              )}
            </div>
          )}
        </div>

        {showDelete && (
          <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center gap-2 p-2 z-10">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold py-2 rounded"
            >
              {deleting ? "Supprimer" : "Confirmer"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDelete(false)
              }}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xs font-semibold py-2 rounded"
            >
              Annuler
            </button>
          </div>
        )}

        {!showDelete && !selectable && !readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDelete(true)
            }}
            className="absolute top-2 right-2 bg-black/50 hover:bg-destructive/80 text-white p-1.5 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
          initialGiftedBy={vinyl.gifted_by_user_id}
          initialSharedWith={vinyl.shared_with_user_id}
          initialFormat={vinyl.format}
          onSave={handleColorSave}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {showCommentsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm md:p-4" onClick={() => setShowCommentsModal(false)}>
          <div className="bg-background w-full h-full md:w-full md:max-w-lg md:h-auto md:max-h-[80vh] md:rounded-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 pt-8 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Commentaires</h3>
              <button onClick={() => setShowCommentsModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col bg-background p-4 pb-12">
              <CommentsSection
                vinylId={vinyl.id}
                currentUserId={currentUserId}
                vinylOwnerId={vinyl.user_id}
                onCommentAdded={() => { }}
                variant="modal"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
