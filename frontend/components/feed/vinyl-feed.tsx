import { VinylColorData, getVinylBackground } from "../vinyl/vinyl-color-picker"

interface FeedItem {
  id: string
  title: string
  artist: string
  username: string
  profile_picture?: string
  cover_image?: string
  date_added: string
  vinyl_color?: string
  disc_count?: number
}

interface VinylFeedProps {
  items?: FeedItem[] | null
  loading: boolean
}

export function VinylFeed({ items, loading }: VinylFeedProps) {
  const feedItems = Array.isArray(items) ? items : []

  if (loading) {
    return <div className="text-center text-text-secondary">Chargement du fil d'actualité...</div>
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Aucun élément dans le fil d'actualité</h3>
        <p className="text-text-secondary">Suivez des utilisateurs pour voir leurs collections</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedItems.map((item) => {
        // Parse vinyl color
        let colorData: VinylColorData | VinylColorData[] | null = null

        if (item.vinyl_color) {
          try {
            const parsed = JSON.parse(item.vinyl_color)
            if ((Array.isArray(parsed) && parsed.length > 0) || (parsed.type && parsed.primary)) {
              colorData = parsed
            }
          } catch (e) {
            if (item.vinyl_color !== "Black") {
              colorData = {
                type: ["Clear", "Transparent"].includes(item.vinyl_color) ? "transparent" : "solid",
                primary: item.vinyl_color
              }
            }
          }
        }

        const discCount = item.disc_count || 1
        const displayColors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : [])

        return (
          <div key={item.id} className="bg-surface rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                {/* Vinyl Color Icons */}
                <div className="absolute top-1 left-1 z-20 flex -space-x-2">
                  {Array.from({ length: Math.min(discCount, 3) }).map((_, i) => {
                    const color = displayColors[i]
                    return (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full shadow-sm flex items-center justify-center relative"
                        style={{
                          background: color ? getVinylBackground(color.type, color.primary, color.secondary) : "#1a1a1a",
                          border: "1px solid rgba(255,255,255,0.2)",
                          zIndex: 30 - i
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                      </div>
                    )
                  })}
                </div>

                {item.cover_image ? (
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="w-full h-full rounded object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold text-center px-2">
                    {item.title}
                  </div>
                )}

                {/* Disc Count Badge */}
                <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white px-1 rounded border border-white/20">
                  {discCount}xLP
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {item.profile_picture ? (
                    <img
                      src={item.profile_picture}
                      alt={item.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold">{item.username}</span>
                </div>

                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-text-secondary text-sm">{item.artist.replace(/\s*\([^)]*\)/g, "")}</p>
                <p className="text-text-tertiary text-xs mt-1">
                  {new Date(item.date_added).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
