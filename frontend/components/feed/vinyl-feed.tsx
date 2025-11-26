"use client"

interface FeedItem {
  id: string
  title: string
  artist: string
  username: string
  profile_picture?: string
  cover_image?: string
  date_added: string
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
      {feedItems.map((item) => (
        <div key={item.id} className="bg-surface rounded-lg p-4">
          <div className="flex items-start gap-4">
            {item.cover_image ? (
              <img
                src={item.cover_image}
                alt={item.title}
                className="w-20 h-20 rounded object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold text-center px-2">
                {item.title}
              </div>
            )}

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
              <p className="text-text-secondary text-sm">{item.artist}</p>
              <p className="text-text-tertiary text-xs mt-1">
                {new Date(item.date_added).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
