"use client"

import { cn } from "@/lib/utils"
import type { Issue, Severity, IssueStatus } from "@/lib/mock-data"
import { GitBranch, Coins, Sparkles, Users, RefreshCw, ArrowUpRight } from "lucide-react"

/* ── Severity accent bar color ── */
const severityAccent: Record<Severity, string> = {
  critical: "var(--red)",
  high: "var(--yellow)",
  medium: "var(--blue)",
  low: "var(--text-faint)",
}

/* ── Severity badge ── */
function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    critical: "bg-[var(--red)]/[0.12] text-[var(--red)] ring-[var(--red)]/20",
    high: "bg-[var(--yellow)]/[0.12] text-[var(--yellow)] ring-[var(--yellow)]/20",
    medium: "bg-[var(--blue)]/[0.10] text-[var(--blue)] ring-[var(--blue)]/20",
    low: "bg-[var(--surface-3)] text-[var(--text-secondary)] ring-[var(--line)]",
  }
  return (
    <span className={`inline-flex items-center px-2 py-[3px] rounded-[4px] text-[10px] font-bold uppercase tracking-[0.06em] leading-none ring-1 ring-inset ${styles[severity]}`}>
      {severity}
    </span>
  )
}

/* ── Status indicator ── */
function StatusIndicator({ status }: { status: IssueStatus }) {
  if (status === "regressed") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--red)] bg-[var(--red)]/[0.10] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--red)]/20">
        <RefreshCw size={8} className="animate-spin" style={{ animationDuration: "3s" }} />
        regressed
      </span>
    )
  }

  if (status === "in-progress") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--yellow)] bg-[var(--yellow)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--yellow)]/15">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--yellow)] animate-pulse" />
        in progress
      </span>
    )
  }

  if (status === "resolved") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--green)] bg-[var(--green)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--green)]/15">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
        resolved
      </span>
    )
  }

  return null
}

/* ── Inline metadata pills ── */
function MetaPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-[2px] rounded-[4px] leading-none", className)}>
      {children}
    </span>
  )
}

/* ── Stat cell ── */
function StatCell({ value, label, icon: Icon }: { value: string | number; label: string; icon?: React.ElementType }) {
  return (
    <div className="text-right">
      <p className="text-[15px] font-bold text-[var(--text-primary)] leading-none tracking-tight tabular-nums flex items-center justify-end gap-1">
        {Icon && <Icon size={11} className="text-[var(--text-tertiary)]" />}
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-1 tracking-wide">{label}</p>
    </div>
  )
}

/* ── File path breadcrumb ── */
function FilePath({ path }: { path: string }) {
  const parts = path.split("/")
  const file = parts.pop() || ""
  return (
    <span className="text-[10px] font-mono leading-none">
      {parts.map((p, i) => (
        <span key={i}>
          <span className="text-[var(--text-faint)]">{p}</span>
          <span className="text-[var(--text-faint)] opacity-50 mx-[1px]">/</span>
        </span>
      ))}
      <span className="text-[var(--text-tertiary)]">{file}</span>
    </span>
  )
}

/* ── Issue row ── */
interface IssueRowProps {
  issue: Issue
  isSelected: boolean
  onClick: () => void
}

function IssueRow({ issue, isSelected, onClick }: IssueRowProps) {
  const accent = severityAccent[issue.severity]

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
      style={{
        boxShadow: isSelected ? "var(--shadow-card-hover)" : "var(--shadow-card)",
      }}
    >
      {/* Left severity accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity duration-150"
        style={{
          backgroundColor: accent,
          opacity: issue.severity === "low" ? 0.4 : 0.8,
        }}
      />

      <div className="pl-5 pr-5 py-4">
        <div className="flex items-start gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top row: badges + metadata */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <SeverityBadge severity={issue.severity} />
              <StatusIndicator status={issue.status} />
              <span className="text-[10px] font-mono text-[var(--text-faint)]">{issue.id}</span>
              {issue.githubIssue && (
                <MetaPill className="text-[var(--text-secondary)] bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)]">
                  <GitBranch size={9} className="opacity-60" /> {issue.githubIssue}
                </MetaPill>
              )}
              {issue.bounty && (
                <MetaPill className="text-[var(--green)] bg-[var(--green)]/[0.08] ring-1 ring-inset ring-[var(--green)]/15">
                  <Coins size={9} /> ${issue.bounty}
                </MetaPill>
              )}
              {issue.aiSummary && (
                <MetaPill className="text-[var(--purple)] bg-[var(--purple)]/[0.08] ring-1 ring-inset ring-[var(--purple)]/15">
                  <Sparkles size={9} /> AI
                </MetaPill>
              )}
            </div>

            {/* Error title */}
            <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug font-mono truncate pr-4">
              {issue.title}
            </p>

            {/* Subtitle */}
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate leading-relaxed">
              {issue.subtitle}
            </p>

            {/* File path */}
            <div className="mt-1.5">
              <FilePath path={issue.file} />
            </div>

            {/* Tags + assignee row */}
            <div className="flex items-center gap-1.5 mt-3">
              {[issue.project, issue.environment, ...issue.tags.slice(0, 2)].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-[3px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--line)]"
                >
                  {tag}
                </span>
              ))}
              {issue.assignee && (
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                  <span className="w-4 h-4 rounded-full bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center text-[8px] font-bold uppercase text-[var(--text-primary)]">
                    {issue.assignee[0]}
                  </span>
                  {issue.assignee}
                </span>
              )}
            </div>
          </div>

          {/* Right side: stats */}
          <div className="flex-shrink-0 flex items-start gap-4 pt-1">
            <StatCell value={issue.count} label="events" />
            <StatCell value={issue.users} label="users" icon={Users} />
            <div className="text-right min-w-[56px]">
              <p className="text-[11px] text-[var(--text-primary)] font-medium leading-none">{issue.lastSeen}</p>
              <p className="text-[10px] text-[var(--text-faint)] mt-1.5">first {issue.firstSeen}</p>
            </div>
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

/* ── Issue list ── */
interface IssueListProps {
  issues: Issue[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function IssueList({ issues, selectedId, onSelect }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center mb-4">
          <Sparkles size={20} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No issues found</p>
        <p className="text-[11px] text-[var(--text-secondary)]">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-3 space-y-2">
      {issues.map((issue) => (
        <IssueRow
          key={issue.id}
          issue={issue}
          isSelected={selectedId === issue.id}
          onClick={() => onSelect(issue.id)}
        />
      ))}
    </div>
  )
}
