"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { MOCK_TRANSACTIONS, MOCK_PERF_STATS, type Transaction } from "@/lib/mock-data"
import { PerformanceStatsBar } from "./performance-stats"
import { LatencyChart, ThroughputChart, ApdexChart } from "./performance-charts"
import { WebVitalsBar } from "./web-vitals"
import { TransactionList } from "./transaction-list"
import { TransactionDetail } from "./transaction-detail"
import { Search, SlidersHorizontal } from "lucide-react"

type SortKey = "tpm" | "p50" | "p75" | "p95" | "failureRate" | "apdex" | "trend"
type SortDir = "asc" | "desc"

export function PerformancePage() {
  const [search, setSearch] = useState("")
  const [operationFilter, setOperationFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("p95")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)
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
    let txns = MOCK_TRANSACTIONS.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      if (operationFilter !== "all" && t.operation !== operationFilter) return false
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      return true
    })
    txns.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
    })
    return txns
  }, [search, operationFilter, statusFilter, sortKey, sortDir])

  const closePanel = useCallback(() => {
    if (!selectedTxn) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedTxn(null)
      setAnimating(false)
    }, 150)
  }, [selectedTxn])

  const openTxn = useCallback((txn: Transaction) => {
    if (selectedTxn?.id === txn.id) {
      closePanel()
    } else {
      setSelectedTxn(txn)
      setAnimating(false)
    }
  }, [selectedTxn, closePanel])

  const hasPanel = selectedTxn !== null
  // Only use compact mode when internal detail panel is open, not when AI panel is external
  const isCompact = hasPanel

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out">
        <PerformanceStatsBar compact={isCompact} />

        {/* Charts row */}
        <div className={cn(
          "grid border-b border-[var(--line)] bg-[var(--surface)]",
          isCompact ? "grid-cols-1" : "grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3"
        )}>
          <LatencyChart compact={isCompact} />
          {!isCompact && <ThroughputChart />}
          {!isCompact && <ApdexChart />}
        </div>

        {/* Web Vitals */}
        <WebVitalsBar compact={isCompact} />

        {/* Filter bar */}
        <PerformanceFilterBar
          search={search}
          onSearch={setSearch}
          operationFilter={operationFilter}
          onOperationFilter={setOperationFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />

        {/* Transaction list */}
        <TransactionList
          transactions={filtered}
          selectedId={selectedTxn?.id ?? null}
          onSelect={openTxn}
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          operationFilter={operationFilter}
          statusFilter={statusFilter}
        />
      </div>

      {/* Detail panel */}
      {hasPanel && (
        <div
          ref={panelRef}
          className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <TransactionDetail transaction={selectedTxn!} onClose={closePanel} />
        </div>
      )}
    </>
  )
}

/* ── Filter bar ── */
interface FilterProps {
  search: string
  onSearch: (v: string) => void
  operationFilter: string
  onOperationFilter: (v: string) => void
  statusFilter: string
  onStatusFilter: (v: string) => void
}

function PerformanceFilterBar({ search, onSearch, operationFilter, onOperationFilter, statusFilter, onStatusFilter }: FilterProps) {
  const operations = ["all", "http.server", "pageload", "navigation", "task"]
  const statuses = ["all", "healthy", "degraded", "critical"]

  const opLabel: Record<string, string> = {
    all: "All",
    "http.server": "Backend",
    pageload: "Pageload",
    navigation: "Navigation",
    task: "Task",
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="relative w-48 md:w-52 shrink-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full pl-8 pr-3 py-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none transition-all duration-150"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 ml-auto">
        <div className="flex items-center gap-0.5">
          <SlidersHorizontal size={11} className="text-[var(--text-faint)] mr-1 hidden sm:block" />
          {operations.map((op) => (
            <button
              key={op}
              onClick={() => onOperationFilter(op)}
              className={cn(
                "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.96]",
                operationFilter === op
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {opLabel[op] || op}
            </button>
          ))}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

        <div className="flex items-center gap-0.5">
          {statuses.slice(1).map((s) => {
            const isActive = statusFilter === s
            const colorMap: Record<string, string> = {
              healthy: isActive ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "",
              degraded: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
              critical: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
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
