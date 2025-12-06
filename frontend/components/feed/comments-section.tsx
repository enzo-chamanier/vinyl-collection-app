"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Send, Trash2, Heart, MessageCircle, CornerDownRight } from "lucide-react"

interface Comment {
    id: string
    content: string
    created_at: string
    username: string
    profile_picture?: string
    user_id: string
    parent_id?: string | null
    likes_count?: number
    has_liked?: boolean
}

interface CommentsSectionProps {
    vinylId: string
    currentUserId?: string
    vinylOwnerId?: string
    onCommentAdded: () => void
    variant?: "feed" | "modal"
}

export function CommentsSection({ vinylId, currentUserId, vinylOwnerId, onCommentAdded, variant = "feed" }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState("")

    useEffect(() => {
        fetchComments()
    }, [vinylId])

    const fetchComments = async () => {
        try {
            const res = await api.get(`/interactions/comments/${vinylId}`)
            setComments(res.map((c: any) => ({ ...c, likes_count: Number(c.likes_count) })))
        } catch (error) {
            console.error("Error fetching comments:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault()
        const content = parentId ? replyContent : newComment
        if (!content.trim()) return

        setSubmitting(true)
        try {
            const res = await api.post(`/interactions/comments/${vinylId}`, { content, parentId })
            setComments(prev => [...prev, { ...res, likes_count: Number(res.likes_count) }])
            if (parentId) {
                setReplyTo(null)
                setReplyContent("")
            } else {
                setNewComment("")
            }
            onCommentAdded()
        } catch (error) {
            console.error("Error posting comment:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return

        try {
            await api.delete(`/interactions/comments/${commentId}`)
            setComments(prev => prev.filter(c => c.id !== commentId))
        } catch (error) {
            console.error("Error deleting comment:", error)
        }
    }

    const handleLike = async (commentId: string) => {
        // Optimistic update
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    has_liked: !c.has_liked,
                    likes_count: (Number(c.likes_count) || 0) + (c.has_liked ? -1 : 1)
                }
            }
            return c
        }))

        try {
            await api.post(`/interactions/comments/${commentId}/like`, {})
        } catch (error) {
            console.error("Error liking comment:", error)
            // Revert
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        has_liked: !c.has_liked,
                        likes_count: (Number(c.likes_count) || 0) + (c.has_liked ? -1 : 1)
                    }
                }
                return c
            }))
        }
    }

    const renderComment = (comment: Comment, depth = 0) => {
        const replies = comments.filter(c => c.parent_id === comment.id)
        const isOwner = vinylOwnerId && comment.user_id === vinylOwnerId

        return (
            <div key={comment.id} className={`flex gap-3 ${depth > 0 ? "ml-8 mt-2" : "mt-4"}`}>
                {comment.profile_picture ? (
                    <img
                        src={comment.profile_picture}
                        alt={comment.username}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700 flex-shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-700 flex-shrink-0">
                        {comment.username.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className={`rounded-lg p-3 relative group ${isOwner ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold text-sm ${isOwner ? "text-primary" : "text-foreground"}`}>{comment.username}</span>
                                {isOwner && (
                                    <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">
                                        Auteur
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                                {currentUserId === comment.user_id && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-foreground mt-1 break-words">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-1">
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 text-xs font-medium ${comment.has_liked ? "text-red-500" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                            <Heart size={12} fill={comment.has_liked ? "currentColor" : "none"} />
                            {comment.likes_count || 0}
                        </button>
                        <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-300"
                        >
                            <MessageCircle size={12} />
                            Répondre
                        </button>
                    </div>

                    {replyTo === comment.id && (
                        <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-2 flex gap-2">
                            <div className="w-6 flex justify-center">
                                <CornerDownRight size={16} className="text-neutral-500" />
                            </div>
                            <input
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Répondre à ${comment.username}...`}
                                className="flex-1 bg-neutral-800 border-none rounded-full px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={submitting || !replyContent.trim()}
                                className="p-1.5 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    )}

                    {replies.map(reply => renderComment(reply, depth + 1))}
                </div>
            </div>
        )
    }

    if (loading) return <div className="text-center py-4 text-sm text-neutral-500">Chargement des commentaires...</div>

    const rootComments = comments.filter(c => !c.parent_id)
    const isModal = variant === "modal"

    return (
        <div className={`flex flex-col ${isModal ? "h-full" : "mt-4 border-t border-neutral-800 pt-4"}`}>
            <div className={`space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-2 ${isModal ? "flex-1" : "max-h-96"}`}>
                {rootComments.length === 0 ? (
                    <p className="text-center text-sm text-neutral-500 py-2">Aucun commentaire pour le moment.</p>
                ) : (
                    rootComments.map(comment => renderComment(comment))
                )}
            </div>

            <form onSubmit={(e) => handleSubmit(e)} className={`flex gap-2 ${isModal ? "border-t border-border pt-4 mt-auto" : "sticky bottom-0 bg-neutral-900 pt-2"}`}>
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 bg-neutral-800 border-none rounded-full px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    )
}
