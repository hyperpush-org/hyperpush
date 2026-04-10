"use client"

import { MOCK_TREASURY, MOCK_TREASURY_TRANSACTIONS } from "@/lib/mock-data"
import { Coins, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: "green" | "blue" | "purple" | "red" | "default"
}

function StatCard({ label, value, sub, icon: Icon, accent = "default" }: StatCardProps) {
  const isGreen = accent === "green"
  const isBlue = accent === "blue"
  const isPurple = accent === "purple"
  const isRed = accent === "red"

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
            isRed && "text-[var(--red)]",
            !isGreen && !isBlue && !isPurple && !isRed && "text-[var(--text-faint)]"
          )}
        />
      </div>
      <div className="flex items-end gap-1.5">
        <span className={cn(
          "text-[20px] font-bold leading-none tracking-tight tabular-nums",
          isGreen && "text-[var(--green)]",
          isBlue && "text-[var(--blue)]",
          isPurple && "text-[var(--purple)]",
          isRed && "text-[var(--red)]",
          !isGreen && !isBlue && !isPurple && !isRed && "text-[var(--text-primary)]"
        )}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}

interface TreasuryStatsBarProps {
  compact?: boolean
}

export function TreasuryStatsBar({ compact = false }: TreasuryStatsBarProps) {
  const totalDeposits = MOCK_TREASURY_TRANSACTIONS
    .filter(t => t.type === "deposit" && t.status === "confirmed")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalWithdrawals = MOCK_TREASURY_TRANSACTIONS
    .filter(t => t.type === "withdrawal" && t.status === "confirmed")
    .reduce((sum, t) => sum + t.amount, 0)

  const netFlow = totalDeposits - totalWithdrawals

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
      <StatCard label="Balance" value={`$${MOCK_TREASURY.usdValue.toFixed(0)}`} sub={`${MOCK_TREASURY.balance.toLocaleString()} HPX`} icon={Wallet} accent="green" />
      <StatCard label="Token Price" value={`$${MOCK_TREASURY.price.toFixed(4)}`} sub={`${MOCK_TREASURY.change > 0 ? "+" : ""}${MOCK_TREASURY.change}%`} icon={Coins} accent={MOCK_TREASURY.change > 0 ? "green" : "red"} />
      <StatCard label="Total Deposits" value={`$${totalDeposits.toLocaleString()}`} icon={ArrowDownLeft} accent="blue" />
      <StatCard label="Total Withdrawals" value={`$${totalWithdrawals.toLocaleString()}`} icon={ArrowUpRight} accent="red" />
      <StatCard label="Net Flow" value={`$${netFlow.toLocaleString()}`} sub={`${netFlow >= 0 ? "+" : ""}`} icon={TrendingUp} accent={netFlow >= 0 ? "green" : "red"} />
      {!compact && (
        <StatCard label="Transactions" value={MOCK_TREASURY_TRANSACTIONS.length} sub="total" icon={DollarSign} accent="purple" />
      )}
    </div>
  )
}
