"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { SearchUsers } from "@/components/friends/search-users"
import { FriendsList } from "@/components/friends/friends-list"
import { api } from "@/lib/api"

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [following, _setFollowing] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleSearch = async () => {
    setSearching(true)
    try {
      const results = await api.get(`/followers/search/${searchQuery}`)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-primary font-bold mb-8">Trouver des amis</h1>

        <SearchUsers query={searchQuery} onQueryChange={setSearchQuery} results={searchResults} searching={searching} />

        <div className="mt-12">
          <h2 className="text-2xl text-primary font-bold mb-6">Vos abonnements</h2>
          <FriendsList following={following} />
        </div>
      </div>
    </AppLayout>
  )
}
