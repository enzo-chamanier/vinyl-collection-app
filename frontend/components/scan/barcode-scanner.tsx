"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface BarcodeScannerProps {
  onVinylFound: (vinyl: any) => void
}

export function BarcodeScanner({ onVinylFound }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  // Dynamic import to avoid SSR issues with react-qr-reader
  const [QrReader, setQrReader] = useState<any>(null)

  useEffect(() => {
    import("react-qr-reader").then((mod) => {
      setQrReader(() => mod.QrReader)
    })
  }, [])

  const handleScan = async (result: any, error: any) => {
    if (result) {
      const code = result?.text
      if (code && code !== lastScanned) {
        setLastScanned(code)
        setScanning(false)
        await processBarcode(code)
      }
    }
    if (error) {
      // console.info(error)
    }
  }

  const processBarcode = async (barcode: string) => {
    setLoading(true)
    try {
      const vinyl = await api.post("/scan/barcode", { barcode })
      onVinylFound(vinyl)
    } catch (err: any) {
      setError(err.message || "Vinyl not found")
      setLastScanned(null) // Reset to allow rescanning
    } finally {
      setLoading(false)
    }
  }

  const handleManualBarcode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const barcode = formData.get("barcode") as string
    await processBarcode(barcode)
  }

  return (
    <div className="space-y-4">
      {!scanning ? (
        <button
          onClick={() => setScanning(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded transition"
        >
          Démarrer la Caméra
        </button>
      ) : (
        <div className="relative">
          {QrReader && (
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: "environment" }}
              className="w-full rounded-lg overflow-hidden"
            />
          )}
          <button
            onClick={() => setScanning(false)}
            className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded"
          >
            Fermer
          </button>
          <div className="absolute inset-0 border-2 border-primary opacity-50 pointer-events-none" />
        </div>
      )}

      <div className="my-4 text-center text-text-secondary">ou</div>

      <form onSubmit={handleManualBarcode} className="space-y-3">
        <input
          type="text"
          name="barcode"
          placeholder="Entrez le code-barres manuellement"
          className="w-full text-text-secondary bg-black border-border rounded h-10 px-3"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-200 hover:bg-gray-300/90 text-black font-semibold py-3 rounded transition disabled:opacity-50"
        >
          {loading ? "Recherche en cours..." : "Rechercher"}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-primary text-primary px-4 py-2 rounded text-sm">{error}</div>
      )}
    </div>
  )
}
