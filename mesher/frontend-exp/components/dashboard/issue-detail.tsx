"use client"

import { cn } from "@/lib/utils"
import type { Issue } from "@/lib/mock-data"
import {
  X, GitBranch, Coins, Sparkles, ExternalLink, ChevronRight,
  Clock, AlertTriangle, User, Tag, Copy, Check, MoreHorizontal
} from "lucide-react"
import { useState } from "react"

/* ── Types ── */

interface IssueDetailProps {
  issue: Issue
  onClose: () => void
  onOpenAI: () => void
}

/* ── Severity config ── */

const severityConfig = {
  critical: { color: "var(--red)", label: "Critical", classes: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20" },
  high: { color: "var(--yellow)", label: "High", classes: "text-[var(--yellow)] bg-[var(--yellow)]/[0.10] ring-[var(--yellow)]/20" },
  medium: { color: "var(--blue)", label: "Medium", classes: "text-[var(--blue)] bg-[var(--blue)]/[0.10] ring-[var(--blue)]/20" },
  low: { color: "var(--text-tertiary)", label: "Low", classes: "text-[var(--text-secondary)] bg-[var(--surface-3)] ring-[var(--line)]" },
} as const

const statusConfig: Record<string, { label: string; classes: string }> = {
  open: { label: "Open", classes: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20" },
  "in-progress": { label: "In Progress", classes: "text-[var(--yellow)] bg-[var(--yellow)]/[0.10] ring-[var(--yellow)]/20" },
  regressed: { label: "Regressed", classes: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20" },
  resolved: { label: "Resolved", classes: "text-[var(--green)] bg-[var(--green)]/[0.10] ring-[var(--green)]/20" },
  ignored: { label: "Ignored", classes: "text-[var(--text-secondary)] bg-[var(--surface-3)] ring-[var(--line)]" },
}

/* ── Small components ── */

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-[7px]">
      <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      <span className="text-[11px] font-medium text-[var(--text-primary)] tabular-nums">{value}</span>
    </div>
  )
}

function ActionButton({ children, variant = "secondary", onClick, href }: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "accent"
  onClick?: () => void
  href?: string
}) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.97]"
  const styles = {
    primary: "bg-[var(--purple)]/[0.12] text-[var(--purple)] hover:bg-[var(--purple)]/[0.18]",
    secondary: "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)]",
    accent: "bg-[var(--green)]/[0.10] text-[var(--green)] hover:bg-[var(--green)]/[0.16]",
  }

  if (href) {
    return <a href={href} className={cn(base, styles[variant])}>{children}</a>
  }
  return <button onClick={onClick} className={cn(base, styles[variant])}>{children}</button>
}

/* ── Main component ── */

export function IssueDetail({ issue, onClose, onOpenAI }: IssueDetailProps) {
  const [tab, setTab] = useState<"stack" | "breadcrumbs" | "context">("stack")
  const [copied, setCopied] = useState(false)

  const severity = severityConfig[issue.severity]
  const status = statusConfig[issue.status] ?? statusConfig.open

  function copyId() {
    navigator.clipboard.writeText(issue.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <aside className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--line)] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 px-4 h-[var(--header-height)] border-b border-[var(--line)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={copyId}
            title="Copy issue ID"
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            {copied ? <Check size={11} className="text-[var(--green)]" /> : <Copy size={11} />}
            {issue.id}
          </button>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset uppercase tracking-[0.03em] shrink-0",
            status.classes
          )}>
            {status.label}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset shrink-0",
            severity.classes
          )}>
            {severity.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 -mr-1 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-[0.92] shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Title + subtitle */}
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.4] break-words tracking-[-0.01em]">
            {issue.title}
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">{issue.subtitle}</p>
          <p className="text-[10px] font-mono text-[var(--text-faint)] mt-1.5">{issue.file}</p>
        </div>

        {/* Actions row */}
        <div className="px-4 pb-3 flex items-center flex-wrap gap-1.5">
          <ActionButton variant="primary" onClick={onOpenAI}>
            <Sparkles size={11} />
            AI Analysis
          </ActionButton>
          {issue.githubIssue ? (
            <ActionButton variant="secondary" href="#">
              <GitBranch size={11} />
              {issue.githubIssue}
              <ExternalLink size={9} className="text-[var(--text-faint)] -ml-0.5" />
            </ActionButton>
          ) : (
            <ActionButton variant="secondary">
              <GitBranch size={11} />
              Link Issue
            </ActionButton>
          )}
          {issue.bounty && (
            <ActionButton variant="accent">
              <Coins size={11} />
              ${issue.bounty}
            </ActionButton>
          )}
        </div>

        {/* AI insight — compact inline card */}
        {issue.aiSummary && (
          <div className="mx-4 mb-3 rounded-lg border border-[var(--purple)]/[0.12] bg-[var(--purple)]/[0.04] overflow-hidden">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={10} className="text-[var(--purple)] shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--purple)]">AI Analysis</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-[1.65]">{issue.aiSummary}</p>
            </div>
            {issue.suspectCommit && (
              <div className="px-3 py-2 border-t border-[var(--purple)]/[0.08] flex items-center gap-2 bg-[var(--purple)]/[0.02]">
                <GitBranch size={10} className="text-[var(--text-faint)] shrink-0" />
                <span className="text-[10px] text-[var(--text-tertiary)]">Suspect:</span>
                <code className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--surface-3)] px-1.5 py-[1px] rounded">{issue.suspectCommit}</code>
                <button className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--purple)] hover:underline active:scale-[0.97] shrink-0">
                  Open PR <ChevronRight size={9} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Metadata — clean key/value list */}
        <div className="mx-4 mb-1 px-3 py-1 rounded-lg bg-[var(--surface-2)]/60 ring-1 ring-inset ring-[var(--line)]/60 divide-y divide-[var(--line)]/50">
          <MetaItem label="Last seen" value={issue.lastSeen} />
          <MetaItem label="First seen" value={issue.firstSeen} />
          <MetaItem label="Events" value={issue.count.toLocaleString()} />
          <MetaItem label="Users affected" value={issue.users.toLocaleString()} />
          <MetaItem label="Project" value={issue.project} />
          <MetaItem label="Environment" value={issue.environment} />
        </div>

        {/* Tags */}
        {issue.tags.length > 0 && (
          <div className="px-4 py-3 flex items-center flex-wrap gap-1.5">
            {issue.tags.map(tag => (
              <span key={tag} className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-[3px] rounded ring-1 ring-inset ring-[var(--line)] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] px-4 mt-1 sticky top-0 bg-[var(--surface)] z-10">
          {(["stack", "breadcrumbs", "context"] as const).map((t) => {
            const label = t === "stack" ? "Stack Trace" : t === "breadcrumbs" ? "Breadcrumbs" : "Context"
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-0 mr-5 py-2.5 text-[11px] font-medium border-b-[1.5px] transition-colors duration-150",
                  active
                    ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-3 pb-8">
          {tab === "stack" && <StackTraceTab frames={issue.stacktrace} />}
          {tab === "breadcrumbs" && <BreadcrumbsTab breadcrumbs={issue.breadcrumbs} />}
          {tab === "context" && <ContextTab issue={issue} />}
        </div>
      </div>
    </aside>
  )
}

/* ── Tab content components ── */

function StackTraceTab({ frames }: { frames: Issue["stacktrace"] }) {
  if (frames.length === 0) {
    return <p className="text-[11px] text-[var(--text-tertiary)] py-4">No stack trace available.</p>
  }
  return (
    <div className="space-y-1.5">
      {frames.map((frame, i) => (
        <div
          key={i}
          className={cn(
            "rounded-md border text-[11px] font-mono overflow-hidden",
            frame.isApp
              ? "border-[var(--line)] bg-[var(--surface-2)]"
              : "border-[var(--line-subtle)] opacity-40"
          )}
        >
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className={cn("truncate", frame.isApp ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
              {frame.fn}
            </span>
            <span className="text-[var(--text-faint)] text-[10px] shrink-0 ml-2">{frame.file}:{frame.line}</span>
          </div>
          <div className="px-3 py-1.5 border-t border-[var(--line)]/50 bg-[var(--surface)]/50">
            {frame.code.map((line, j) => (
              <div
                key={j}
                className={cn(
                  "px-2 py-[1px] rounded-sm text-[10px] leading-[1.6]",
                  j === frame.highlight ? "bg-[var(--red)]/[0.08] text-[var(--text-primary)]" : "text-[var(--text-faint)]"
                )}
              >
                <span className="inline-block w-7 text-right text-[var(--text-faint)]/60 mr-2 select-none">{frame.line + j - frame.highlight}</span>
                {line}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function BreadcrumbsTab({ breadcrumbs }: { breadcrumbs: Issue["breadcrumbs"] }) {
  if (breadcrumbs.length === 0) {
    return <p className="text-[11px] text-[var(--text-tertiary)] py-4">No breadcrumbs recorded.</p>
  }
  return (
    <div className="relative pl-4 border-l border-[var(--line)] space-y-3">
      {breadcrumbs.map((b, i) => (
        <div key={i} className="relative">
          <div className={cn(
            "absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border",
            b.level === "error" ? "bg-[var(--red)] border-[var(--red)]"
              : b.level === "warning" ? "bg-[var(--yellow)] border-[var(--yellow)]"
              : "bg-[var(--surface-3)] border-[var(--line)]"
          )} />
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-mono text-[var(--text-faint)] flex-shrink-0 mt-0.5">{b.time}</span>
            <div>
              <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded mr-2">{b.type}</span>
              <span className="text-[11px] text-[var(--text-primary)]">{b.message}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ContextTab({ issue }: { issue: Issue }) {
  return (
    <div className="space-y-2.5">
      {[
        { label: "tags", items: issue.tags },
        { label: "project", items: [issue.project] },
        { label: "environment", items: [issue.environment] },
      ].map(({ label, items }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="text-[10px] text-[var(--text-faint)] w-20 flex-shrink-0 font-mono mt-[3px]">{label}</span>
          <div className="flex flex-wrap gap-1">
            {items.map(item => (
              <span key={item} className="text-[10px] text-[var(--text-primary)] bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--line)] px-2 py-[2px] rounded font-mono">{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
