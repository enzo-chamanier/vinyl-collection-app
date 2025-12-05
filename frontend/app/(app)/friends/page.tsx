"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { SearchUsers } from "@/components/friends/search-users"
import { FriendsList } from "@/components/friends/friends-list"
import { api } from "@/lib/api"
import { FullScreenLoader } from "@/components/ui/full-screen-loader"

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [following, setFollowing] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (user.id) {
          const res = await api.get(`/followers/following/${user.id}`)
          setFollowing(res)
        }
      } catch (error) {
        console.error("Error fetching following:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFollowing()
  }, [])

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

  if (loading) {
    return <FullScreenLoader message="Chargement de vos amis..." />
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
