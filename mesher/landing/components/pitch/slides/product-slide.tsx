/* Product slide — workflow panels + optional screenshot */
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { SlideData } from '@/lib/pitch/deck-data'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface Panel {
  icon: string
  label: string
  text: string
}

export function ProductSlide({ slide }: { slide: SlideData }) {
  const panels = (slide.extra?.panels ?? []) as Panel[]
  const image = slide.extra?.image as string | undefined

  return (
    <div className="flex h-full w-full items-center px-[120px]">
      <div className="pointer-events-none absolute right-[5%] top-[30%] h-[480px] w-[480px] rounded-full bg-accent/6 blur-[160px]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 grid w-full grid-cols-[1fr_1fr] items-center gap-20"
      >
        <div className="space-y-10">
          <motion.div variants={fadeUp}>
            <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-accent">
              {slide.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-[60px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground"
          >
            {slide.title}
          </motion.h2>

          {slide.body && (
            <motion.p
              variants={fadeUp}
              className="max-w-[560px] text-[22px] leading-[1.55] text-muted-foreground"
            >
              {slide.body}
            </motion.p>
          )}

          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-5 pt-2">
            {panels.map((p) => (
              <div
                key={p.label}
                className="rounded-xl border border-border/80 bg-card/60 px-6 py-5"
              >
                <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-accent">
                  {p.label}
                </p>
                <p className="mt-2 text-[18px] leading-[1.5] text-muted-foreground">
                  {p.text}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {image && (
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-2xl border border-border/80 bg-card/50 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
          >
            <Image
              src={image}
              alt="Product screenshot"
              width={800}
              height={480}
              className="h-auto w-full"
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
