"use client"



interface TopLoaderProps {
    message?: string
    visible: boolean
}

export function TopLoader({ message = "Chargement de l'application...", visible }: TopLoaderProps) {
    if (!visible) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-1 rounded-b-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {message}
            </div>
        </div>
    )
}
