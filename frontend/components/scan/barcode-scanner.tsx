"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"

interface BarcodeScannerProps {
  onVinylFound: (vinyl: any) => void
}

export function BarcodeScanner({ onVinylFound }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (scanning) {
      startScanning()
    }
    return () => {
      stopScanning()
    }
  }, [scanning])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        scanFrame()
      }
    } catch (err) {
      setError("Camera access denied")
    }
  }

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)

    // Simulate barcode detection (in production, use jsQR or similar)
    setTimeout(scanFrame, 100)
  }

  const handleManualBarcode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const barcode = formData.get("barcode") as string

    setLoading(true)
    try {
      const vinyl = await api.post("/scan/barcode", { barcode })
      onVinylFound(vinyl)
    } catch (err: any) {
      setError(err.message || "Vinyl not found")
    } finally {
      setLoading(false)
    }
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
        <>
          <button
            onClick={() => setScanning(false)}
            className="w-full bg-surface hover:bg-surface/80 text-text-primary font-semibold py-2 rounded transition"
          >
            Arrêter la Caméra
          </button>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      <div className="my-4 text-center text-text-secondary">ou</div>

      <form onSubmit={handleManualBarcode} className="space-y-3">
        <input type="text" name="barcode" placeholder="Entrez le code-barres manuellement" className="w-full text-text-secondary bg-black border-border rounded h-10 px-3" required />
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
