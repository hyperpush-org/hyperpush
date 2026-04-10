"use client"

import { MOCK_BOUNTY_STATS } from "@/lib/mock-data"
import { DollarSign, CheckCircle2, Clock, TrendingUp, Award, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: "green" | "blue" | "purple" | "default"
}

function StatCard({ label, value, sub, icon: Icon, accent = "default" }: StatCardProps) {
  const isGreen = accent === "green"
  const isBlue = accent === "blue"
  const isPurple = accent === "purple"

  return (
    <div className="flex-1 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] truncate">{label}</span>
        <Icon
          size={12}
          className={cn(
            "shrink-0 ml-1",
            isGreen && "text-[var(--green)]",
            isBlue && "text-[var(--blue)]",
            isPurple && "text-[var(--purple)]",
            !isGreen && !isBlue && !isPurple && "text-[var(--text-faint)]"
          )}
        />
      </div>
      <div className="flex items-end gap-1.5">
        <span className={cn(
          "text-[20px] font-bold leading-none tracking-tight tabular-nums",
          isGreen && "text-[var(--green)]",
          isBlue && "text-[var(--blue)]",
          isPurple && "text-[var(--purple)]",
          !isGreen && !isBlue && !isPurple && "text-[var(--text-primary)]"
        )}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

interface BountyStatsBarProps {
  compact?: boolean
}

export function BountyStatsBar({ compact = false }: BountyStatsBarProps) {
  return (
    <div
      className={cn(
        "border-b border-[var(--line)] bg-[var(--surface)]",
        compact
          ? "grid grid-cols-4"
          : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      )}
      style={{ boxShadow: "var(--shadow-inset-subtle)" }}
    >
      <StatCard label="Total Claims" value={MOCK_BOUNTY_STATS.totalClaims} icon={TrendingUp} />
      <StatCard label="Pending" value={MOCK_BOUNTY_STATS.pending} icon={Clock} />
      <StatCard label="Paid Out" value={`$${MOCK_BOUNTY_STATS.totalPaidOut.toLocaleString()}`} sub={`${(MOCK_BOUNTY_STATS.totalTokenPaid / 1000).toFixed(0)}K HPX`} icon={DollarSign} accent="green" />
      <StatCard label="Paid Claims" value={MOCK_BOUNTY_STATS.paid} icon={CheckCircle2} accent="blue" />
      <StatCard label="Avg Payout Time" value={MOCK_BOUNTY_STATS.avgPayoutTime} icon={Award} />
      {!compact && <StatCard label="My Claims" value={MOCK_BOUNTY_STATS.myClaims} sub={`$${MOCK_BOUNTY_STATS.myEarnings}`} icon={Wallet} accent="purple" />}
    </div>
  )
}
