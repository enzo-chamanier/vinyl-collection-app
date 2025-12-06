import { useEffect } from "react"
import { X } from "lucide-react"

interface StatsItem {
    name: string
    count: number
}

interface StatsListModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    items: StatsItem[]
    total: number
}

export function StatsListModal({ isOpen, onClose, title, items, total }: StatsListModalProps) {
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground font-mono text-sm w-6">{idx + 1}.</span>
                                <span className="font-medium text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${(item.count / total) * 100}%` }}
                                    />
                                </div>
                                <span className="font-bold text-primary w-8 text-right">{item.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
