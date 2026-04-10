"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  MOCK_TREASURY,
  MOCK_TREASURY_TRANSACTIONS,
  MOCK_TREASURY_PRICE_HISTORY,
  MOCK_TREASURY_VOLUME_HISTORY,
  MOCK_TREASURY_ALLOCATIONS,
  MOCK_UPCOMING_PAYOUTS,
  type TreasuryTransaction,
} from "@/lib/mock-data"
import { TreasuryStatsBar } from "./treasury-stats"
import { TreasuryPriceChart } from "./treasury-price-chart"
import { TreasuryAllocations } from "./treasury-allocations"
import { TreasuryTransactionList } from "./treasury-transaction-list"
import { TreasuryTransactionDetail } from "./treasury-transaction-detail"
import { UpcomingPayouts } from "./upcoming-payouts"
import { Search, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, TrendingUp, TrendingDown } from "lucide-react"

type SortKey = "timestamp" | "amount" | "tokenAmount"
type SortDir = "asc" | "desc"

export function TreasuryPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedTxn, setSelectedTxn] = useState<TreasuryTransaction | null>(null)
  const [animating, setAnimating] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }, [sortKey])

  const filtered = useMemo(() => {
    let txns = MOCK_TREASURY_TRANSACTIONS.filter((t) => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase()) &&
          !t.id.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== "all" && t.type !== typeFilter) return false
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      return true
    })
    txns.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
    })
    return txns
  }, [search, typeFilter, statusFilter, sortKey, sortDir])

  const closePanel = useCallback(() => {
    if (!selectedTxn) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedTxn(null)
      setAnimating(false)
    }, 150)
  }, [selectedTxn])

  const openTxn = useCallback((txn: TreasuryTransaction) => {
    if (selectedTxn?.id === txn.id) {
      closePanel()
    } else {
      setSelectedTxn(txn)
      setAnimating(false)
    }
  }, [selectedTxn, closePanel])

  const hasPanel = selectedTxn !== null
  const isCompact = hasPanel

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out">
        <TreasuryStatsBar compact={isCompact} />

        {/* Top section: Price chart + Allocations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-[var(--line)] bg-[var(--surface)]">
          <TreasuryPriceChart
            compact={isCompact}
            priceHistory={MOCK_TREASURY_PRICE_HISTORY}
            volumeHistory={MOCK_TREASURY_VOLUME_HISTORY}
          />
          <TreasuryAllocations allocations={MOCK_TREASURY_ALLOCATIONS} compact={isCompact} />
        </div>

        {/* Upcoming payouts */}
        {!isCompact && <UpcomingPayouts payouts={MOCK_UPCOMING_PAYOUTS} />}

        {/* Filter bar */}
        <TreasuryFilterBar
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />

        {/* Sort bar */}
        <TreasurySortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          compact={isCompact}
        />

        {/* Transaction list */}
        <TreasuryTransactionList
          transactions={filtered}
          selectedId={selectedTxn?.id ?? null}
          onSelect={openTxn}
        />
      </div>

      {/* Detail panel */}
      {hasPanel && (
        <div
          ref={panelRef}
          className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <TreasuryTransactionDetail transaction={selectedTxn!} onClose={closePanel} />
        </div>
      )}
    </>
  )
}

/* ── Filter bar ── */
interface FilterProps {
  search: string
  onSearch: (v: string) => void
  typeFilter: string
  onTypeFilter: (v: string) => void
  statusFilter: string
  onStatusFilter: (v: string) => void
}

function TreasuryFilterBar({ search, onSearch, typeFilter, onTypeFilter, statusFilter, onStatusFilter }: FilterProps) {
  const types = ["all", "deposit", "withdrawal", "payout", "reward", "fee"]
  const statuses = ["all", "confirmed", "pending", "failed"]

  const typeLabel: Record<string, string> = {
    all: "All Types",
    deposit: "Deposits",
    withdrawal: "Withdrawals",
    payout: "Payouts",
    reward: "Rewards",
    fee: "Fees",
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="relative w-48 md:w-52 shrink-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search transactions…"
          className="w-full pl-8 pr-3 py-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none transition-all duration-150"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 ml-auto">
        <div className="flex items-center gap-0.5">
          <SlidersHorizontal size={11} className="text-[var(--text-faint)] mr-1 hidden sm:block" />
          {types.map((t) => {
            const isActive = typeFilter === t
            const icon = t === "deposit" ? ArrowDownLeft : t === "withdrawal" || t === "payout" ? ArrowUpRight : TrendingUp
            const colorMap: Record<string, string> = {
              deposit: isActive ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "",
              withdrawal: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
              payout: isActive ? "bg-[var(--purple)]/[0.10] text-[var(--purple)]" : "",
              reward: isActive ? "bg-[var(--blue)]/[0.10] text-[var(--blue)]" : "",
              fee: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
            }
            return (
              <button
                key={t}
                onClick={() => onTypeFilter(t)}
                className={cn(
                  "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
                  colorMap[t] || "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {typeLabel[t] || t}
              </button>
            )
          })}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

        <div className="flex items-center gap-0.5">
          {statuses.slice(1).map((s) => {
            const isActive = statusFilter === s
            const colorMap: Record<string, string> = {
              confirmed: isActive ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "",
              pending: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
              failed: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
            }
            return (
              <button
                key={s}
                onClick={() => onStatusFilter(s === statusFilter ? "all" : s)}
                className={cn(
                  "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
                  colorMap[s] || "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Sort bar ── */
interface SortBarProps {
  sortKey: SortKey
  sortDir: SortDir
  onToggleSort: (key: SortKey) => void
  compact?: boolean
}

function TreasurySortBar({ sortKey, sortDir, onToggleSort, compact }: SortBarProps) {
  const sortOptions: Array<{ key: SortKey; label: string; icon: React.ElementType }> = [
    { key: "timestamp", label: "Time", icon: TrendingUp },
    { key: "amount", label: "Amount", icon: TrendingUp },
    { key: "tokenAmount", label: "Tokens", icon: TrendingUp },
  ]

  return (
    <div className={cn(
      "flex items-center gap-1 px-4 py-2 border-b border-[var(--line)] bg-[var(--surface)]/50",
      compact && "px-3 py-1.5"
    )}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mr-2">Sort by</span>
      {sortOptions.map(({ key, label, icon: Icon }) => {
        const isActive = sortKey === key
        return (
          <button
            key={key}
            onClick={() => onToggleSort(key)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.96]",
              isActive
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] ring-1 ring-inset ring-[var(--line)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
            )}
          >
            <Icon size={10} />
            <span>{label}</span>
            {isActive && (
              <span className="text-[9px] text-[var(--text-faint)] ml-0.5">
                {sortDir === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
