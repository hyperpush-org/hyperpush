"use client"

import { useState } from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { ChevronDown, Search, Clock, Layers, SlidersHorizontal, MoreHorizontal, Sparkles, X, Check, Server, Box } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Shared dropdown menu styles ───────────────────────────────────────────────

function MenuContent({ children, align = "end", ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & { align?: "start" | "center" | "end" }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={5}
        className="z-50 min-w-[180px] rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        {...props}
      >
        <div className="p-1">{children}</div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
      {children}
    </div>
  )
}

function MenuItem({
  children,
  active,
  onClick,
  icon,
  accent,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  icon?: React.ReactNode
  accent?: string
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onClick}
      className={cn(
        "relative flex items-center gap-2 px-2 py-[7px] rounded-md text-[12px] font-medium cursor-pointer outline-none select-none transition-colors",
        "data-[highlighted]:bg-[var(--surface-3)]",
        active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] data-[highlighted]:text-[var(--text-primary)]"
      )}
    >
      {icon && <span className="shrink-0 text-[var(--text-tertiary)]">{icon}</span>}
      <span className="flex-1">{children}</span>
      {accent && <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none", accent)}>{active ? "" : ""}</span>}
      {active && <Check size={11} className="shrink-0 text-[var(--green)]" />}
    </DropdownMenuPrimitive.Item>
  )
}

function MenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-[var(--line)]" />
}

// ─── Environment / Production dropdown ─────────────────────────────────────────

const ENVIRONMENTS = [
  { id: "production", label: "Production", color: "var(--green)" },
  { id: "staging", label: "Staging", color: "var(--yellow)" },
  { id: "development", label: "Development", color: "var(--blue)" },
]

function EnvDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const env = ENVIRONMENTS.find((e) => e.id === value) ?? ENVIRONMENTS[0]
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <HeaderButton className="h-8">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: env.color, boxShadow: `0 0 4px ${env.color}` }} />
          <span className="hidden sm:inline whitespace-nowrap">{env.label}</span>
          <ChevronDown size={11} className="text-[var(--text-tertiary)] shrink-0" />
        </HeaderButton>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent align="start">
        <MenuLabel>Environment</MenuLabel>
        {ENVIRONMENTS.map((e) => (
          <MenuItem key={e.id} active={value === e.id} onClick={() => onChange(e.id)} icon={
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color, boxShadow: `0 0 4px ${e.color}` }} />
          }>
            {e.label}
          </MenuItem>
        ))}
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  )
}

// ─── Time range dropdown ────────────────────────────────────────────────────────

const TIME_RANGES = [
  { id: "1h", label: "Last 1 hour" },
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
]

const TIME_LABELS: Record<string, string> = {
  "1h": "Last 1h",
  "24h": "Last 24h",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}

function TimeRangeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <HeaderButton className="h-8">
          <Clock size={11} className="text-[var(--text-tertiary)] shrink-0" />
          <span className="whitespace-nowrap">{TIME_LABELS[value] ?? "Last 24h"}</span>
          <ChevronDown size={11} className="text-[var(--text-tertiary)] shrink-0" />
        </HeaderButton>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent>
        <MenuLabel>Time range</MenuLabel>
        {TIME_RANGES.map((t) => (
          <MenuItem key={t.id} active={value === t.id} onClick={() => onChange(t.id)}>
            {t.label}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onClick={() => {}} icon={<Clock size={12} />}>
          Custom range…
        </MenuItem>
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  )
}

// ─── Project dropdown ───────────────────────────────────────────────────────────

const PROJECTS = [
  { id: "all", label: "All projects", icon: null },
  { id: "hyperpush-web", label: "hyperpush-web", icon: <Box size={11} className="text-[var(--green)]" /> },
  { id: "hyperpush-api", label: "hyperpush-api", icon: <Box size={11} className="text-[var(--blue)]" /> },
]

function ProjectDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const proj = PROJECTS.find((p) => p.id === value) ?? PROJECTS[0]
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <HeaderButton className="h-8">
          <Layers size={11} className="text-[var(--text-tertiary)] shrink-0" />
          <span className="whitespace-nowrap">{proj.label}</span>
          <ChevronDown size={11} className="text-[var(--text-tertiary)] shrink-0" />
        </HeaderButton>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent>
        <MenuLabel>Project</MenuLabel>
        {PROJECTS.map((p) => (
          <MenuItem key={p.id} active={value === p.id} onClick={() => onChange(p.id)} icon={
            p.icon ?? <Layers size={11} className="text-[var(--text-faint)]" />
          }>
            {p.label}
          </MenuItem>
        ))}
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  )
}

// ─── Collapsed "..." dropdown (mobile/narrow) ───────────────────────────────────

function CollapsedFiltersDropdown({
  timeRange,
  onTimeRange,
  project,
  onProject,
}: {
  timeRange: string
  onTimeRange: (v: string) => void
  project: string
  onProject: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-[0.97] shrink-0"
          aria-label="More filters"
        >
          {open ? <X size={14} /> : <MoreHorizontal size={14} />}
        </button>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent align="end">
        <MenuLabel>Time range</MenuLabel>
        {TIME_RANGES.map((t) => (
          <MenuItem key={t.id} active={timeRange === t.id} onClick={() => onTimeRange(t.id)}>
            {t.label}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuLabel>Project</MenuLabel>
        {PROJECTS.map((p) => (
          <MenuItem key={p.id} active={project === p.id} onClick={() => onProject(p.id)} icon={
            p.icon ?? <Layers size={11} className="text-[var(--text-faint)]" />
          }>
            {p.label}
          </MenuItem>
        ))}
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  )
}

// ─── Header ─────────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const [env, setEnv] = useState("production")
  const [timeRange, setTimeRange] = useState("24h")
  const [project, setProject] = useState("all")

  return (
    <header
      className="flex items-center justify-between px-3 sm:px-6 border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-20"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <h1 className="text-[15px] font-semibold text-[var(--text-primary)] leading-none tracking-[-0.01em] truncate max-w-[120px] sm:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Environment — always visible */}
        <EnvDropdown value={env} onChange={setEnv} />

        {/* Time range — visible on md+ as its own button, hidden on smaller */}
        <div className="hidden md:flex">
          <TimeRangeDropdown value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Project — visible on md+ as its own button, hidden on smaller */}
        <div className="hidden md:flex">
          <ProjectDropdown value={project} onChange={setProject} />
        </div>

        {/* Collapsed "..." — shown below md, contains time range + project */}
        <div className="flex md:hidden">
          <CollapsedFiltersDropdown
            timeRange={timeRange}
            onTimeRange={setTimeRange}
            project={project}
            onProject={setProject}
          />
        </div>

        {/* Slot for AI Copilot etc. */}
        {children}
      </div>
    </header>
  )
}

// ─── Header button primitive ────────────────────────────────────────────────────

function HeaderButton({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
  [key: string]: unknown
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 px-2 sm:px-3 rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] hover:border-[var(--line)] transition-all duration-150 active:scale-[0.97] min-h-[32px] h-8 shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Filter bar ─────────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  statusFilter: string
  onStatusFilter: (v: string) => void
  severityFilter: string
  onSeverityFilter: (v: string) => void
}

export function FilterBar({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  severityFilter,
  onSeverityFilter,
}: FilterBarProps) {
  const statuses = ["all", "open", "in-progress", "regressed", "resolved", "ignored"]
  const severities = ["all", "critical", "high", "medium", "low"]

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="relative w-44 sm:w-48 shrink-0">
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
          <SlidersHorizontal size={11} className="text-[var(--text-faint)] mr-1 hidden sm:block" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilter(s)}
              className={cn(
                "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
                statusFilter === s
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {s === "in-progress" ? "In-Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-3.5 bg-[var(--line)] mx-1 hidden md:block" />

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
                  "px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 active:scale-[0.96]",
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
