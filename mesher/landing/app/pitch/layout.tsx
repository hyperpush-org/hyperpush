import type { Metadata } from 'next'
import { deckData } from '@/lib/pitch/deck-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hyperpush.dev'
const canonicalUrl = `${siteUrl}/pitch`

export const metadata: Metadata = {
  title: deckData.routeTitle,
  description: deckData.routeDescription,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: deckData.routeTitle,
    description: deckData.routeDescription,
    url: canonicalUrl,
  },
  twitter: {
    title: deckData.routeTitle,
    description: deckData.routeDescription,
  },
}

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return children
}
