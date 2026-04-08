/* Solution slide — what hyperpush does */
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

export function SolutionSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full items-center px-[140px]">
      <div className="pointer-events-none absolute left-[15%] bottom-[15%] h-[600px] w-[600px] rounded-full bg-accent/6 blur-[180px]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full space-y-12"
      >
        <motion.div variants={fadeUp}>
          <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-accent">
            {slide.eyebrow}
          </span>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="max-w-[1000px] text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
        >
          {slide.title}
        </motion.h2>

        {slide.subtitle && (
          <motion.p
            variants={fadeUp}
            className="max-w-[760px] text-[26px] leading-[1.5] text-muted-foreground"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {slide.bullets && (
          <motion.div variants={fadeUp} className="grid w-full grid-cols-3 gap-8 pt-4">
            {slide.bullets.map((b, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl border border-accent/15 bg-accent/[0.04] px-8 py-8"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 font-mono text-[18px] font-semibold text-accent">
                  {i + 1}
                </div>
                <p className="text-[22px] leading-[1.5] text-muted-foreground">{b}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
