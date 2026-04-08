"use client"

import { cn } from "@/lib/utils"
import type { Transaction, TransactionStatus } from "@/lib/mock-data"
import { Globe, Server, Compass, Cog, TrendingUp, TrendingDown, Minus, Users, ArrowUpRight } from "lucide-react"

/* ── Operation icon ── */
const operationIcon: Record<string, React.ElementType> = {
  "http.server": Server,
  pageload: Globe,
  navigation: Compass,
  resource: Globe,
  task: Cog,
}

const operationLabel: Record<string, string> = {
  "http.server": "Backend",
  pageload: "Pageload",
  navigation: "Nav",
  resource: "Resource",
  task: "Task",
}

/* ── Status badge ── */
const statusStyles: Record<TransactionStatus, string> = {
  healthy: "text-[var(--green)] bg-[var(--green)]/[0.08] ring-[var(--green)]/15",
  degraded: "text-[var(--yellow)] bg-[var(--yellow)]/[0.08] ring-[var(--yellow)]/15",
  critical: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20",
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-[4px] text-[10px] font-semibold capitalize leading-none ring-1 ring-inset",
      statusStyles[status]
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "healthy" && "bg-[var(--green)]",
        status === "degraded" && "bg-[var(--yellow)] animate-pulse",
        status === "critical" && "bg-[var(--red)] animate-pulse"
      )} style={status !== "healthy" ? { animationDuration: "2s" } : undefined} />
      {status}
    </span>
  )
}

/* ── Trend indicator ── */
function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-faint)]">
        <Minus size={9} />
        0%
      </span>
    )
  }
  const isWorse = trend > 0 // positive = slower = worse
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
      isWorse ? "text-[var(--red)]" : "text-[var(--green)]"
    )}>
      {isWorse ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {isWorse ? "+" : ""}{trend}%
    </span>
  )
}

/* ── Latency bar visualization ── */
function LatencyBar({ p50, p95 }: { p50: number; p95: number }) {
  const maxMs = 5000
  const w50 = Math.min(100, (p50 / maxMs) * 100)
  const w95 = Math.min(100, (p95 / maxMs) * 100)
  const color50 = p50 < 200 ? "var(--green)" : p50 < 500 ? "var(--blue)" : p50 < 1000 ? "var(--yellow)" : "var(--red)"
  const color95 = p95 < 500 ? "var(--green)" : p95 < 1000 ? "var(--yellow)" : "var(--red)"

  return (
    <div className="w-24 flex flex-col gap-[3px]">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-[var(--text-faint)] w-5 shrink-0">p50</span>
        <div className="flex-1 h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${w50}%`, backgroundColor: color50, opacity: 0.7 }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-[var(--text-faint)] w-5 shrink-0">p95</span>
        <div className="flex-1 h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${w95}%`, backgroundColor: color95, opacity: 0.7 }} />
        </div>
      </div>
    </div>
  )
}

/* ── Stat cell ── */
function StatCell({ value, label, unit, highlight }: { value: string | number; label: string; unit?: string; highlight?: boolean }) {
  return (
    <div className="text-right min-w-[52px]">
      <p className={cn(
        "text-[13px] font-bold leading-none tracking-tight tabular-nums",
        highlight ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"
      )}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-[9px] text-[var(--text-faint)] font-medium ml-0.5">{unit}</span>}
      </p>
      <p className="text-[9px] text-[var(--text-tertiary)] mt-1">{label}</p>
    </div>
  )
}

/* ── Transaction row ── */
interface TransactionRowProps {
  transaction: Transaction
  isSelected: boolean
  onClick: () => void
  sortKey: string
}

function TransactionRow({ transaction: t, isSelected, onClick, sortKey }: TransactionRowProps) {
  const Icon = operationIcon[t.operation] || Cog
  const accent = t.status === "critical" ? "var(--red)" : t.status === "degraded" ? "var(--yellow)" : "var(--green)"

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-lg transition-all duration-150",
        "bg-[var(--surface)] hover:bg-[var(--surface-2)]",
        "ring-1 ring-inset ring-[var(--line)] hover:ring-[var(--text-faint)]/30",
        "active:scale-[0.998]",
        isSelected && "bg-[var(--surface-2)] ring-[var(--text-faint)]/30"
      )}
      style={{ boxShadow: isSelected ? "var(--shadow-card-hover)" : "var(--shadow-card)" }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity duration-150"
        style={{ backgroundColor: accent, opacity: t.status === "healthy" ? 0.4 : 0.8 }}
      />

      <div className="pl-5 pr-5 py-3.5">
        <div className="flex items-start gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-[4px] text-[10px] font-medium leading-none bg-[var(--surface-3)] text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--line)]">
                <Icon size={9} className="text-[var(--text-tertiary)]" />
                {operationLabel[t.operation] || t.operation}
              </span>
              <StatusBadge status={t.status} />
              <span className="text-[10px] font-mono text-[var(--text-faint)]">{t.project}</span>
            </div>

            {/* Transaction name */}
            <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug font-mono truncate pr-4">
              {t.name}
            </p>

            {/* Bottom row: latency bar + metadata */}
            <div className="flex items-center gap-3 mt-2.5">
              <LatencyBar p50={t.p50} p95={t.p95} />
              <TrendBadge trend={t.trend} />
              {t.users > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                  <Users size={9} className="text-[var(--text-tertiary)]" />
                  {t.users.toLocaleString()}
                </span>
              )}
              <span className="text-[10px] text-[var(--text-faint)] tabular-nums ml-auto">
                {t.samples.toLocaleString()} samples
              </span>
            </div>
          </div>

          {/* Right side: key stats */}
          <div className="flex-shrink-0 flex items-start gap-3 pt-0.5">
            <StatCell value={t.p50} label="p50" unit="ms" />
            <StatCell value={t.p95} label="p95" unit="ms" highlight={sortKey === "p95"} />
            <StatCell value={t.tpm} label="tpm" />
            <StatCell value={t.apdex.toFixed(2)} label="apdex" />
            <div className="pt-1.5">
              <ArrowUpRight
                size={14}
                className="text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-all duration-150 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

/* ── Transaction list ── */
interface TransactionListProps {
  transactions: Transaction[]
  selectedId: string | null
  onSelect: (t: Transaction) => void
  sortKey: string
}

export function TransactionList({ transactions, selectedId, onSelect, sortKey }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center mb-4">
          <Server size={20} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No transactions found</p>
        <p className="text-[11px] text-[var(--text-secondary)]">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-3 space-y-2">
      {transactions.map((txn) => (
        <TransactionRow
          key={txn.id}
          transaction={txn}
          isSelected={selectedId === txn.id}
          onClick={() => onSelect(txn)}
          sortKey={sortKey}
        />
      ))}
    </div>
  )
}
