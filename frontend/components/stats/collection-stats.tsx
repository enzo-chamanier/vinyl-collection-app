"use client"

interface Stats {
  total: number
  genres: Array<{ name: string; count: number }>
  topArtists: Array<{ name: string; count: number }>
}

interface CollectionStatsProps {
  stats: Stats
}

export function CollectionStats({ stats }: CollectionStatsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-primary font-bold mb-4">Statistiques de ta collection</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary to-primary/60 rounded-lg p-4 text-white">
            <p className="text-text-tertiary text-sm mb-1 text-white">Total Vinyles</p>
            <p className="text-4xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-accent to-accent/60 rounded-lg p-4 text-white">
            <p className="text-text-tertiary text-sm mb-1">Genres différents</p>
            <p className="text-4xl font-bold text-gray-500">{stats.genres.length}</p>
          </div>

          <div className="bg-gradient-to-br from-secondary to-secondary/60 rounded-lg p-4 text-white">
            <p className="text-text-tertiary text-sm mb-1">Artistes différents</p>
            <p className="text-4xl font-bold text-gray-500">{stats.topArtists.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg p-4">
          <h3 className="font-bold mb-4">Top Genres</h3>
          <div className="space-y-3">
            {stats.genres.slice(0, 5).map((genre) => (
              <div key={genre.name} className="flex items-center justify-between">
                <span className="text-text-secondary">{genre.name}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-surface border border-border rounded-full w-24 h-2">
                    <div
                      className="bg-primary rounded-full h-full"
                      style={{
                        width: `${(genre.count / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-text-tertiary text-sm">{genre.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4">
          <h3 className="font-bold mb-4">Top Artistes</h3>
          <div className="space-y-2">
            {stats.topArtists.map((artist, idx) => (
              <div key={artist.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary font-bold">{idx + 1}.</span>
                  <span className="text-text-secondary">{artist.name}</span>
                </div>
                <span className="text-accent font-semibold">{artist.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
