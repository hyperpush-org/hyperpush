"use client"

import { cn } from "@/lib/utils"
import type { Alert, AlertStatus, AlertType, Severity } from "@/lib/mock-data"
import { GitBranch, Sparkles, Bell, BellOff, CheckCircle2, Activity, Clock, Zap, Shield, TrendingUp, AlertTriangle } from "lucide-react"

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

/* ── Type icon map ── */
const typeIcon: Record<AlertType, React.ElementType> = {
  "error-rate": TrendingUp,
  "latency": Clock,
  "availability": Activity,
  "smart-contract": Shield,
  "custom": Zap,
}

/* ── Status badge ── */
function StatusBadge({ status, silenceUntil }: { status: AlertStatus; silenceUntil?: string }) {
  if (status === "firing") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--red)] bg-[var(--red)]/[0.10] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--red)]/20">
        <Bell size={8} className="animate-pulse" />
        firing
      </span>
    )
  }
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--green)] bg-[var(--green)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--green)]/15">
        <CheckCircle2 size={8} />
        resolved
      </span>
    )
  }
  if (status === "silenced") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--yellow)] bg-[var(--yellow)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--yellow)]/15">
        <BellOff size={8} />
        silenced
      </span>
    )
  }
  return null
}

/* ── Channel badges ── */
function ChannelBadges({ channels }: { channels: string[] }) {
  const channelIcons: Record<string, React.ElementType> = {
    slack: () => <span className="font-bold text-[9px]">#</span>,
    email: () => <span className="font-bold text-[9px]">@</span>,
    pagerduty: () => <span className="font-bold text-[9px]">!</span>,
    discord: () => <span className="font-bold text-[9px]">D</span>,
  }

  return (
    <div className="flex items-center gap-1">
      {channels.map((ch) => {
        const Icon = channelIcons[ch]
        return Icon ? (
          <span
            key={ch}
            className="w-4 h-4 rounded bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center text-[var(--text-tertiary)]"
            title={ch}
          >
            <Icon />
          </span>
        ) : null
      })}
    </div>
  )
}

/* ── Alert row ── */
interface AlertRowProps {
  alert: Alert
  isSelected: boolean
  onClick: () => void
}

function AlertRow({ alert, isSelected, onClick }: AlertRowProps) {
  const accent = severityColor[alert.severity]
  const TypeIcon = typeIcon[alert.type]

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
        style={{ backgroundColor: accent, opacity: alert.severity === "low" ? 0.4 : 1 }}
      />

      <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-3.5">
        <div className="flex items-start gap-3 sm:gap-5">

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Title row */}
            <div className="flex items-center gap-2 mb-1.5">
              <TypeIcon size={14} className="shrink-0 text-[var(--text-tertiary)]" />
              <p className="text-[13.5px] sm:text-sm font-semibold font-mono text-[var(--text-primary)] leading-snug truncate">
                {alert.name}
              </p>
              <StatusBadge status={alert.status} silenceUntil={alert.silenceUntil} />
            </div>

            {/* Description */}
            <p className="text-[12px] text-[var(--text-secondary)] truncate mb-2">{alert.description}</p>

            {/* Meta row 1: severity · id · project · env · type */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.05em] leading-none", severityTextClass[alert.severity])}>
                {alert.severity}
              </span>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">{alert.id}</span>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[11px] font-medium text-[var(--text-faint)]">{alert.project}</span>
              <span className="text-[var(--line)] opacity-60">·</span>
              <span className="text-[11px] font-medium text-[var(--text-faint)]">{alert.environment}</span>
              <span className="text-[var(--line)] opacity-60">·</span>
              <span className="text-[11px] font-medium text-[var(--text-faint)] capitalize">{alert.type.replace("-", " ")}</span>
            </div>

            {/* Meta row 2: condition · channels · extras · assignee */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <code className="text-[11px] font-mono text-[var(--blue)] bg-[var(--blue)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--blue)]/15">
                {alert.condition}
              </code>
              <ChannelBadges channels={alert.channels} />
              {alert.linkedIssue && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)] bg-[var(--surface-3)] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--line)] font-mono">
                  <GitBranch size={9} className="opacity-60" /> {alert.linkedIssue}
                </span>
              )}
              {alert.aiInsight && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--purple)] bg-[var(--purple)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--purple)]/15">
                  <Sparkles size={9} /> AI
                </span>
              )}
              {alert.assignee && (
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="w-[18px] h-[18px] rounded-full bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center text-[8px] font-bold uppercase text-[var(--text-primary)]">
                    {alert.assignee[0]}
                  </span>
                  {alert.assignee}
                </span>
              )}
            </div>
          </div>

          {/* Right: value comparison and timing */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2 pt-0.5">
            {/* Value comparison */}
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums" style={{ color: accent }}>
                {alert.currentValue}
              </p>
              <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
                threshold {alert.threshold}
              </p>
            </div>
            {/* Timing */}
            <div className="text-right">
              <p className="text-[12px] font-medium text-[var(--text-primary)]">{alert.lastFired}</p>
              <p className="text-[10px] text-[var(--text-faint)] mt-1">
                {alert.firedCount}x fired
              </p>
            </div>
          </div>

        </div>
      </div>
    </button>
  )
}

/* ── Alert list ── */
interface AlertListProps {
  alerts: Alert[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function AlertList({ alerts, selectedId, onSelect }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center mb-4">
          <Bell size={20} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No alerts found</p>
        <p className="text-[11px] text-[var(--text-secondary)]">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="min-h-[16rem]">
      {/* Header: count + status tabs */}
      <div className="flex flex-wrap items-center pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 gap-y-1.5 border-b border-[var(--line)] bg-[var(--surface)]">
        <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
          <span className="text-[var(--text-primary)] font-semibold tabular-nums">{alerts.length}</span> alerts
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.97]">Bulk actions</button>
        </div>
      </div>

      {/* Rows */}
      {alerts.map((alert) => (
        <AlertRow
          key={alert.id}
          alert={alert}
          isSelected={selectedId === alert.id}
          onClick={() => onSelect(alert.id)}
        />
      ))}
    </div>
  )
}
