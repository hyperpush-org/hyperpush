/* Technology moat slide — three pillars */
'use client'

import { motion } from 'framer-motion'
import { Shield, RefreshCw, Zap } from 'lucide-react'
import type { SlideData } from '@/lib/pitch/deck-data'
import type { ReactNode } from 'react'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface Pillar {
  icon: string
  label: string
  title: string
  detail: string
}

const iconMap: Record<string, ReactNode> = {
  shield: <Shield className="h-7 w-7" />,
  refresh: <RefreshCw className="h-7 w-7" />,
  zap: <Zap className="h-7 w-7" />,
}

export function TechnologySlide({ slide }: { slide: SlideData }) {
  const pillars = (slide.extra?.pillars ?? []) as Pillar[]

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-[120px]">
      <div className="pointer-events-none absolute left-[40%] top-[25%] h-[600px] w-[600px] rounded-full bg-accent/8 blur-[180px]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full space-y-14 text-center"
      >
        <div className="space-y-6">
          <motion.div variants={fadeUp}>
            <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-accent">
              {slide.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="mx-auto max-w-[960px] text-[64px] font-semibold leading-[1.06] tracking-[-0.02em] text-foreground"
          >
            {slide.title}
          </motion.h2>

          {slide.subtitle && (
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-[740px] text-[24px] leading-[1.5] text-muted-foreground"
            >
              {slide.subtitle}
            </motion.p>
          )}
        </div>

        <motion.div variants={fadeUp} className="mx-auto grid w-full max-w-[1500px] grid-cols-3 gap-8">
          {pillars.map((p) => (
            <motion.div
              key={p.label}
              variants={fadeUp}
              className="rounded-2xl border border-accent/15 bg-accent/[0.04] px-10 py-10 text-left"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15 text-accent">
                {iconMap[p.icon] ?? <Zap className="h-7 w-7" />}
              </div>
              <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-accent/80">
                {p.label}
              </p>
              <p className="mt-3 text-[26px] font-semibold leading-[1.2] text-foreground">
                {p.title}
              </p>
              <p className="mt-3 text-[20px] leading-[1.5] text-muted-foreground">
                {p.detail}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
