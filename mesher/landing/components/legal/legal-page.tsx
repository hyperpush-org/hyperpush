"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronRight, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Footer } from "@/components/landing/footer"

const legalNav = [
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms of Service", href: "/terms" },
  { title: "License", href: "/license" },
]

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
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
              <span className="text-sm text-muted-foreground font-mono hidden sm:inline">/legal</span>
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
              <p className="text-xs font-mono text-accent uppercase tracking-wider mb-3 px-3">Legal</p>
              <ul className="space-y-0.5">
                {legalNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                        pathname === item.href
                          ? "text-foreground bg-muted font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0 md:pl-8">
            <article className="max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
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
                <p className="text-sm text-muted-foreground mb-8 font-mono">
                  Last updated: {lastUpdated}
                </p>
              </motion.div>

              <div className="h-px bg-border mb-10" />

              {/* Mobile legal nav */}
              <div className="md:hidden flex gap-2 mb-10 overflow-x-auto pb-2">
                {legalNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      pathname === item.href
                        ? "border-accent/30 bg-accent/5 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>

              {/* Content */}
              <div className="legal-content space-y-8">
                {children}
              </div>
            </article>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Reusable building blocks for legal content                        */
/* ------------------------------------------------------------------ */

export function Section({ id, number, title, children }: { id?: string; number?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-baseline gap-3">
        {number && <span className="text-accent font-mono text-lg">{number}</span>}
        {title}
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  )
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </div>
  )
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 text-sm text-muted-foreground leading-relaxed">
      {children}
    </div>
  )
}
