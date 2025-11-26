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
    return <div className="text-center text-text-secondary">Chargement des données...</div>
  }

  if (!analytics) {
    return <div className="text-center text-text-secondary">Aucune donnée disponible</div>
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
          <div key={metric.label} className="bg-surface rounded-lg p-6 text-center border border-border">
            <div className="text-3xl mb-2">{metric.icon}</div>
            <p className="text-3xl font-bold text-secondary mb-2">{metric.value}</p>
            <p className="text-text-secondary">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold mb-4">Chronologie de la collection</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Premier vinyle ajouté :</span>
            <span className="text-text-primary">{new Date(analytics.first_added).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Dernier vinyle ajouté :</span>
            <span className="text-text-primary">{new Date(analytics.last_added).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Note moyenne :</span>
            <span className="text-text-primary">
              {analytics.avg_rating ? analytics.avg_rating.toFixed(1) : "N/A"} / 5
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
