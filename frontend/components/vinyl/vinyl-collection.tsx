"use client"

import { VinylCard } from "./vinyl-card"

interface Vinyl {
  id: string
  title: string
  artist: string
  genre: string
  coverImage?: string
  rating?: number
}

interface VinylCollectionProps {
  vinyls: Vinyl[]
  loading: boolean
  onUpdate: () => void
}

export function VinylCollection({ vinyls, loading, onUpdate }: VinylCollectionProps) {
  if (loading) {
    return <div className="text-center text-text-secondary">Chargement de votre collection...</div>
  }

  if (vinyls.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Votre collection est vide</h3>
        <p className="text-text-secondary">Commencez à ajouter des vinyles pour construire votre collection</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl text-primary font-bold mb-6">Votre collection ({vinyls.length})</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {vinyls.map((vinyl) => (
          <VinylCard key={vinyl.id} vinyl={vinyl} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  )
}
