import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions<T> {
    fetchFn: (offset: number, limit: number) => Promise<{ data: T[]; hasMore: boolean; total: number }>
    limit?: number
    initialLoad?: boolean
}

interface UseInfiniteScrollReturn<T> {
    data: T[]
    loading: boolean
    loadingMore: boolean
    hasMore: boolean
    total: number
    loadMore: () => void
    refresh: () => void
    setData: React.Dispatch<React.SetStateAction<T[]>>
}

export function useInfiniteScroll<T>({
    fetchFn,
    limit = 20,
    initialLoad = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(initialLoad)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [total, setTotal] = useState(0)
    const offsetRef = useRef(0)

    const isLoadingRef = useRef(false)

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isLoadingRef.current) return

        isLoadingRef.current = true
        if (isRefresh) {
            setLoading(true)
            offsetRef.current = 0
        } else {
            setLoadingMore(true)
        }

        try {
            const result = await fetchFn(offsetRef.current, limit)

            if (isRefresh) {
                setData(result.data)
                // Reset offset to length of received data
                offsetRef.current = result.data.length
            } else {
                setData(prev => [...prev, ...result.data])
                offsetRef.current += result.data.length
            }

            setHasMore(result.hasMore)
            setTotal(result.total)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            isLoadingRef.current = false
        }
    }, [fetchFn, limit])

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchData(false)
        }
    }, [fetchData, loadingMore, hasMore])

    const refresh = useCallback(() => {
        fetchData(true)
    }, [fetchData])

    useEffect(() => {
        if (initialLoad) {
            fetchData(true)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        loadingMore,
        hasMore,
        total,
        loadMore,
        refresh,
        setData,
    }
}

// Scroll trigger component
export function InfiniteScrollTrigger({
    onTrigger,
    loading,
    hasMore,
}: {
    onTrigger: () => void
    loading: boolean
    hasMore: boolean
}) {
    const triggerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const currentRef = triggerRef.current
        if (!currentRef || !hasMore || loading) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onTrigger()
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        )

        observer.observe(currentRef)

        return () => {
            observer.disconnect()
        }
    }, [onTrigger, loading, hasMore])

    if (!hasMore) return null

    return (
        <div ref={triggerRef} className="flex justify-center py-8 min-h-[80px]">
            {loading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
                <button
                    onClick={onTrigger}
                    className="text-sm text-primary hover:underline"
                >
                    Charger plus...
                </button>
            )}
        </div>
    )
}

