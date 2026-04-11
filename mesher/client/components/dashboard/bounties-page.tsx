"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { MOCK_BOUNTY_CLAIMS, MOCK_BOUNTY_STATS, type BountyClaim, type BountyClaimStatus, type Severity } from "@/lib/mock-data"
import { BountyStatsBar } from "./bounty-stats"
import { BountyList } from "./bounty-list"
import { BountyDetail } from "./bounty-detail"
import { Search, SlidersHorizontal, Clock, CheckCircle2, XCircle, AlertCircle, DollarSign } from "lucide-react"

type SortKey = "claimedAt" | "bountyAmount" | "tokenAmount" | "votes" | "status"
type SortDir = "asc" | "desc"

export function BountiesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<BountyClaimStatus | "all">("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("claimedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedBounty, setSelectedBounty] = useState<BountyClaim | null>(null)
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
    let bounties = MOCK_BOUNTY_CLAIMS.filter((b) => {
      if (search && !b.issueTitle.toLowerCase().includes(search.toLowerCase()) &&
          !b.id.toLowerCase().includes(search.toLowerCase()) &&
          !b.claimant.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && b.status !== statusFilter) return false
      if (projectFilter !== "all" && b.project !== projectFilter) return false
      if (severityFilter !== "all" && b.severity !== severityFilter) return false
      return true
    })
    bounties.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (sortKey === "votes") {
        const avScore = (av as { up: number; down: number }).up - (av as { up: number; down: number }).down
        const bvScore = (bv as { up: number; down: number }).up - (bv as { up: number; down: number }).down
        return sortDir === "desc" ? bvScore - avScore : avScore - bvScore
      }
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
    })
    return bounties
  }, [search, statusFilter, projectFilter, severityFilter, sortKey, sortDir])

  const closePanel = useCallback(() => {
    if (!selectedBounty) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedBounty(null)
      setAnimating(false)
    }, 150)
  }, [selectedBounty])

  const openBounty = useCallback((bounty: BountyClaim) => {
    if (selectedBounty?.id === bounty.id) {
      closePanel()
    } else {
      setSelectedBounty(bounty)
      setAnimating(false)
    }
  }, [selectedBounty, closePanel])

  const hasPanel = selectedBounty !== null
  const isCompact = hasPanel

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out">
        <BountyStatsBar compact={isCompact} />

        {/* Filter bar */}
        <BountiesFilterBar
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          projectFilter={projectFilter}
          onProjectFilter={setProjectFilter}
          severityFilter={severityFilter}
          onSeverityFilter={setSeverityFilter}
        />

        {/* Sort bar */}
        <BountiesSortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          compact={isCompact}
        />

        {/* Bounty list */}
        <BountyList
          bounties={filtered}
          selectedId={selectedBounty?.id ?? null}
          onSelect={openBounty}
        />
      </div>

      {/* Detail panel */}
      {hasPanel && (
        <div
          ref={panelRef}
          className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <BountyDetail bounty={selectedBounty!} onClose={closePanel} />
        </div>
      )}
    </>
  )
}

/* ── Filter bar ── */
interface FilterProps {
  search: string
  onSearch: (v: string) => void
  statusFilter: BountyClaimStatus | "all"
  onStatusFilter: (v: BountyClaimStatus | "all") => void
  projectFilter: string
  onProjectFilter: (v: string) => void
  severityFilter: Severity | "all"
  onSeverityFilter: (v: Severity | "all") => void
}

function BountiesFilterBar({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  projectFilter,
  onProjectFilter,
  severityFilter,
  onSeverityFilter,
}: FilterProps) {
  const statuses: (BountyClaimStatus | "all")[] = ["all", "pending", "under-review", "approved", "paid", "rejected", "disputed"]
  const severityOptions: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"]
  const projects = ["all", "hyperpush-web", "hyperpush-api", "hyperpush-solana"]

  const statusLabel: Record<string, string> = {
    all: "All Status",
    pending: "Pending",
    "under-review": "Under Review",
    approved: "Approved",
    paid: "Paid",
    rejected: "Rejected",
    disputed: "Disputed",
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="relative w-48 md:w-52 shrink-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search claims…"
          className="w-full pl-8 pr-3 py-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none transition-all duration-150"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 ml-auto">
        <div className="flex items-center gap-0.5">
          <SlidersHorizontal size={11} className="text-[var(--text-faint)] mr-1 hidden sm:block" />
          {statuses.map((s) => {
            const isActive = statusFilter === s
            const icon = s === "paid" ? CheckCircle2 : s === "rejected" ? XCircle : s === "disputed" ? AlertCircle : Clock
            const colorMap: Record<string, string> = {
              pending: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
              "under-review": isActive ? "bg-[var(--blue)]/[0.10] text-[var(--blue)]" : "",
              approved: isActive ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "",
              paid: isActive ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "",
              rejected: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
              disputed: isActive ? "bg-[var(--purple)]/[0.10] text-[var(--purple)]" : "",
            }
            return (
              <button
                key={s}
                onClick={() => onStatusFilter(s)}
                className={cn(
                  "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.96]",
                  colorMap[s] || "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {statusLabel[s] || s}
              </button>
            )
          })}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

        <div className="flex items-center gap-0.5">
          {severityOptions.map((s) => {
            if (s === "all") {
              return (
                <button
                  key={s}
                  onClick={() => onSeverityFilter(s)}
                  className={cn(
                    "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.96]",
                    severityFilter === "all"
                      ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  All
                </button>
              )
            }
            const isActive = severityFilter === s
            const colorMap: Record<string, string> = {
              critical: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
              high: isActive ? "bg-[var(--orange)]/[0.12] text-[var(--orange)]" : "",
              medium: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
              low: isActive ? "bg-[var(--blue)]/[0.10] text-[var(--blue)]" : "",
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

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

        <select
          value={projectFilter}
          onChange={(e) => onProjectFilter(e.target.value)}
          className="px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-[var(--text-secondary)] border-0 focus:outline-none focus:ring-1 focus:ring-[var(--line)] cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p} value={p} className="text-[var(--text-primary)] bg-[var(--surface)]">
              {p === "all" ? "All Projects" : p}
            </option>
          ))}
        </select>
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

function BountiesSortBar({ sortKey, sortDir, onToggleSort, compact }: SortBarProps) {
  const sortOptions: Array<{ key: SortKey; label: string; icon: React.ElementType }> = [
    { key: "claimedAt", label: "Claimed", icon: Clock },
    { key: "bountyAmount", label: "Amount", icon: DollarSign },
    { key: "tokenAmount", label: "Tokens", icon: DollarSign },
    { key: "votes", label: "Votes", icon: CheckCircle2 },
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
