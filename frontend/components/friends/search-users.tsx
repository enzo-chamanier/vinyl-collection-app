"use client"

import { UserCard } from "./user-card"

interface SearchUsersProps {
  query: string
  onQueryChange: (query: string) => void
  results: any[]
  searching: boolean
}

export function SearchUsers({ query, onQueryChange, results, searching }: SearchUsersProps) {
  return (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="Rechercher par nom d'utilisateur..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full text-lg"
        />
      </div>

      {searching && <div className="text-center text-text-secondary">Recherche en cours...</div>}

      {!searching && results.length > 0 && (
        <div className="grid gap-4">
          {results.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {!searching && query && results.length === 0 && (
        <div className="text-center text-text-secondary py-8">Aucun utilisateur trouvé correspondant à "{query}"</div>
      )}
    </div>
  )
}
