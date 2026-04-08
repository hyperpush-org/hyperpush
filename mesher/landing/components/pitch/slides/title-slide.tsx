/* Title slide — company name, tagline, one-line value prop */
'use client'

import { motion } from 'framer-motion'
import type { SlideData } from '@/lib/pitch/deck-data'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export function TitleSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-[140px]">
      {/* Decorative orb */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[200px]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-12 text-center"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/8 px-6 py-2.5"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-mono text-[18px] uppercase tracking-[0.3em] text-accent">
            {slide.eyebrow}
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="max-w-[1200px] whitespace-pre-line text-[96px] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground"
        >
          {slide.title}
        </motion.h1>

        {slide.subtitle && (
          <motion.p
            variants={fadeUp}
            className="max-w-[800px] text-[28px] leading-[1.5] text-muted-foreground"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {slide.metrics && (
          <motion.div variants={fadeUp} className="mt-6 flex gap-8">
            {slide.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-border/80 bg-card/70 px-8 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              >
                <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-2 text-[24px] font-medium tabular-nums text-foreground">
                  {m.value}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
