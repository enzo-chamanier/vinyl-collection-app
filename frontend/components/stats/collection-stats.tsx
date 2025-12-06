"use client"

import { useState } from "react"
import { StatsListModal } from "./stats-list-modal"
import { ChevronRight } from "lucide-react"

interface Stats {
  total: number
  genres: Array<{ name: string; count: number }>
  topArtists: Array<{ name: string; count: number }>
  totalArtists: number
}

interface CollectionStatsProps {
  stats: Stats
}

export function CollectionStats({ stats }: CollectionStatsProps) {
  const [modalType, setModalType] = useState<"genres" | "artists" | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-primary font-bold mb-4">Statistiques de ta collection</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary to-primary/60 rounded-lg p-4 text-primary-foreground">
            <p className="text-primary-foreground/80 text-sm mb-1">Total Albums</p>
            <p className="text-4xl font-bold">{stats.total}</p>
          </div>

          <div
            className="bg-gradient-to-br from-accent to-accent/60 rounded-lg p-4 text-accent-foreground cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setModalType("genres")}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-accent-foreground/80 text-sm mb-1">Genres différents</p>
                <p className="text-4xl font-bold">{stats.genres.length}</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-secondary to-secondary/60 rounded-lg p-4 text-secondary-foreground cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setModalType("artists")}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-foreground/80 text-sm mb-1">Artistes différents</p>
                <p className="text-4xl font-bold">{stats.totalArtists}</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-4 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Top Genres</h3>
            {stats.genres.length > 5 && (
              <button
                onClick={() => setModalType("genres")}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-3 flex-1">
            {stats.genres.slice(0, 5).map((genre) => (
              <div key={genre.name} className="flex items-center justify-between">
                <span className="text-foreground">{genre.name}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-muted border border-border rounded-full w-24 h-2">
                    <div
                      className="bg-primary rounded-full h-full"
                      style={{
                        width: `${(genre.count / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground text-sm w-6 text-right">{genre.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Top Artistes</h3>
            {stats.topArtists.length > 5 && (
              <button
                onClick={() => setModalType("artists")}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-2 flex-1">
            {stats.topArtists.slice(0, 5).map((artist, idx) => (
              <div key={artist.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-bold w-4">{idx + 1}.</span>
                  <span className="text-foreground truncate max-w-[150px] sm:max-w-[200px]">{artist.name.replace(/\s*\([^)]*\)/g, "")}</span>
                </div>
                <span className="text-primary font-bold">{artist.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatsListModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === "genres" ? "Tous les Genres" : "Tous les Artistes"}
        items={modalType === "genres" ? stats.genres : stats.topArtists}
        total={stats.total}
      />
    </div>
  )
}
