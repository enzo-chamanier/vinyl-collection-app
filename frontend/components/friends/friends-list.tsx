"use client"
import Link from "next/link"
import { ProfilePreviewCard } from "./profile-preview-card"
interface FriendsListProps {
  following: any[]
}

export function FriendsList({ following }: FriendsListProps) {
  if (following.length === 0) {
    return (
      <div className="text-center text-text-secondary py-8">
        Vous ne suivez encore personne. Trouvez des amis et commencez à suivre leurs collections !
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {following.map((friend) => (
        <ProfilePreviewCard key={friend.id} profile={friend} />
      ))}
    </div>
  )
}
