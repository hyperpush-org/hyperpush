/* Team slide */
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

interface Member {
  role: string
  focus: string
}

export function TeamSlide({ slide }: { slide: SlideData }) {
  const members = (slide.extra?.members ?? []) as Member[]
  const strengths = (slide.extra?.strengths ?? []) as string[]

  return (
    <div className="flex h-full w-full items-center px-[140px]">
      <div className="pointer-events-none absolute right-[15%] top-[25%] h-[500px] w-[500px] rounded-full bg-accent/6 blur-[160px]" />

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
            className="max-w-[800px] text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
          >
            {slide.title}
          </motion.h2>
        </div>

        <div className="grid grid-cols-[1fr_1fr] items-start gap-20">
          {/* Members */}
          <motion.div variants={fadeUp} className="space-y-7">
            <p className="font-mono text-[14px] uppercase tracking-[0.24em] text-muted-foreground">
              Team
            </p>
            <div className="space-y-5">
              {members.map((m) => (
                <div
                  key={m.role}
                  className="rounded-2xl border border-border/80 bg-card/60 px-8 py-7"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/12">
                    <span className="text-[28px] font-semibold text-accent">
                      {m.role.charAt(0)}
                    </span>
                  </div>
                  <p className="text-[24px] font-semibold text-foreground">{m.role}</p>
                  <p className="mt-2.5 text-[20px] leading-[1.5] text-muted-foreground">
                    {m.focus}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Why this team */}
          <motion.div variants={fadeUp} className="space-y-7">
            <p className="font-mono text-[14px] uppercase tracking-[0.24em] text-muted-foreground">
              Why this team
            </p>
            <div className="space-y-6">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[16px] font-semibold text-accent">
                    {i + 1}
                  </div>
                  <p className="pt-1 text-[22px] leading-[1.5] text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
