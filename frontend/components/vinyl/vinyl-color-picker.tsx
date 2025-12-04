"use client"

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"

export type VinylColorType = "solid" | "splatter" | "split" | "transparent"

export interface VinylColorData {
    type: VinylColorType
    primary: string
    secondary?: string
}

interface VinylColorPickerProps {
    initialColor?: string | VinylColorData | VinylColorData[]
    discCount?: number
    onSave: (colorData: VinylColorData | VinylColorData[], newDiscCount: number) => void
    onClose: () => void
}

export function VinylColorPicker({ initialColor, discCount = 1, onSave, onClose }: VinylColorPickerProps) {
    const [activeDisc, setActiveDisc] = useState(0)
    const [colors, setColors] = useState<VinylColorData[]>([])
    const [currentDiscCount, setCurrentDiscCount] = useState(discCount)

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
            onSave(colors[0], 1)
        } else {
            onSave(colors, currentDiscCount)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-border bg-black/20 shrink-0">
                    <h3 className="text-lg font-bold text-white">Personnaliser {currentDiscCount > 1 ? `Disque ${activeDisc + 1}` : "le Vinyle"}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition">
                        <X size={20} />
                    </button>
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
                                background: getVinylBackground(currentColor.type, currentColor.primary, currentColor.secondary),
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
                    <div className="grid grid-cols-4 gap-2">
                        {(["solid", "transparent", "split", "splatter"] as VinylColorType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => updateCurrentColor({ type: t })}
                                className={`py-2 px-1 rounded text-xs font-medium capitalize transition ${currentColor.type === t
                                    ? "bg-primary text-white"
                                    : "bg-black/40 text-text-secondary hover:bg-black/60"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

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

                        {(currentColor.type === "split" || currentColor.type === "splatter") && (
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
export function getVinylBackground(type: VinylColorType, primary: string, secondary: string = "#000000") {
    switch (type) {
        case "transparent":
            return hexToRgba(primary, 0.6)
        case "split":
            return `linear-gradient(90deg, ${primary} 50%, ${secondary} 50%)`
        case "splatter":
            return `radial-gradient(circle, ${primary} 20%, transparent 20%), 
              radial-gradient(circle at 80% 20%, ${secondary} 10%, transparent 12%),
              radial-gradient(circle at 20% 80%, ${secondary} 15%, transparent 17%),
              radial-gradient(circle at 50% 50%, ${secondary} 5%, transparent 7%),
              radial-gradient(circle at 80% 80%, ${secondary} 8%, transparent 10%),
              ${primary}`
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
