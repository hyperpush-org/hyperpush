import type { ReactNode } from 'react'

export const metadata = {
  title: 'hyperpush — Error Tracking Dashboard',
  description:
    'Open source error tracking with token rewards. Sentry-like dashboard for web, mobile, and Solana.',
}

export default function LegacyAppLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
