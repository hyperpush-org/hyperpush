/* Problem slide — pain point with big metrics */
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

export function ProblemSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full items-center px-[140px]">
      {/* Danger-tinted orb */}
      <div className="pointer-events-none absolute right-[10%] top-[20%] h-[520px] w-[520px] rounded-full bg-destructive/6 blur-[160px]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 grid w-full grid-cols-[1fr_auto] items-center gap-24"
      >
        <div className="space-y-10">
          <motion.div variants={fadeUp}>
            <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-destructive">
              {slide.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="max-w-[820px] text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
          >
            {slide.title}
          </motion.h2>

          {slide.bullets && (
            <motion.ul variants={fadeUp} className="max-w-[740px] space-y-6">
              {slide.bullets.map((b, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-5 text-[22px] leading-[1.55] text-muted-foreground"
                >
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/12 font-mono text-[15px] font-medium text-destructive">
                    {i + 1}
                  </span>
                  {b}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>

        {slide.metrics && (
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            {slide.metrics.map((m) => (
              <div
                key={m.label}
                className="min-w-[260px] rounded-2xl border border-destructive/15 bg-destructive/5 px-8 py-7"
              >
                <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-destructive/80">
                  {m.label}
                </p>
                <p className="mt-3 text-[44px] font-semibold tabular-nums text-foreground">
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
