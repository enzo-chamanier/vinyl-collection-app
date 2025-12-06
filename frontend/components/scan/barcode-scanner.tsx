"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { api } from "@/lib/api"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

interface BarcodeScannerProps {
  onVinylFound: (vinyl: any) => void | Promise<void>
}

export function BarcodeScanner({ onVinylFound }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error)
        }
        try {
          scannerRef.current.clear()
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  const startScanner = async () => {
    setScanning(true)
    setError("")

    // Small delay to ensure DOM is ready
    setTimeout(async () => {
      try {
        // Cleanup existing scanner
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop()
            }
            await scannerRef.current.clear()
          } catch (e) {
            console.warn("Cleanup error:", e)
          }
        }

        const scanner = new Html5Qrcode("reader")
        scannerRef.current = scanner

        // Get available cameras
        const devices = await Html5Qrcode.getCameras()
        if (!devices || devices.length === 0) {
          throw new Error("Aucune caméra détectée.")
        }

        // Try to find a back camera, otherwise use the last one (usually back on mobile)
        let cameraId = devices[0].id
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'))
        if (backCamera) {
          cameraId = backCamera.id
        } else if (devices.length > 1) {
          // On mobile, the last camera is often the back one if not labeled
          cameraId = devices[devices.length - 1].id
        }

        console.log("Starting scanner with camera:", cameraId)

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          focusMode: "continuous",
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
          ],
          facingMode: "environment"
        }

        await scanner.start(
          cameraId,
          config,
          (decodedText) => {
            if (decodedText && decodedText !== lastScanned) {
              handleScanSuccess(decodedText)
            }
          },
          (errorMessage) => {
            // ignore errors during scanning
            console.debug(errorMessage)
          }
        )
      } catch (err: any) {
        console.error("Error starting scanner:", err)
        let msg = "Impossible de démarrer la caméra."
        if (err.name === "NotReadableError") {
          msg += " La caméra est peut-être utilisée par une autre application."
        } else if (err.name === "NotAllowedError") {
          msg += " Permission refusée."
        } else if (err.message) {
          msg += ` ${err.message}`
        }
        setError(msg)
        setScanning(false)
      }
    }, 100)
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
    setScanning(false)
  }

  const handleScanSuccess = async (code: string) => {
    setLastScanned(code)
    await stopScanner()
    await processBarcode(code)
  }

  const processBarcode = async (barcode: string) => {
    setLoading(true)
    try {
      const vinyl = await api.post("/scan/barcode", { barcode })
      await onVinylFound(vinyl)
    } catch (err: any) {
      setError(err.message || "Album non trouvé")
      setLastScanned(null)
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

  if (loading) {
    return <FullScreenLoader message="Recherche..." />
  }

  return (
    <div className="space-y-4">
      {!scanning ? (
        <button
          onClick={startScanner}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-lg transition"
        >
          Démarrer la Caméra
        </button>
      ) : (
        <div className="relative">
          <div id="reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[300px]"></div>
          <button
            onClick={stopScanner}
            className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-lg z-10"
          >
            Fermer
          </button>
          <div className="absolute inset-0 border-2 border-primary opacity-50 pointer-events-none z-10" />
        </div>
      )}

      <div className="my-4 text-center text-muted-foreground">ou</div>

      <form onSubmit={handleManualBarcode} className="space-y-3">
        <input
          type="text"
          name="barcode"
          placeholder="Entrez le code-barres manuellement"
          className="w-full bg-background border border-input rounded-lg h-10 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Recherche en cours..." : "Rechercher"}
        </button>
      </form>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-2 rounded-lg text-sm">{error}</div>
      )}
    </div>
  )
}
