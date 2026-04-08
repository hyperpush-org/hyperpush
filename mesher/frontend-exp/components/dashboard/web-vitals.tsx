"use client"

import { MOCK_WEB_VITALS, type VitalRating } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const ratingConfig: Record<VitalRating, { label: string; color: string; bg: string; ring: string }> = {
  good: { label: "Good", color: "var(--green)", bg: "var(--green-dim)", ring: "ring-[var(--green)]/20" },
  "needs-improvement": { label: "Meh", color: "var(--yellow)", bg: "var(--yellow-dim)", ring: "ring-[var(--yellow)]/20" },
  poor: { label: "Poor", color: "var(--red)", bg: "var(--red-dim)", ring: "ring-[var(--red)]/20" },
}

function VitalCard({ vital, compact }: { vital: typeof MOCK_WEB_VITALS[0]; compact: boolean }) {
  const rc = ratingConfig[vital.rating]
  const pct = Math.min(100, (vital.value / vital.target) * 100)

  return (
    <div className="min-w-0 flex-1 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">{vital.abbrev}</span>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset uppercase tracking-[0.04em]",
            rc.ring
          )} style={{ color: rc.color, backgroundColor: rc.bg }}>{rc.label}</span>
        </div>
        {!compact && (
          <span className="text-[9px] text-[var(--text-faint)]">p75: {vital.p75}{vital.unit}</span>
        )}
      </div>
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-[18px] font-bold leading-none tracking-tight tabular-nums" style={{ color: rc.color }}>
          {vital.value}
        </span>
        {vital.unit && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{vital.unit}</span>}
      </div>
      {/* Progress bar */}
      <div className="h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: rc.color,
            opacity: 0.7,
          }}
        />
      </div>
      {!compact && (
        <p className="text-[9px] text-[var(--text-faint)] mt-1.5 leading-snug truncate">{vital.description}</p>
      )}
    </div>
  )
}

interface WebVitalsBarProps {
  compact?: boolean
}

export function WebVitalsBar({ compact = false }: WebVitalsBarProps) {
  const vitals = compact ? MOCK_WEB_VITALS.slice(0, 3) : MOCK_WEB_VITALS

  return (
    <div className="border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="px-6 pt-2.5 pb-0.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Web Vitals</span>
        <span className="text-[9px] text-[var(--text-faint)]">·</span>
        <span className="text-[9px] text-[var(--text-faint)]">
          {MOCK_WEB_VITALS.filter(v => v.rating === "good").length}/{MOCK_WEB_VITALS.length} passing
        </span>
      </div>
      <div className={cn("flex", compact && "grid grid-cols-3")}>
        {vitals.map((v) => (
          <VitalCard key={v.abbrev} vital={v} compact={compact} />
        ))}
      </div>
    </div>
  )
}
