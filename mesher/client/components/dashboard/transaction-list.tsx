"use client"

import { cn } from "@/lib/utils"
import type { Transaction, TransactionStatus } from "@/lib/mock-data"
import { Globe, Server, Compass, Cog, TrendingUp, TrendingDown, Minus, Users } from "lucide-react"

/* ── Operation metadata ── */
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

/* ── Status stripe color ── */
const statusAccent: Record<TransactionStatus, string> = {
  healthy: "var(--green)",
  degraded: "var(--yellow)",
  critical: "var(--red)",
}

const statusTextClass: Record<TransactionStatus, string> = {
  healthy: "text-[var(--green)]",
  degraded: "text-[var(--yellow)]",
  critical: "text-[var(--red)]",
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles: Record<TransactionStatus, string> = {
    healthy: "text-[var(--green)] bg-[var(--green)]/[0.08] ring-[var(--green)]/15",
    degraded: "text-[var(--yellow)] bg-[var(--yellow)]/[0.08] ring-[var(--yellow)]/15",
    critical: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20",
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-[2px] rounded-[4px] text-[11px] font-semibold capitalize leading-none ring-1 ring-inset",
      styles[status]
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
      <span className="flex items-center gap-0.5 text-[11px] text-[var(--text-faint)]">
        <Minus size={9} />
        0%
      </span>
    )
  }
  const isWorse = trend > 0
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
      isWorse ? "text-[var(--red)]" : "text-[var(--green)]"
    )}>
      {isWorse ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {isWorse ? "+" : ""}{trend}%
    </span>
  )
}

/* ── Latency bars ── */
function LatencyBar({ p50, p95 }: { p50: number; p95: number }) {
  const maxMs = 5000
  const w50 = Math.min(100, (p50 / maxMs) * 100)
  const w95 = Math.min(100, (p95 / maxMs) * 100)
  const color50 = p50 < 200 ? "var(--green)" : p50 < 500 ? "var(--blue)" : p50 < 1000 ? "var(--yellow)" : "var(--red)"
  const color95 = p95 < 500 ? "var(--green)" : p95 < 1000 ? "var(--yellow)" : "var(--red)"

  return (
    <div className="w-20 sm:w-24 flex flex-col gap-[3px]">
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

/* ── Transaction row ── */
interface TransactionRowProps {
  transaction: Transaction
  isSelected: boolean
  onClick: () => void
  sortKey: string
}

function TransactionRow({ transaction: t, isSelected, onClick, sortKey }: TransactionRowProps) {
  const Icon = operationIcon[t.operation] || Cog
  const accent = statusAccent[t.status]

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left",
        "border-b border-[var(--line)]",
        "transition-colors duration-100",
        isSelected
          ? "bg-[var(--surface-2)]"
          : "hover:bg-[var(--surface-2)]/60"
      )}
    >
      {/* Full-height left status stripe */}
      <div
        className="absolute left-0 inset-y-0 w-[3px]"
        style={{ backgroundColor: accent, opacity: t.status === "healthy" ? 0.5 : 1 }}
      />

      <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-3.5">
        <div className="flex items-start gap-3 sm:gap-5">

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Transaction name */}
            <p className="text-[13.5px] sm:text-sm font-semibold font-mono text-[var(--text-primary)] leading-snug">
              {t.name}
            </p>

            {/* Meta row: status · operation · project · status badge */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.05em] leading-none", statusTextClass[t.status])}>
                {t.status}
              </span>
              <span className="text-[var(--line)]">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                <Icon size={10} className="text-[var(--text-tertiary)]" />
                {operationLabel[t.operation] || t.operation}
              </span>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">{t.project}</span>
            </div>

            {/* Bottom row: latency bars · trend · users · samples */}
            <div className="flex items-center gap-2 sm:gap-3 mt-2.5">
              <LatencyBar p50={t.p50} p95={t.p95} />
              <TrendBadge trend={t.trend} />
              {t.users > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                  <Users size={9} className="text-[var(--text-tertiary)]" />
                  {t.users.toLocaleString()}
                </span>
              )}
              <span className="text-[11px] text-[var(--text-faint)] tabular-nums ml-auto">
                {t.samples.toLocaleString()} samples
              </span>
            </div>
          </div>

          {/* Right: key stats — widths mirror column headers */}
          <div className="flex-shrink-0 flex items-start gap-2 sm:gap-3 pt-0.5">
            <div className={cn("text-right w-[48px] sm:w-[56px]", sortKey === "p50" && "opacity-100")}>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums">
                {t.p50.toLocaleString()}
                <span className="text-[9px] text-[var(--text-faint)] font-medium ml-0.5">ms</span>
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">p50</p>
            </div>
            <div className={cn("text-right w-[52px] sm:w-[60px]", sortKey === "p95" && "opacity-100")}>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums">
                {t.p95.toLocaleString()}
                <span className="text-[9px] text-[var(--text-faint)] font-medium ml-0.5">ms</span>
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">p95</p>
            </div>
            <div className={cn("text-right w-[36px] sm:w-[40px]", sortKey === "tpm" && "opacity-100")}>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums">
                {t.tpm}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">tpm</p>
            </div>
            <div className={cn("text-right w-[44px] sm:w-[48px]", sortKey === "apdex" && "opacity-100")}>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums">
                {t.apdex.toFixed(2)}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">apdex</p>
            </div>
          </div>

        </div>
      </div>
    </button>
  )
}

type SortKey = "tpm" | "p50" | "p75" | "p95" | "failureRate" | "apdex" | "trend"
type SortDir = "asc" | "desc"

/* ── Sort toggle pill ── */
function SortToggle({ label, active, dir, onClick }: { label: string; active: boolean; dir?: SortDir; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[10px] font-medium transition-colors active:scale-[0.97]",
        active ? "text-[var(--text-primary)]" : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
      )}
    >
      {label}
      {active && <span className="ml-0.5 text-[var(--text-tertiary)]">{dir === "desc" ? "↓" : "↑"}</span>}
    </button>
  )
}

/* ── Transaction list ── */
interface TransactionListProps {
  transactions: Transaction[]
  selectedId: string | null
  onSelect: (t: Transaction) => void
  sortKey: SortKey
  sortDir: SortDir
  onToggleSort: (key: SortKey) => void
  operationFilter: string
  statusFilter: string
}

export function TransactionList({ transactions, selectedId, onSelect, sortKey, sortDir, onToggleSort, operationFilter, statusFilter }: TransactionListProps) {
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
    <div className="min-h-[16rem]">
      {/* Combined header: count + sort on left, column headers on right */}
      <div className="flex flex-wrap items-center pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 gap-y-1.5 border-b border-[var(--line)] bg-[var(--surface)]">
        {/* Left: transaction count + sort toggles */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
            <span className="text-[var(--text-primary)] font-semibold tabular-nums">{transactions.length}</span> transactions
            {operationFilter !== "all" && <span className="text-[var(--text-faint)]"> · {operationFilter}</span>}
            {statusFilter !== "all" && <span className="text-[var(--text-faint)]"> · {statusFilter}</span>}
          </span>
          <div className="flex items-center gap-2">
            <SortToggle label="P95" active={sortKey === "p95"} dir={sortKey === "p95" ? sortDir : undefined} onClick={() => onToggleSort("p95")} />
            <SortToggle label="TPM" active={sortKey === "tpm"} dir={sortKey === "tpm" ? sortDir : undefined} onClick={() => onToggleSort("tpm")} />
            <SortToggle label="Apdex" active={sortKey === "apdex"} dir={sortKey === "apdex" ? sortDir : undefined} onClick={() => onToggleSort("apdex")} />
            <SortToggle label="Trend" active={sortKey === "trend"} dir={sortKey === "trend" ? sortDir : undefined} onClick={() => onToggleSort("trend")} />
          </div>
        </div>

        {/* Right: column headers — pushed to far right, wraps below on small screens */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[48px] sm:w-[56px] text-right">p50</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[52px] sm:w-[60px] text-right">p95</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[36px] sm:w-[40px] text-right">tpm</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[44px] sm:w-[48px] text-right">apdex</span>
        </div>
      </div>

      {/* Rows */}
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
