"use client"

interface Analytics {
  total_vinyls: number
  unique_genres: number
  unique_artists: number
  year_span: number
  avg_rating: number
  first_added: string
  last_added: string
}

interface CollectionAnalyticsProps {
  analytics: Analytics | null
  loading: boolean
}

export function CollectionAnalytics({ analytics, loading }: CollectionAnalyticsProps) {
  if (loading) {
    return <div className="text-center text-muted-foreground">Chargement des données...</div>
  }

  if (!analytics) {
    return <div className="text-center text-muted-foreground">Aucune donnée disponible</div>
  }

  const metrics = [
    {
      label: "Total Vinyles",
      value: analytics.total_vinyls,
      icon: "💿",
    },
    {
      label: "Genres Uniques",
      value: analytics.unique_genres,
      icon: "🎵",
    },
    {
      label: "Artistes Uniques",
      value: analytics.unique_artists,
      icon: "🎤",
    },
    {
      label: "Écart d'années",
      value: analytics.year_span,
      icon: "📅",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-neutral-900 rounded-lg p-6 text-center border border-neutral-800">
            <div className="text-3xl mb-2">{metric.icon}</div>
            <p className="text-3xl font-bold text-white mb-2">{metric.value}</p>
            <p className="text-neutral-400">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Chronologie de la collection</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Premier vinyle ajouté :</span>
            <span className="text-foreground">{new Date(analytics.first_added).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dernier vinyle ajouté :</span>
            <span className="text-foreground">{new Date(analytics.last_added).toLocaleDateString()}</span>
          </div>
          {/* <div className="flex justify-between">
            <span className="text-muted-foreground">Note moyenne :</span>
            <span className="text-foreground">
              {analytics.avg_rating ? analytics.avg_rating.toFixed(1) : "N/A"} / 5
            </span>
          </div> */}
        </div>
      </div>
    </div>
  )
}
