"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { BarcodeScanner } from "@/components/scan/barcode-scanner"
import { ManualVinylForm } from "@/components/scan/manual-vinyl-form"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function ScanPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"scan" | "manual">("scan")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVinylAdded = async (vinylData: any) => {
    setLoading(true)
    try {
      await api.post("/vinyls/add", vinylData)
      setError("")
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Error adding vinyl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      {loading && <FullScreenLoader message="Ajout en cours..." />}
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Ajouter un Album</h1>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode("scan")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === "scan"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Scan du Code-barres
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === "manual"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              Saisie Manuelle
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-primary text-primary px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        {mode === "scan" ? (
          <BarcodeScanner onVinylFound={handleVinylAdded} />
        ) : (
          <ManualVinylForm onSubmit={handleVinylAdded} loading={loading} />
        )}
      </div>
    </AppLayout>
  )
}
