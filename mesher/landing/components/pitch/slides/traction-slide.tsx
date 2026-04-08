/* Traction slide — early signals + metrics */
'use client'

import { motion } from 'framer-motion'
import type { SlideData } from '@/lib/pitch/deck-data'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function TractionSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full items-center px-[140px]">
      <div className="pointer-events-none absolute left-[20%] bottom-[20%] h-[500px] w-[500px] rounded-full bg-accent/6 blur-[160px]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full space-y-12"
      >
        <div className="space-y-5">
          <motion.div variants={fadeUp}>
            <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-accent">
              {slide.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="max-w-[860px] text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
          >
            {slide.title}
          </motion.h2>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-start gap-20">
          {/* Bullet list */}
          {slide.bullets && (
            <motion.ul variants={fadeUp} className="max-w-[700px] space-y-6 pt-2">
              {slide.bullets.map((b, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-4 text-[24px] leading-[1.5] text-muted-foreground"
                >
                  <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                  {b}
                </motion.li>
              ))}
            </motion.ul>
          )}

          {/* Metric cards */}
          {slide.metrics && (
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-5">
              {slide.metrics.map((m) => (
                <motion.div
                  key={m.label}
                  variants={fadeUp}
                  className="min-w-[200px] rounded-2xl border border-accent/15 bg-accent/[0.04] px-7 py-7 text-center"
                >
                  <p className="text-[36px] font-semibold tabular-nums text-accent">
                    {m.value}
                  </p>
                  <p className="mt-2 font-mono text-[14px] uppercase tracking-[0.2em] text-muted-foreground">
                    {m.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
