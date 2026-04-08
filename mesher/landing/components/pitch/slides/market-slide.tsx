/* Market slide — TAM / SAM / SOM concentric rings */
'use client'

import { motion } from 'framer-motion'
import type { SlideData } from '@/lib/pitch/deck-data'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface Segment {
  label: string
  value: string
  detail: string
}

const ringSizes = [
  { w: 460, h: 460, opacity: 0.06 },
  { w: 330, h: 330, opacity: 0.1 },
  { w: 200, h: 200, opacity: 0.16 },
]

export function MarketSlide({ slide }: { slide: SlideData }) {
  const segments = (slide.extra?.segments ?? []) as Segment[]

  return (
    <div className="flex h-full w-full items-center px-[140px]">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 grid w-full grid-cols-[1fr_auto] items-center gap-24"
      >
        <div className="space-y-10">
          <motion.div variants={fadeUp}>
            <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-accent">
              {slide.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="max-w-[720px] text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
          >
            {slide.title}
          </motion.h2>

          <motion.div variants={fadeUp} className="space-y-5 pt-2">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-6">
                <div className="min-w-[140px] rounded-xl border border-accent/15 bg-accent/[0.05] px-6 py-5 text-center">
                  <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-accent/80">
                    {s.label}
                  </p>
                  <p className="mt-2 text-[38px] font-semibold tabular-nums text-foreground">
                    {s.value}
                  </p>
                </div>
                <p className="text-[22px] leading-[1.45] text-muted-foreground">
                  {s.detail}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Concentric rings visualization */}
        <motion.div
          variants={fadeUp}
          className="relative flex h-[500px] w-[500px] items-center justify-center"
        >
          {ringSizes.map((ring, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.6, type: 'spring' }}
              className="absolute rounded-full border border-accent/20"
              style={{
                width: ring.w,
                height: ring.h,
                backgroundColor: `rgba(0, 207, 133, ${ring.opacity})`,
              }}
            />
          ))}
          {segments.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.15 }}
              className="absolute font-mono text-[16px] font-semibold uppercase tracking-wider text-accent"
              style={{
                top: `${20 + i * 26}%`,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {s.label}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
