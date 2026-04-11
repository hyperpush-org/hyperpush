"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { MOCK_ALERTS, type Alert, type AlertStatus, type AlertType, type Severity } from "@/lib/mock-data"
import { AlertStatsBar } from "./alert-stats"
import { AlertList } from "./alert-list"
import { AlertDetail } from "./alert-detail"
import { Search, SlidersHorizontal, Bell, BellOff, CheckCircle2, AlertTriangle, Zap, Shield, TrendingUp, Clock, Activity } from "lucide-react"

type SortKey = "triggeredAt" | "lastFired" | "firedCount" | "currentValue" | "severity"
type SortDir = "asc" | "desc"

export function AlertsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("firing")
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all")
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("triggeredAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
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
    let alerts = MOCK_ALERTS.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
          !a.description.toLowerCase().includes(search.toLowerCase()) &&
          !a.id.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      if (typeFilter !== "all" && a.type !== typeFilter) return false
      if (severityFilter !== "all" && a.severity !== severityFilter) return false
      return true
    })
    alerts.sort((a, b) => {
      if (sortKey === "severity") {
        const severityOrder: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 }
        const av = severityOrder[a.severity]
        const bv = severityOrder[b.severity]
        return sortDir === "desc" ? bv - av : av - bv
      }
      const av = a[sortKey]
      const bv = b[sortKey]
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
    })
    return alerts
  }, [search, statusFilter, typeFilter, severityFilter, sortKey, sortDir])

  const closePanel = useCallback(() => {
    if (!selectedAlert) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedAlert(null)
      setAnimating(false)
    }, 150)
  }, [selectedAlert])

  const openAlert = useCallback((id: string) => {
    const alert = MOCK_ALERTS.find((a) => a.id === id)
    if (selectedAlert?.id === id) {
      closePanel()
    } else if (alert) {
      setSelectedAlert(alert)
      setAnimating(false)
    }
  }, [selectedAlert, closePanel])

  const hasPanel = selectedAlert !== null
  const isCompact = hasPanel

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out">
        <AlertStatsBar compact={isCompact} />

        {/* Filter bar */}
        <AlertsFilterBar
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          severityFilter={severityFilter}
          onSeverityFilter={setSeverityFilter}
        />

        {/* Sort bar */}
        <AlertsSortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          compact={isCompact}
        />

        {/* Alert list */}
        <AlertList
          alerts={filtered}
          selectedId={selectedAlert?.id ?? null}
          onSelect={openAlert}
        />
      </div>

      {/* Detail panel */}
      {hasPanel && (
        <div
          ref={panelRef}
          className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <AlertDetail alert={selectedAlert!} onClose={closePanel} />
        </div>
      )}
    </>
  )
}

/* ── Filter bar ── */
interface FilterProps {
  search: string
  onSearch: (v: string) => void
  statusFilter: AlertStatus | "all"
  onStatusFilter: (v: AlertStatus | "all") => void
  typeFilter: AlertType | "all"
  onTypeFilter: (v: AlertType | "all") => void
  severityFilter: Severity | "all"
  onSeverityFilter: (v: Severity | "all") => void
}

function AlertsFilterBar({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  typeFilter,
  onTypeFilter,
  severityFilter,
  onSeverityFilter,
}: FilterProps) {
  const statuses: (AlertStatus | "all")[] = ["all", "firing", "resolved", "silenced"]
  const types: (AlertType | "all")[] = ["all", "error-rate", "latency", "availability", "smart-contract", "custom"]
  const severities: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"]

  const typeIcon: Record<string, React.ElementType> = {
    "error-rate": TrendingUp,
    "latency": Clock,
    "availability": Activity,
    "smart-contract": Shield,
    "custom": Zap,
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="relative w-48 md:w-52 shrink-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search alerts…"
          className="w-full pl-8 pr-3 py-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none transition-all duration-150"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 ml-auto">
        {/* Status filter */}
        <div className="flex items-center gap-0.5">
          <SlidersHorizontal size={11} className="text-[var(--text-faint)] mr-1 hidden sm:block" />
          {statuses.map((s) => {
            const isActive = statusFilter === s
            const colorMap: Record<string, string> = {
              all: isActive ? "bg-[var(--surface-3)] text-[var(--text-primary)]" : "",
              firing: isActive ? "bg-[var(--red)]/[0.10] text-[var(--red)]" : "",
              resolved: isActive ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "",
              silenced: isActive ? "bg-[var(--yellow)]/[0.10] text-[var(--yellow)]" : "",
            }
            return (
              <button
                key={s}
                onClick={() => onStatusFilter(s === statusFilter ? "all" : s)}
                className={cn(
                  "flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
                  colorMap[s] || "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {s === "firing" && <Bell size={9} />}
                {s === "resolved" && <CheckCircle2 size={9} />}
                {s === "silenced" && <BellOff size={9} />}
                {s === "all" && <AlertTriangle size={9} />}
                {s}
              </button>
            )
          })}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

        {/* Type filter */}
        <div className="flex items-center gap-0.5">
          {types.slice(0, 4).map((t) => {
            const isActive = typeFilter === t
            const Icon = t !== "all" ? typeIcon[t] : AlertTriangle
            return (
              <button
                key={t}
                onClick={() => onTypeFilter(t === typeFilter ? "all" : t)}
                className={cn(
                  "flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.96]",
                  isActive
                    ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
                title={t}
              >
                {t !== "all" && <Icon size={9} />}
                <span className="hidden sm:inline">{t === "all" ? "All" : t.replace("-", " ")}</span>
              </button>
            )
          })}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

        {/* Severity filter */}
        <div className="flex items-center gap-0.5">
          {severities.slice(1).map((s) => {
            const isActive = severityFilter === s
            const colorMap: Record<string, string> = {
              critical: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
              high: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
              medium: isActive ? "bg-[var(--blue)]/[0.12] text-[var(--blue)]" : "",
              low: isActive ? "bg-[var(--text-tertiary)]/[0.12] text-[var(--text-tertiary)]" : "",
            }
            return (
              <button
                key={s}
                onClick={() => onSeverityFilter(s === severityFilter ? "all" : s)}
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

function AlertsSortBar({ sortKey, sortDir, onToggleSort, compact }: SortBarProps) {
  const sortOptions: Array<{ key: SortKey; label: string; icon: React.ElementType }> = [
    { key: "triggeredAt", label: "Triggered", icon: Clock },
    { key: "lastFired", label: "Last Fired", icon: Bell },
    { key: "firedCount", label: "Fired Count", icon: Zap },
    { key: "currentValue", label: "Value", icon: Activity },
    { key: "severity", label: "Severity", icon: AlertTriangle },
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
