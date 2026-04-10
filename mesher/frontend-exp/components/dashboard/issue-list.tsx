"use client"

import { cn } from "@/lib/utils"
import type { Issue, Severity, IssueStatus } from "@/lib/mock-data"
import { GitBranch, Coins, Sparkles, Users, RefreshCw } from "lucide-react"

/* ── Severity color map ── */
const severityColor: Record<Severity, string> = {
  critical: "var(--red)",
  high: "var(--yellow)",
  medium: "var(--blue)",
  low: "var(--text-faint)",
}

const severityTextClass: Record<Severity, string> = {
  critical: "text-[var(--red)]",
  high: "text-[var(--yellow)]",
  medium: "text-[var(--blue)]",
  low: "text-[var(--text-tertiary)]",
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: IssueStatus }) {
  if (status === "regressed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--red)] bg-[var(--red)]/[0.10] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--red)]/20">
        <RefreshCw size={8} className="animate-spin" style={{ animationDuration: "3s" }} />
        regressed
      </span>
    )
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--yellow)] bg-[var(--yellow)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--yellow)]/15">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--yellow)] animate-pulse" />
        in progress
      </span>
    )
  }
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--green)] bg-[var(--green)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--green)]/15">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
        resolved
      </span>
    )
  }
  return null
}

/* ── File path ── */
function FilePath({ path }: { path: string }) {
  const parts = path.split("/")
  const file = parts.pop() || ""
  return (
    <span className="font-mono text-[11px] leading-none">
      <span className="text-[var(--text-faint)]">{parts.join("/")}/</span>
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
  const accent = severityColor[issue.severity]

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
      {/* Full-height left severity stripe */}
      <div
        className="absolute left-0 inset-y-0 w-[3px]"
        style={{ backgroundColor: accent, opacity: issue.severity === "low" ? 0.4 : 1 }}
      />

      <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-3.5">
        <div className="flex items-start gap-3 sm:gap-5">

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Title */}
            <p className="text-[13.5px] sm:text-sm font-semibold font-mono text-[var(--text-primary)] leading-snug">
              {issue.title}
            </p>

            {/* Meta row 1: severity · id · subtitle · status */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.05em] leading-none", severityTextClass[issue.severity])}>
                {issue.severity}
              </span>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">{issue.id}</span>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[12px] text-[var(--text-secondary)] truncate max-w-[24rem]">{issue.subtitle}</span>
              <StatusBadge status={issue.status} />
            </div>

            {/* Meta row 2: file · project · env · tags · extras · assignee */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <FilePath path={issue.file} />
              <span className="text-[var(--line)] opacity-60">·</span>
              {[issue.project, issue.environment, ...issue.tags.slice(0, 2)].map((tag, i) => (
                <span key={tag + i} className="text-[11px] font-medium text-[var(--text-faint)]">
                  {tag}
                </span>
              ))}
              {issue.githubIssue && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)] bg-[var(--surface-3)] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--line)] font-mono">
                  <GitBranch size={9} className="opacity-60" /> {issue.githubIssue}
                </span>
              )}
              {issue.bounty && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--green)] bg-[var(--green)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--green)]/15">
                  <Coins size={9} /> ${issue.bounty}
                </span>
              )}
              {issue.aiSummary && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--purple)] bg-[var(--purple)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--purple)]/15">
                  <Sparkles size={9} /> AI
                </span>
              )}
              {issue.assignee && (
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="w-[18px] h-[18px] rounded-full bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center text-[8px] font-bold uppercase text-[var(--text-primary)]">
                    {issue.assignee[0]}
                  </span>
                  {issue.assignee}
                </span>
              )}
            </div>
          </div>

          {/* Right: stats — widths mirror the column headers below */}
          <div className="flex-shrink-0 flex items-start gap-3 sm:gap-4 pt-0.5">
            <div className="text-right w-[48px] sm:w-[56px]">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums">
                {issue.count.toLocaleString()}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">events</p>
            </div>
            <div className="text-right w-[38px] sm:w-[44px]">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums flex items-center justify-end gap-1">
                <Users size={10} className="text-[var(--text-tertiary)]" />
                {issue.users}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">users</p>
            </div>
            <div className="text-right w-[52px] sm:w-[60px]">
              <p className="text-[12px] font-medium text-[var(--text-primary)] leading-none">{issue.lastSeen}</p>
              <p className="text-[10px] text-[var(--text-faint)] mt-1.5">first {issue.firstSeen}</p>
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
  statusFilter: string
  severityFilter: string
}

export function IssueList({ issues, selectedId, onSelect, statusFilter, severityFilter }: IssueListProps) {
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
    <div className="min-h-[16rem]">
      {/* Combined header: count + sort on left, column headers on right */}
      <div className="flex flex-wrap items-center pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 gap-y-1.5 border-b border-[var(--line)] bg-[var(--surface)]">
        {/* Left: issue count + sort/actions */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
            <span className="text-[var(--text-primary)] font-semibold tabular-nums">{issues.length}</span> issues
            {statusFilter !== "all" && <span className="text-[var(--text-faint)]"> · {statusFilter}</span>}
            {severityFilter !== "all" && <span className="text-[var(--text-faint)]"> · {severityFilter}</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-faint)]">Sort: Last seen</span>
            <button className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.97]">Bulk actions</button>
          </div>
        </div>

        {/* Right: column headers — pushed to far right, wraps below on small screens */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[48px] sm:w-[56px] text-right">events</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[38px] sm:w-[44px] text-right">users</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[52px] sm:w-[60px] text-right">time</span>
        </div>
      </div>

      {/* Rows */}
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
