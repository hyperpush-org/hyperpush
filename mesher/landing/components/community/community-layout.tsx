"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronRight, Trophy, Target, BookOpen, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Footer } from "@/components/landing/footer"
import type { SVGProps } from "react"

function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

const communityNav = [
  { title: "Leaderboard", href: "/community/leaderboard", icon: Trophy },
  { title: "Bounties", href: "/community/bounties", icon: Target },
  { title: "Blog", href: "/community/blog", icon: BookOpen },
  { title: "Discord", href: "https://discord.gg/hyperpush", icon: DiscordIcon, external: true },
]

export function CommunityLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between rounded-full border border-border bg-background/80 backdrop-blur-md px-6 py-3">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo-light.svg" alt="hyperpush" className="h-7" />
              <span className="text-sm text-muted-foreground font-mono hidden sm:inline">/community</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button size="sm">Join Waitlist</Button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden mt-2 rounded-2xl border border-border bg-background/95 backdrop-blur-md p-6"
              >
                <div className="space-y-4">
                  <Link href="/" className="block text-lg text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                  <Link href="/docs" className="block text-lg text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                  <Link href="/#pricing" className="block text-lg text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                  <div className="pt-4 border-t border-border">
                    <Button className="w-full">Join Waitlist</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto px-6 pt-28 pb-24 w-full">
        <div className="flex gap-0">
          {/* Sidebar */}
          <div className="hidden md:block w-56 shrink-0">
            <div className="sticky top-28 pr-4">
              <p className="text-xs font-mono text-accent uppercase tracking-wider mb-3 px-3">Community</p>
              <ul className="space-y-0.5">
                {communityNav.map((item) => {
                  const isActive = pathname.startsWith(item.href) && !item.external

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className={`flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                          isActive
                            ? "text-foreground bg-muted font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.title}
                        {item.external && (
                          <svg className="w-3 h-3 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0 md:pl-8">
            <div className="max-w-5xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/community/leaderboard" className="hover:text-foreground transition-colors">Community</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground">{title}</span>
              </div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-lg text-muted-foreground mb-8 text-pretty">
                    {subtitle}
                  </p>
                )}
              </motion.div>

              <div className="h-px bg-border mb-10" />

              {/* Mobile community nav */}
              <div className="md:hidden flex gap-2 mb-10 overflow-x-auto pb-2">
                {communityNav.filter(n => !n.external).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      pathname.startsWith(item.href)
                        ? "border-accent/30 bg-accent/5 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.title}
                  </Link>
                ))}
              </div>

              {/* Content */}
              {children}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
