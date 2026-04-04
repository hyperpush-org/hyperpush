"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hp_signal_v1"

// 5 PM EST = UTC−5 → 22:00 UTC
function getTargetTime(): Date {
  const now = new Date()
  const t = new Date(now)
  t.setUTCHours(22, 0, 0, 0)
  if (t.getTime() <= now.getTime()) {
    t.setUTCDate(t.getUTCDate() + 1)
  }
  return t
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function calcRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    ms: diff,
  }
}

// Deterministic noise grid — avoids hydration mismatches
const HEX = "0123456789ABCDEF"
const NOISE_ROWS = Array.from({ length: 22 }, (_, r) =>
  Array.from({ length: 52 }, (_, c) =>
    HEX[(r * 53 + c * 31 + r * c * 7 + 3) % 16]
  ).join(" ")
)

// ─── Sub-components ───────────────────────────────────────────────────────────

function Colon() {
  return (
    <motion.span
      className="font-mono text-2xl sm:text-3xl font-bold text-muted-foreground/30 select-none self-start mt-6"
      animate={{ opacity: [1, 0.15, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    >
      :
    </motion.span>
  )
}

function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[78px] h-[88px] sm:w-[96px] sm:h-[108px] flex items-center justify-center rounded-xl border border-border bg-card overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] to-transparent pointer-events-none" />
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-accent/25" />
        {/* Bottom shadow line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-black/40" />

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 18, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -18, opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-4xl sm:text-5xl font-bold tabular-nums text-foreground tracking-tighter"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">
        {label}
      </span>
    </div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

type Phase = "counting" | "revealing" | "done"

export function CountdownOverlay() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<Phase>("counting")
  const targetRef = useRef<Date | null>(null)
  const totalMsRef = useRef(0)
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, ms: 0 })

  // Mount — check storage and set up initial state
  useEffect(() => {
    setMounted(true)

    // URL bypass: /?access=beta skips the overlay for this session
    const params = new URLSearchParams(window.location.search)
    if (params.get("access") === "beta") return

    if (localStorage.getItem(STORAGE_KEY)) return

    const target = getTargetTime()
    targetRef.current = target
    const initial = calcRemaining(target)
    totalMsRef.current = initial.ms

    if (initial.ms <= 0) {
      localStorage.setItem(STORAGE_KEY, "1")
      return
    }

    setRemaining(initial)
    setVisible(true)
  }, [])

  // Ticker
  useEffect(() => {
    if (!visible || phase !== "counting") return

    const id = setInterval(() => {
      const r = calcRemaining(targetRef.current!)
      setRemaining(r)

      if (r.ms <= 0) {
        setPhase("revealing")
        localStorage.setItem(STORAGE_KEY, "1")
        // After reveal animation, dismiss the overlay
        setTimeout(() => setPhase("done"), 2_600)
      }
    }, 250)

    return () => clearInterval(id)
  }, [visible, phase])

  // Progress 0 → 100 as time elapses
  const progress =
    totalMsRef.current > 0
      ? Math.max(0, Math.min(100, (1 - remaining.ms / totalMsRef.current) * 100))
      : 100

  if (!mounted) return null

  return (
    <AnimatePresence>
      {visible && phase !== "done" && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            y: "-100%",
            opacity: 0,
            transition: { duration: 1.1, ease: [0.76, 0, 0.24, 1] },
          }}
        >
          {/* ── Dark backdrop ─────────────────────────────────────────── */}
          <div className="absolute inset-0 bg-background/[0.96] backdrop-blur-md" />

          {/* ── Hex noise field ───────────────────────────────────────── */}
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden pointer-events-none select-none"
          >
            <pre className="text-foreground/[0.028] font-mono text-[10px] leading-[1.6] tracking-wider px-6 pt-4 whitespace-pre">
              {NOISE_ROWS.join("\n")}
            </pre>
          </div>

          {/* ── Ambient glow blobs ────────────────────────────────────── */}
          <div className="absolute top-[20%] left-[15%] w-[480px] h-[280px] rounded-full bg-accent/[0.06] blur-[110px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[15%] w-[320px] h-[200px] rounded-full bg-accent/[0.04] blur-[90px] pointer-events-none" />

          {/* ── Signal flash on reveal ────────────────────────────────── */}
          <AnimatePresence>
            {phase === "revealing" && (
              <motion.div
                key="flash"
                className="absolute inset-0 bg-accent/10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, times: [0, 0.2, 1] }}
              />
            )}
          </AnimatePresence>

          {/* ── Main content ──────────────────────────────────────────── */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-7 px-4 w-full"
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            {/* ── Status pill ─────────────────────────────────── */}
            <div className="flex items-center gap-2.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent">
              <motion.span
                className="h-[5px] w-[5px] rounded-full bg-accent inline-block"
                animate={{ opacity: phase === "counting" ? [1, 0.2, 1] : 1 }}
                transition={{ duration: 1.5, repeat: phase === "counting" ? Infinity : 0, ease: "easeInOut" }}
              />
              {phase === "counting" ? "signal incoming" : "signal received"}
              <motion.span
                className="h-[5px] w-[5px] rounded-full bg-accent inline-block"
                animate={{ opacity: phase === "counting" ? [1, 0.2, 1] : 1 }}
                transition={{ duration: 1.5, repeat: phase === "counting" ? Infinity : 0, ease: "easeInOut", delay: 0.75 }}
              />
            </div>

            {/* ── Card ────────────────────────────────────────── */}
            <Card className="relative w-full max-w-[480px] border-border bg-card/70 backdrop-blur-sm shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] overflow-hidden py-0 gap-0">

              {/* Scan line — only while counting */}
              {phase === "counting" && (
                <motion.div
                  className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent pointer-events-none z-10"
                  animate={{ top: ["-1px", "100%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                />
              )}

              <CardContent className="flex flex-col items-center gap-6 px-6 py-8 sm:px-8 sm:py-10">
                {/* Header label */}
                <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.38em] text-muted-foreground/60">
                  {phase === "counting"
                    ? "// transmission begins in"
                    : "// decrypting payload"}
                </p>

                {/* Timer or reveal state */}
                <AnimatePresence mode="wait">
                  {phase === "counting" ? (
                    <motion.div
                      key="timer"
                      className="flex items-start gap-3 sm:gap-5"
                      exit={{ scale: 0.88, opacity: 0, transition: { duration: 0.25 } }}
                    >
                      <DigitBlock value={pad(remaining.hours)} label="hours" />
                      <Colon />
                      <DigitBlock value={pad(remaining.minutes)} label="minutes" />
                      <Colon />
                      <DigitBlock value={pad(remaining.seconds)} label="seconds" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="revealed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-center gap-4 py-2"
                    >
                      <motion.div
                        className="relative w-14 h-14 rounded-full border border-accent/40 bg-accent/[0.08] flex items-center justify-center"
                        animate={{
                          boxShadow: [
                            "0 0 0 0px oklch(0.75 0.18 160 / 0.4)",
                            "0 0 0 18px oklch(0.75 0.18 160 / 0)",
                          ],
                        }}
                        transition={{ duration: 1.1, repeat: Infinity }}
                      >
                        <motion.div
                          className="w-2.5 h-2.5 rounded-full bg-accent"
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity }}
                        />
                      </motion.div>
                      <p className="font-mono text-xs text-muted-foreground tracking-[0.15em]">
                        establishing connection
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress bar — grows as we approach target */}
                {phase === "counting" && (
                  <div className="w-full space-y-2">
                    <Progress
                      value={progress}
                      className="h-[2px] bg-border/60 [&>[data-slot=progress-indicator]]:bg-accent [&>[data-slot=progress-indicator]]:transition-none"
                    />
                    <div className="flex justify-between font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                      <span>
                        T−{pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
                      </span>
                      <span className="text-accent/60">17:00 EST</span>
                    </div>
                  </div>
                )}

                <Separator className="opacity-20" />

                {/* Footer copy */}
                <p className="font-mono text-[9px] text-muted-foreground/40 text-center tracking-[0.12em]">
                  {phase === "counting"
                    ? "// await operator confirmation · do not refresh"
                    : "// signal authenticated · loading interface"}
                </p>
              </CardContent>
            </Card>

            {/* ── Atmospheric bottom text ────────────────────── */}
            {phase === "counting" && (
              <motion.p
                className="font-mono text-[9px] text-muted-foreground/25 tracking-[0.25em] uppercase"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                encrypted channel · standing by
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
