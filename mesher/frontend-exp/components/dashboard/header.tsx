"use client"

import { ChevronDown, Search, Clock, Layers, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-20" style={{ height: 'var(--header-height)' }}>
      <div className="flex items-center gap-4">
        <h1 className="text-[15px] font-semibold text-[var(--text-primary)] leading-none tracking-[-0.01em]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <HeaderButton>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shadow-[0_0_4px_var(--green)]" />
          Production
          <ChevronDown size={11} className="text-[var(--text-tertiary)]" />
        </HeaderButton>
        <HeaderButton>
          <Clock size={11} className="text-[var(--text-tertiary)]" />
          Last 24h
          <ChevronDown size={11} className="text-[var(--text-tertiary)]" />
        </HeaderButton>
        <HeaderButton>
          <Layers size={11} className="text-[var(--text-tertiary)]" />
          All projects
          <ChevronDown size={11} className="text-[var(--text-tertiary)]" />
        </HeaderButton>
        {children}
      </div>
    </header>
  )
}

function HeaderButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] hover:border-[var(--line)] transition-all duration-150 active:scale-[0.97]">
      {children}
    </button>
  )
}

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  statusFilter: string
  onStatusFilter: (v: string) => void
  severityFilter: string
  onSeverityFilter: (v: string) => void
}

export function FilterBar({ search, onSearch, statusFilter, onStatusFilter, severityFilter, onSeverityFilter }: FilterBarProps) {
  const statuses = ["all", "open", "in-progress", "regressed", "resolved", "ignored"]
  const severities = ["all", "critical", "high", "medium", "low"]

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="relative w-48 shrink-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search issues…"
          className="w-full pl-8 pr-3 py-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none transition-all duration-150"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 ml-auto">
        <div className="flex items-center gap-0.5">
          <SlidersHorizontal size={11} className="text-[var(--text-faint)] mr-1" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilter(s)}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
                statusFilter === s
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {s === "in-progress" ? "In-Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1" />

        <div className="flex items-center gap-0.5">
          {severities.slice(1).map((s) => {
            const isActive = severityFilter === s
            const colorMap: Record<string, string> = {
              critical: isActive ? "bg-[var(--red)]/[0.12] text-[var(--red)]" : "",
              high: isActive ? "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]" : "",
              medium: isActive ? "bg-[var(--blue)]/[0.10] text-[var(--blue)]" : "",
              low: isActive ? "bg-[var(--surface-3)] text-[var(--text-primary)]" : "",
            }
            return (
              <button
                key={s}
                onClick={() => onSeverityFilter(s === severityFilter ? "all" : s)}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
                  colorMap[s] || "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
