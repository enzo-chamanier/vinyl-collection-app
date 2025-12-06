import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Disc, Home, ScanLine, Search, User, ArrowUp } from "lucide-react"
import { api } from "@/lib/api"

export function MobileNav() {
    const pathname = usePathname()
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [lastScrollY, setLastScrollY] = useState(0)
    const [profilePicture, setProfilePicture] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = await api.get("/users/profile/me")
                if (user?.user?.profile_picture) {
                    setProfilePicture(user.user.profile_picture)
                }
            } catch (error) {
                console.error("Failed to fetch profile for nav", error)
            }
        }
        fetchProfile()
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Show scroll top button if scrolled down more than 100px
            // and hide navbar if scrolling down
            if (currentScrollY > 100) {
                setShowScrollTop(true)
            } else {
                setShowScrollTop(false)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [lastScrollY])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const navItems = [
        { href: "/dashboard", label: "Collection", icon: Disc },
        { href: "/feed", label: "Fil", icon: Home },
        { href: "/scan", label: "Scan", icon: ScanLine },
        { href: "/friends", label: "Recherche", icon: Search }, // Changed from Amis to Recherche
        { href: "/profile", label: "Profil", icon: User, isProfile: true },
    ]

    const isActive = (path: string) => pathname === path

    if (showScrollTop) {
        return (
            <button
                onClick={scrollToTop}
                className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-3 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4"
                aria-label="Retour en haut"
            >
                <ArrowUp size={24} />
            </button>
        )
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 z-50 pb-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    if (item.isProfile && profilePicture) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? "opacity-100" : "opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${active ? "border-white" : "border-transparent"}`}>
                                    <img src={profilePicture} alt="Profil" className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-[10px] font-medium ${active ? "text-white" : "text-neutral-500"}`}>{item.label}</span>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? "text-white" : "text-neutral-500 hover:text-white"
                                }`}
                        >
                            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
