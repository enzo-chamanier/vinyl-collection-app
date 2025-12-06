"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { X, Loader2, Camera, Globe, Lock, Check } from "lucide-react"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: {
        username: string
        bio: string
        isPublic: boolean
        profilePicture?: string
        profileCategory?: string
    }
    onUpdate: () => void
}

export function EditProfileModal({ isOpen, onClose, currentUser, onUpdate }: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        isPublic: false,
        profilePicture: "",
        profileCategory: ""
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (isOpen && currentUser) {
            setFormData({
                username: currentUser.username || "",
                bio: currentUser.bio || "",
                isPublic: currentUser.isPublic ?? false,
                profilePicture: currentUser.profilePicture || "",
                profileCategory: currentUser.profileCategory || ""
            })
            setError("")
        }
    }, [isOpen, currentUser])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type } = e.target
        const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        if (!formData.username.trim()) {
            setError("Le nom d'utilisateur est requis")
            return
        }

        setSaving(true)
        setError("")

        try {
            await api.put("/users/profile/update", formData)

            // Update local storage if username changed
            if (formData.username !== currentUser.username) {
                const user = JSON.parse(localStorage.getItem("user") || "{}")
                user.username = formData.username
                localStorage.setItem("user", JSON.stringify(user))

                // Redirect to new profile URL
                window.location.href = `/profile`
            } else {
                onUpdate()
            }

            onClose()
        } catch (err: any) {
            console.error("Error saving profile:", err)
            // Display specific error message from backend
            setError(err.response?.data?.error || err.message || "Erreur lors de la mise à jour du profil")
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-background border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">Modifier le profil</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Avatar Placeholder (Future Feature) */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                                {formData.profilePicture ? (
                                    <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-muted-foreground">
                                        {formData.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-6 h-6" />
                            </div>
                            {/* Note: Image upload logic would go here */}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Nom d'utilisateur</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                placeholder="Votre nom d'utilisateur"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                placeholder="Parlez-nous de vous..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">Visibilité du profil</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Public Option */}
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${formData.isPublic
                                        ? "border-green-500 bg-green-500/5"
                                        : "border-border hover:border-green-500/50 hover:bg-muted/50"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${formData.isPublic ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                                            <Globe size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                Public
                                                {formData.isPublic && <Check size={14} className="text-green-500" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Tout le monde peut voir votre collection et vos statistiques.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Private Option */}
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${!formData.isPublic
                                        ? "border-orange-500 bg-orange-500/5"
                                        : "border-border hover:border-orange-500/50 hover:bg-muted/50"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${!formData.isPublic ? "bg-orange-500/10 text-orange-500" : "bg-muted text-muted-foreground"}`}>
                                            <Lock size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                Privé
                                                {!formData.isPublic && <Check size={14} className="text-orange-500" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Seuls vos abonnés acceptés peuvent voir votre profil.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Selector (Only for Public Profiles) */}
                        {formData.isPublic && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-sm font-medium text-foreground">Catégorie de profil</label>
                                <select
                                    name="profileCategory"
                                    value={formData.profileCategory}
                                    onChange={handleChange}
                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                                >
                                    <option value="">Aucune catégorie</option>
                                    <option value="Collectionneur">Collectionneur</option>
                                    <option value="DJ">DJ</option>
                                    <option value="Audiophile">Audiophile</option>
                                    <option value="Disquaire">Disquaire</option>
                                    <option value="Artiste">Artiste</option>
                                    <option value="Passionné">Passionné</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Cette catégorie sera affichée sur votre profil public.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    )
}
