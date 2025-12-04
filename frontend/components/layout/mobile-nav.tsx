import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Disc, Home, ScanLine, Users, User, ArrowUp } from "lucide-react"

export function MobileNav() {
    const pathname = usePathname()
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [lastScrollY, setLastScrollY] = useState(0)

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
        { href: "/scan", label: "Scan", icon: ScanLine },
        { href: "/feed", label: "Fil", icon: Home },
        { href: "/friends", label: "Amis", icon: Users },
        { href: "/profile", label: "Profil", icon: User },
    ]

    const isActive = (path: string) => pathname === path

    if (showScrollTop) {
        return (
            <button
                onClick={scrollToTop}
                className="md:hidden fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4"
                aria-label="Retour en haut"
            >
                <ArrowUp size={24} />
            </button>
        )
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 pb-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? "text-white" : "text-text-secondary hover:text-text-primary"
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
