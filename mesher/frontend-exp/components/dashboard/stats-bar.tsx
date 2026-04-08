"use client"

import { MOCK_STATS } from "@/lib/mock-data"
import { AlertTriangle, Users, Clock, Activity, Zap, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: "green" | "red" | "default"
}

function StatCard({ label, value, sub, icon: Icon, accent = "default" }: StatCardProps) {
  const isGreen = accent === "green"
  const isRed = accent === "red"

  return (
    <div className={cn(
      "min-w-0 flex-1 px-4 py-3 relative",
      isRed && "bg-[var(--red)]/[0.03]"
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
            !isGreen && !isRed && "text-[var(--text-faint)]"
          )}
        />
      </div>
      <div className="flex items-end gap-1.5">
        <span className={cn(
          "text-[20px] font-bold leading-none tracking-tight tabular-nums",
          isGreen && "text-[var(--green)]",
          isRed && "text-[var(--red)]",
          !isGreen && !isRed && "text-[var(--text-primary)]"
        )}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

interface StatsBarProps {
  compact?: boolean
}

export function StatsBar({ compact = false }: StatsBarProps) {
  return (
    <div
      className={cn(
        "border-b border-[var(--line)] bg-[var(--surface)]",
        compact
          ? "grid grid-cols-4"
          : "flex"
      )}
      style={{ boxShadow: "var(--shadow-inset-subtle)" }}
    >
      <StatCard label="Total Events" value={MOCK_STATS.totalEvents.toLocaleString()} sub="last 24h" icon={Activity} />
      <StatCard label="Affected Users" value={MOCK_STATS.affectedUsers.toLocaleString()} sub="unique" icon={Users} />
      <StatCard label="Critical Issues" value={MOCK_STATS.criticalIssues} icon={AlertTriangle} accent="red" />
      <StatCard label="Open Issues" value={MOCK_STATS.openIssues} icon={TrendingUp} />
      <StatCard label="MTTR" value={MOCK_STATS.mttr} icon={Clock} />
      <StatCard label="Events/min" value={MOCK_STATS.eventsPerMin} sub="live" icon={Zap} accent="green" />
      <StatCard label="Crash-Free" value={MOCK_STATS.crashFreeSessions} icon={Activity} accent="green" />
    </div>
  )
}
