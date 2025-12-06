"use client"

import { useState, useEffect, useRef } from "react"
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
    scrollToCommentId?: string
}

export function CommentsSection({ vinylId, currentUserId, vinylOwnerId, onCommentAdded, variant = "feed", scrollToCommentId }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState("")
    const [highlightedComment, setHighlightedComment] = useState<string | null>(null)
    const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

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

    // Scroll to specific comment when loaded
    useEffect(() => {
        if (!loading && scrollToCommentId && commentRefs.current[scrollToCommentId]) {
            setTimeout(() => {
                commentRefs.current[scrollToCommentId]?.scrollIntoView({ behavior: "smooth", block: "center" })
                setHighlightedComment(scrollToCommentId)
                setTimeout(() => setHighlightedComment(null), 3000)
            }, 200)
        }
    }, [loading, scrollToCommentId])

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
        const isHighlighted = highlightedComment === comment.id

        return (
            <div
                key={comment.id}
                id={`comment-${comment.id}`}
                ref={el => { commentRefs.current[comment.id] = el }}
                className={`flex gap-2 ${depth > 0 ? "ml-6 mt-2" : "mt-3"} ${isHighlighted ? "animate-pulse ring-2 ring-primary rounded-lg p-1" : ""}`}
            >
                {comment.profile_picture ? (
                    <img
                        src={comment.profile_picture}
                        alt={comment.username}
                        className="w-7 h-7 rounded-full object-cover border border-neutral-700 flex-shrink-0"
                    />
                ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-700 flex-shrink-0">
                        {comment.username.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className={`rounded-lg p-2 ${isOwner ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                        <div className="flex flex-wrap items-center gap-1">
                            <span className={`font-semibold text-xs ${isOwner ? "text-primary" : "text-foreground"}`}>
                                {comment.username}
                            </span>
                            {isOwner && (
                                <span className="text-[9px] bg-primary dark:bg-primary-foreground dark:text-white px-1 py-0.5 rounded-full font-medium">
                                    Auteur
                                </span>
                            )}
                            <span className="text-[9px] text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                            {currentUserId === comment.user_id && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors ml-auto"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-foreground mt-1 break-words">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-3 mt-1 ml-1">
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 text-xs font-medium ${comment.has_liked ? "text-red-500" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                            <Heart size={11} fill={comment.has_liked ? "currentColor" : "none"} />
                            {comment.likes_count || 0}
                        </button>
                        <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-300"
                        >
                            <MessageCircle size={11} />
                            Répondre
                        </button>
                    </div>

                    {replyTo === comment.id && (
                        <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-2 flex gap-2">
                            <div className="w-5 flex justify-center">
                                <CornerDownRight size={14} className="text-neutral-500" />
                            </div>
                            <input
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Répondre...`}
                                className="flex-1 bg-neutral-800 border-none rounded-full px-3 py-1 text-sm text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={submitting || !replyContent.trim()}
                                className="p-1 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <Send size={12} />
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
            <div className={`space-y-2 mb-4 overflow-y-auto custom-scrollbar pr-1 ${isModal ? "flex-1" : "max-h-96"}`}>
                {rootComments.length === 0 ? (
                    <p className="text-center text-sm text-neutral-500 py-2">Aucun commentaire pour le moment.</p>
                ) : (
                    rootComments.map(comment => renderComment(comment))
                )}
            </div>

            <form onSubmit={(e) => handleSubmit(e)} className={`flex gap-2 flex-shrink-0 ${isModal ? "border-t border-border pt-3 pb-2 mt-auto bg-neutral-900" : "sticky bottom-0 bg-neutral-900 pt-2"}`}>
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 min-w-0 bg-neutral-800 border-none rounded-full px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    )
}
