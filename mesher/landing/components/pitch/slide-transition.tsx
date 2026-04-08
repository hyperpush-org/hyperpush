/* ------------------------------------------------------------------
 *  Slide transition wrapper — horizontal slide with fade
 * ----------------------------------------------------------------- */
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SlideTransitionProps {
  slideKey: string
  direction: number // -1 = going back, +1 = going forward
  children: ReactNode
}

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 400 : -400,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -400 : 400,
    opacity: 0,
  }),
}

const transition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 30,
  mass: 0.9,
}

export function SlideTransition({ slideKey, direction, children }: SlideTransitionProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={slideKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="absolute inset-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
