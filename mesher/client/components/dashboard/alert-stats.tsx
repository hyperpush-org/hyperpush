"use client"

import { MOCK_ALERT_STATS } from "@/lib/mock-data"
import { Bell, BellOff, CheckCircle2, Clock, Zap, AlertTriangle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: "green" | "red" | "yellow" | "purple" | "default"
}

function StatCard({ label, value, sub, icon: Icon, accent = "default" }: StatCardProps) {
  const isGreen = accent === "green"
  const isRed = accent === "red"
  const isYellow = accent === "yellow"
  const isPurple = accent === "purple"

  return (
    <div className={cn(
      "flex-1 px-4 py-3 relative",
      isRed && "bg-[var(--red)]/[0.03]",
      isYellow && "bg-[var(--yellow)]/[0.02]",
      isPurple && "bg-[var(--purple)]/[0.02]"
    )}>
      {isRed && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--red)]/30 to-transparent" />
      )}
      {isPurple && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--purple)]/20 to-transparent" />
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] truncate">{label}</span>
        <Icon
          size={12}
          className={cn(
            "shrink-0 ml-1",
            isGreen && "text-[var(--green)]",
            isRed && "text-[var(--red)]",
            isYellow && "text-[var(--yellow)]",
            isPurple && "text-[var(--purple)]",
            !isGreen && !isRed && !isYellow && !isPurple && "text-[var(--text-faint)]"
          )}
        />
      </div>
      <div className="flex items-end gap-1.5">
        <span className={cn(
          "text-[20px] font-bold leading-none tracking-tight tabular-nums",
          isGreen && "text-[var(--green)]",
          isRed && "text-[var(--red)]",
          isYellow && "text-[var(--yellow)]",
          isPurple && "text-[var(--purple)]",
          !isGreen && !isRed && !isYellow && !isPurple && "text-[var(--text-primary)]"
        )}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

interface AlertStatsBarProps {
  compact?: boolean
}

export function AlertStatsBar({ compact = false }: AlertStatsBarProps) {
  const s = MOCK_ALERT_STATS

  return (
    <div
      className={cn(
        "border-b border-[var(--line)] bg-[var(--surface)]",
        compact ? "grid grid-cols-4" : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
      )}
      style={{ boxShadow: "var(--shadow-inset-subtle)" }}
    >
      <StatCard label="Firing" value={s.firing} icon={Bell} accent="red" />
      <StatCard label="Silenced" value={s.silenced} icon={BellOff} accent="yellow" />
      <StatCard label="Resolved Today" value={s.resolvedToday} icon={CheckCircle2} accent="green" />
      <StatCard label="MTTA" value={s.mtta} icon={Zap} />
      {!compact && <StatCard label="Avg Resolution" value={s.avgResolutionTime} icon={Clock} />}
      {!compact && <StatCard label="Avg Firing" value={s.avgFiringDuration} icon={TrendingUp} />}
      {!compact && <StatCard label="False Positive" value={s.falsePositiveRate} icon={AlertTriangle} accent="yellow" />}
    </div>
  )
}
