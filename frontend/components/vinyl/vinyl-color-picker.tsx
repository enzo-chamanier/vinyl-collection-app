"use client"

import { useState, useEffect } from "react"
import { X, Check, Gift, Users } from "lucide-react"
import { api } from "@/lib/api"

export type VinylColorType = "solid" | "splatter" | "split" | "transparent" | "smoke" | "striped" | "quad-split"

export interface VinylColorData {
    type: VinylColorType
    primary: string
    secondary?: string
    tertiary?: string
    quaternary?: string
    splatterSize?: "small" | "large"
}

interface VinylColorPickerProps {
    initialColor?: string | VinylColorData | VinylColorData[]
    discCount?: number
    initialGiftedBy?: string
    initialSharedWith?: string
    onSave: (colorData: VinylColorData | VinylColorData[], newDiscCount: number, giftedBy?: string, sharedWith?: string) => void
    onClose: () => void
}

export function VinylColorPicker({ initialColor, discCount = 1, initialGiftedBy, initialSharedWith, onSave, onClose }: VinylColorPickerProps) {
    const [activeDisc, setActiveDisc] = useState(0)
    const [colors, setColors] = useState<VinylColorData[]>([])
    const [currentDiscCount, setCurrentDiscCount] = useState(discCount)
    const [giftedBy, setGiftedBy] = useState(initialGiftedBy || "")
    const [sharedWith, setSharedWith] = useState(initialSharedWith || "")
    const [friends, setFriends] = useState<any[]>([])
    const [activePopover, setActivePopover] = useState<"gift" | "share" | null>(null)

    // Initialize colors
    useEffect(() => {
        let initialColors: VinylColorData[] = []

        if (Array.isArray(initialColor)) {
            initialColors = initialColor
        } else if (initialColor) {
            // Single color provided
            let baseColor: VinylColorData
            if (typeof initialColor === "string") {
                if (["Clear", "Transparent"].includes(initialColor)) {
                    baseColor = { type: "transparent", primary: "#ffffff" }
                } else {
                    baseColor = { type: "solid", primary: colorNameToHex(initialColor) || "#000000" }
                }
            } else {
                baseColor = initialColor
            }
            initialColors = [baseColor]
        }

        // Fill remaining discs with default black or the first disc's color
        const finalColors = Array.from({ length: discCount }).map((_, i) => {
            return initialColors[i] || { type: "solid", primary: "#000000" }
        })

        setColors(finalColors)
        setCurrentDiscCount(discCount)
    }, [initialColor, discCount])

    // Fetch friends
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
        fetchFriends()
    }, [])

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [])

    const updateCurrentColor = (updates: Partial<VinylColorData>) => {
        setColors(prev => {
            const newColors = [...prev]
            newColors[activeDisc] = { ...newColors[activeDisc], ...updates }
            return newColors
        })
    }

    const handleAddDisc = () => {
        setColors(prev => [...prev, { type: "solid", primary: "#000000" }])
        setCurrentDiscCount(prev => prev + 1)
        setActiveDisc(currentDiscCount) // Switch to new disc
    }

    const handleRemoveDisc = () => {
        if (currentDiscCount <= 1) return

        setColors(prev => prev.filter((_, i) => i !== activeDisc))
        setCurrentDiscCount(prev => prev - 1)

        if (activeDisc >= currentDiscCount - 1) {
            setActiveDisc(Math.max(0, currentDiscCount - 2))
        }
    }

    const currentColor = colors[activeDisc] || { type: "solid", primary: "#000000" }

    const handleSave = () => {
        if (currentDiscCount === 1) {
            onSave(colors[0], 1, giftedBy, sharedWith)
        } else {
            onSave(colors, currentDiscCount, giftedBy, sharedWith)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-border bg-black/20 shrink-0 relative">
                    <h3 className="text-l font-bold text-white">Personnaliser {currentDiscCount > 1 ? `Disque ${activeDisc + 1}` : "le Vinyle"}</h3>
                    <div className="flex items-center gap-2">
                        {/* Gift Popover */}
                        <div className="relative">
                            <button
                                onClick={() => setActivePopover(activePopover === "gift" ? null : "gift")}
                                className={`p-2 rounded-full transition ${giftedBy ? "text-purple-400 bg-purple-500/10" : "text-text-secondary hover:text-white hover:bg-white/10"}`}
                                title="Origine du vinyle (Cadeau)"
                            >
                                <Gift size={20} />
                            </button>
                            {activePopover === "gift" && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                                    <label className="text-xs text-text-secondary uppercase font-bold mb-2 block">Offert par...</label>
                                    <select
                                        value={giftedBy}
                                        onChange={(e) => setGiftedBy(e.target.value)}
                                        className="w-full bg-black border border-border rounded px-3 py-2 text-white text-sm"
                                        autoFocus
                                    >
                                        <option value="">-- Personne --</option>
                                        {friends.map(friend => (
                                            <option key={friend.id} value={friend.id}>{friend.username}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Share Popover */}
                        <div className="relative">
                            <button
                                onClick={() => setActivePopover(activePopover === "share" ? null : "share")}
                                className={`p-2 rounded-full transition ${sharedWith ? "text-blue-400 bg-blue-500/10" : "text-text-secondary hover:text-white hover:bg-white/10"}`}
                                title="Collection commune"
                            >
                                <Users size={20} />
                            </button>
                            {activePopover === "share" && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                                    <label className="text-xs text-text-secondary uppercase font-bold mb-2 block">Partager avec...</label>
                                    <select
                                        value={sharedWith}
                                        onChange={(e) => setSharedWith(e.target.value)}
                                        className="w-full bg-black border border-border rounded px-3 py-2 text-white text-sm"
                                        autoFocus
                                    >
                                        <option value="">-- Personne --</option>
                                        {friends.map(friend => (
                                            <option key={friend.id} value={friend.id}>{friend.username}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-6 bg-border mx-1" />

                        <button onClick={onClose} className="text-text-secondary hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Disc Tabs */}
                <div className="flex overflow-x-auto border-b border-border bg-black/10 shrink-0 no-scrollbar">
                    {Array.from({ length: currentDiscCount }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveDisc(i)}
                            className={`flex-1 min-w-[80px] py-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center justify-center gap-2 ${activeDisc === i
                                ? "border-primary text-white bg-white/5"
                                : "border-transparent text-text-secondary hover:text-white hover:bg-white/5"
                                }`}
                        >
                            Disque {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={handleAddDisc}
                        className="px-4 py-3 text-text-secondary hover:text-white hover:bg-white/5 transition border-b-2 border-transparent"
                        title="Ajouter un disque"
                    >
                        +
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Preview */}
                    <div className="flex justify-center py-2 relative">
                        <div className="relative w-48 h-48 rounded-full shadow-xl transition-all duration-300"
                            style={{
                                background: getVinylBackground(currentColor.type, currentColor.primary, currentColor.secondary, currentColor.splatterSize),
                                border: currentColor.type === "transparent" ? "1px solid rgba(255,255,255,0.2)" : "none",
                                boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                            }}
                        >
                            {/* Label */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black rounded-full border-4 border-surface/50 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white/20 rounded-full" />
                            </div>

                            {/* Shine effect */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                        </div>

                        {/* Remove Disc Button */}
                        {currentDiscCount > 1 && (
                            <button
                                onClick={handleRemoveDisc}
                                className="absolute top-0 right-0 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-full transition"
                                title="Supprimer ce disque"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                        {(["solid", "transparent", "split", "splatter", "smoke", "striped", "quad-split"] as VinylColorType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => updateCurrentColor({ type: t })}
                                className={`py-2 px-1 rounded text-[10px] font-medium capitalize transition ${currentColor.type === t
                                    ? "bg-primary text-white"
                                    : "bg-black/40 text-text-secondary hover:bg-black/60"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Splatter Size Toggle */}
                    {currentColor.type === "splatter" && (
                        <div className="flex bg-black/40 p-1 rounded-lg">
                            {(["small", "large"] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => updateCurrentColor({ splatterSize: size })}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded capitalize transition ${(currentColor.splatterSize || "large") === size
                                        ? "bg-surface text-white shadow-sm"
                                        : "text-text-secondary hover:text-white"
                                        }`}
                                >
                                    {size === "small" ? "Petit Splatter" : "Grand Splatter"}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Color Pickers */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-text-secondary uppercase font-bold">Couleur Principale</label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    value={currentColor.primary}
                                    onChange={(e) => updateCurrentColor({ primary: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                />
                                <input
                                    type="text"
                                    value={currentColor.primary}
                                    onChange={(e) => updateCurrentColor({ primary: e.target.value })}
                                    className="flex-1 bg-black border border-border rounded px-3 py-2 text-white text-sm font-mono"
                                />
                            </div>
                        </div>

                        {(currentColor.type === "split" || currentColor.type === "splatter" || currentColor.type === "smoke" || currentColor.type === "striped" || currentColor.type === "quad-split") && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs text-text-secondary uppercase font-bold">Couleur Secondaire</label>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="color"
                                        value={currentColor.secondary || "#ff0000"}
                                        onChange={(e) => updateCurrentColor({ secondary: e.target.value })}
                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                    />
                                    <input
                                        type="text"
                                        value={currentColor.secondary || "#ff0000"}
                                        onChange={(e) => updateCurrentColor({ secondary: e.target.value })}
                                        className="flex-1 bg-black border border-border rounded px-3 py-2 text-white text-sm font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {currentColor.type === "quad-split" && (
                            <>
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-3">
                                    <label className="text-xs text-text-secondary uppercase font-bold">3ème Couleur</label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={currentColor.tertiary || "#00ff00"}
                                            onChange={(e) => updateCurrentColor({ tertiary: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                        />
                                        <input
                                            type="text"
                                            value={currentColor.tertiary || "#00ff00"}
                                            onChange={(e) => updateCurrentColor({ tertiary: e.target.value })}
                                            className="flex-1 bg-black border border-border rounded px-3 py-2 text-white text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                                    <label className="text-xs text-text-secondary uppercase font-bold">4ème Couleur</label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={currentColor.quaternary || "#0000ff"}
                                            onChange={(e) => updateCurrentColor({ quaternary: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                        />
                                        <input
                                            type="text"
                                            value={currentColor.quaternary || "#0000ff"}
                                            onChange={(e) => updateCurrentColor({ quaternary: e.target.value })}
                                            className="flex-1 bg-black border border-border rounded px-3 py-2 text-white text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shrink-0"
                    >
                        <Check size={18} />
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    )
}

// Helper to generate CSS background based on type
export function getVinylBackground(type: VinylColorType, primary: string, secondary: string = "#000000", splatterSize: "small" | "large" = "large", tertiary: string = "#00ff00", quaternary: string = "#0000ff") {
    switch (type) {
        case "transparent":
            return hexToRgba(primary, 0.6)
        case "split":
            return `linear-gradient(90deg, ${primary} 50%, ${secondary} 50%)`
        case "smoke":
            return `radial-gradient(circle at 50% 50%, ${hexToRgba(primary, 0.2)} 0%, ${hexToRgba(primary, 0.8)} 40%, ${hexToRgba(secondary, 0.6)} 100%)`
        case "splatter":
            const sizeMultiplier = splatterSize === "small" ? 0.5 : 1
            return `radial-gradient(circle, ${primary} 20%, transparent 20%), 
              radial-gradient(circle at 80% 20%, ${secondary} ${10 * sizeMultiplier}%, transparent ${12 * sizeMultiplier}%),
              radial-gradient(circle at 20% 80%, ${secondary} ${15 * sizeMultiplier}%, transparent ${17 * sizeMultiplier}%),
              radial-gradient(circle at 50% 50%, ${secondary} ${5 * sizeMultiplier}%, transparent ${7 * sizeMultiplier}%),
              radial-gradient(circle at 80% 80%, ${secondary} ${8 * sizeMultiplier}%, transparent ${10 * sizeMultiplier}%),
              radial-gradient(circle at 30% 30%, ${secondary} ${6 * sizeMultiplier}%, transparent ${8 * sizeMultiplier}%),
              radial-gradient(circle at 70% 70%, ${secondary} ${9 * sizeMultiplier}%, transparent ${11 * sizeMultiplier}%),
              radial-gradient(circle at 20% 50%, ${secondary} ${7 * sizeMultiplier}%, transparent ${9 * sizeMultiplier}%),
              radial-gradient(circle at 80% 50%, ${secondary} ${8 * sizeMultiplier}%, transparent ${10 * sizeMultiplier}%),
              radial-gradient(circle at 50% 20%, ${secondary} ${6 * sizeMultiplier}%, transparent ${8 * sizeMultiplier}%),
              radial-gradient(circle at 50% 80%, ${secondary} ${9 * sizeMultiplier}%, transparent ${11 * sizeMultiplier}%),
              radial-gradient(circle at 50% 80%, ${secondary} ${9 * sizeMultiplier}%, transparent ${11 * sizeMultiplier}%),
              ${primary}`
        case "striped":
            return `repeating-conic-gradient(
                from 0deg, 
                ${primary} 0deg, 
                ${primary} 4deg, 
                ${secondary} 10deg, 
                ${secondary} 14deg, 
                ${primary} 20deg
            )`
        case "quad-split":
            return `conic-gradient(
                ${primary} 0deg 90deg,
                ${secondary} 90deg 180deg,
                ${tertiary} 180deg 270deg,
                ${quaternary} 270deg 360deg
            )`
        default:
            return primary
    }
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Simple helper to map common color names to hex
function colorNameToHex(color: string): string | null {
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return null
    ctx.fillStyle = color
    return ctx.fillStyle
}
