"use client"

import { MOCK_PERF_STATS } from "@/lib/mock-data"
import { Activity, Clock, Gauge, TrendingDown, AlertTriangle, Zap, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: "green" | "red" | "yellow" | "default"
}

function StatCard({ label, value, sub, icon: Icon, accent = "default" }: StatCardProps) {
  const isGreen = accent === "green"
  const isRed = accent === "red"
  const isYellow = accent === "yellow"

  return (
    <div className={cn(
      "flex-1 px-4 py-3 relative",
      isRed && "bg-[var(--red)]/[0.03]",
      isYellow && "bg-[var(--yellow)]/[0.02]"
    )}>
      {isRed && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--red)]/30 to-transparent" />
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
            !isGreen && !isRed && !isYellow && "text-[var(--text-faint)]"
          )}
        />
      </div>
      <div className="flex items-end gap-1.5">
        <span className={cn(
          "text-[20px] font-bold leading-none tracking-tight tabular-nums",
          isGreen && "text-[var(--green)]",
          isRed && "text-[var(--red)]",
          isYellow && "text-[var(--yellow)]",
          !isGreen && !isRed && !isYellow && "text-[var(--text-primary)]"
        )}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

interface PerformanceStatsBarProps {
  compact?: boolean
}

export function PerformanceStatsBar({ compact = false }: PerformanceStatsBarProps) {
  const s = MOCK_PERF_STATS
  const apdexAccent = s.apdex >= 0.9 ? "green" as const : s.apdex >= 0.75 ? "yellow" as const : "red" as const

  return (
    <div
      className={cn(
        "border-b border-[var(--line)] bg-[var(--surface)]",
        compact ? "grid grid-cols-4" : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
      )}
      style={{ boxShadow: "var(--shadow-inset-subtle)" }}
    >
      <StatCard label="Apdex" value={s.apdex.toFixed(2)} icon={Gauge} accent={apdexAccent} />
      <StatCard label="Throughput" value={`${s.tpm}`} sub="/min" icon={Activity} accent="green" />
      <StatCard label="P50 Latency" value={`${s.p50}`} sub="ms" icon={Clock} />
      <StatCard label="P95 Latency" value={`${s.p95}`} sub="ms" icon={Clock} accent={s.p95 > 500 ? "yellow" : "default"} />
      {!compact && <StatCard label="Failure Rate" value={`${s.failureRate}%`} icon={AlertTriangle} accent={s.failureRate > 3 ? "red" : s.failureRate > 1 ? "yellow" : "default"} />}
      {!compact && <StatCard label="Slow Txns" value={s.slowTransactions.toLocaleString()} sub=">1s" icon={TrendingDown} accent="yellow" />}
      {!compact && <StatCard label="Total Txns" value={(s.totalTransactions / 1000).toFixed(0) + "k"} sub="24h" icon={Hash} />}
    </div>
  )
}
