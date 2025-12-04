"use client"
import Link from "next/link"
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
    <div className="grid gap-4">
      {following.map((friend) => (
        <Link key={friend.id} href={`/profile/${friend.username}`} className="block">
          <div className="bg-surface rounded-lg p-4 hover:bg-surface/80 transition border border-border">
            <h3 className="font-semibold text-white">{friend.username}</h3>
            <p className="text-text-secondary text-sm">{friend.vinyls?.length || 0} vinyles</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
