"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Alert } from "@/lib/mock-data"
import { X, CheckCircle2, BellOff, AlertTriangle, Clock, Activity, Shield, Zap, TrendingUp, Mail, MessageSquare, Phone, Copy, RefreshCw, Sparkles, ChevronDown, ChevronRight, GitBranch, Tag } from "lucide-react"

/* ── Channel icon map ── */
const channelIcon: Record<string, React.ElementType> = {
  slack: MessageSquare,
  email: Mail,
  pagerduty: Phone,
  discord: MessageSquare,
}

/* ── Type icon map ── */
const typeIcon: Record<string, React.ElementType> = {
  "error-rate": TrendingUp,
  "latency": Clock,
  "availability": Activity,
  "smart-contract": Shield,
  "custom": Zap,
}

interface AlertDetailProps {
  alert: Alert
  onClose: () => void
}

export function AlertDetail({ alert, onClose }: AlertDetailProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const TypeIcon = typeIcon[alert.type]

  const severityColor = {
    critical: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20",
    high: "text-[var(--yellow)] bg-[var(--yellow)]/[0.08] ring-[var(--yellow)]/15",
    medium: "text-[var(--blue)] bg-[var(--blue)]/[0.08] ring-[var(--blue)]/15",
    low: "text-[var(--text-tertiary)] bg-[var(--surface-3)] ring-[var(--line)]",
  }[alert.severity]

  const statusColor = {
    firing: "text-[var(--red)]",
    resolved: "text-[var(--green)]",
    silenced: "text-[var(--yellow)]",
  }[alert.status]

  return (
    <div className="flex flex-col h-full bg-[var(--surface-2)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          <span className="text-[13px] font-mono text-[var(--text-faint)] truncate">{alert.id}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title and status */}
        <div className="px-4 py-4 border-b border-[var(--line)]">
          <div className="flex items-start gap-2 mb-3">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ring-1 ring-inset", severityColor)}>
              {alert.severity}
            </span>
            <span className={cn("text-[10px] font-semibold uppercase", statusColor)}>
              {alert.status}
            </span>
          </div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">{alert.name}</h2>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{alert.description}</p>
        </div>

        {/* Value comparison */}
        <div className="px-4 py-4 border-b border-[var(--line)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">Current State</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-[var(--text-faint)] mb-1">Current Value</p>
              <p className="text-[24px] font-bold tabular-nums" style={{ color: alert.severity === "critical" ? "var(--red)" : "var(--text-primary)" }}>
                {alert.currentValue}
              </p>
            </div>
            <div className="text-[var(--line)]">
              <TrendingUp size={20} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-[var(--text-faint)] mb-1">Threshold</p>
              <p className="text-[16px] font-semibold text-[var(--text-secondary)] tabular-nums">
                {alert.threshold}
              </p>
            </div>
          </div>
        </div>

        {/* Condition and window */}
        <div className="px-4 py-3 border-b border-[var(--line)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[var(--text-faint)] mb-1">Condition</p>
              <code className="text-[12px] font-mono text-[var(--blue)]">{alert.condition}</code>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-faint)] mb-1">Evaluation Window</p>
              <p className="text-[12px] text-[var(--text-secondary)]">{alert.evaluationWindow}</p>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        {alert.aiInsight && (
          <div className="border-b border-[var(--line)]">
            <button
              onClick={() => setShowAI(!showAI)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-3)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--purple)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">AI Insight</span>
              </div>
              {showAI ? <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
            </button>
            {showAI && (
              <div className="px-4 pb-3">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed bg-[var(--purple)]/[0.05] p-3 rounded-md border border-[var(--purple)]/10">
                  {alert.aiInsight}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notification channels */}
        <div className="px-4 py-4 border-b border-[var(--line)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">Notification Channels</h3>
          <div className="flex flex-wrap gap-2">
            {alert.channels.map((ch) => {
              const Icon = channelIcon[ch]
              return Icon ? (
                <span
                  key={ch}
                  className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] bg-[var(--surface-3)] px-2 py-1 rounded-md ring-1 ring-inset ring-[var(--line)]"
                >
                  <Icon size={10} />
                  {ch}
                </span>
              ) : null
            })}
          </div>
        </div>

        {/* Metadata */}
        <div className="px-4 py-4 border-b border-[var(--line)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">Metadata</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-faint)]">Project</span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{alert.project}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-faint)]">Environment</span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{alert.environment}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-faint)]">Type</span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] capitalize">{alert.type.replace("-", " ")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-faint)]">Triggered</span>
              <span className="text-[11px] text-[var(--text-secondary)]">{alert.triggeredAt}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-faint)]">Last Fired</span>
              <span className="text-[11px] text-[var(--text-secondary)]">{alert.lastFired}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-faint)]">Fired Count</span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{alert.firedCount}x</span>
            </div>
            {alert.assignee && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-faint)]">Assignee</span>
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">{alert.assignee}</span>
              </div>
            )}
            {alert.silenceUntil && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-faint)]">Silenced Until</span>
                <span className="text-[11px] font-medium text-[var(--yellow)]">{alert.silenceUntil}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {alert.tags.length > 0 && (
          <div className="px-4 py-4 border-b border-[var(--line)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {alert.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--text-faint)] bg-[var(--surface-3)] px-1.5 py-1 rounded-md"
                >
                  <Tag size={8} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Linked issue */}
        {alert.linkedIssue && (
          <div className="px-4 py-4 border-b border-[var(--line)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">Linked Issue</h3>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-[11px] text-[var(--blue)] hover:text-[var(--blue)]/80 transition-colors"
            >
              <GitBranch size={10} />
              {alert.linkedIssue}
            </a>
          </div>
        )}

        {/* History */}
        <div className="border-b border-[var(--line)]">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-3)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--text-tertiary)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">History</span>
              <span className="text-[10px] text-[var(--text-faint)]">({alert.history.length})</span>
            </div>
            {showHistory ? <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
          </button>
          {showHistory && (
            <div className="px-4 pb-3">
              <div className="space-y-2">
                {alert.history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px]">
                    <span className="text-[var(--text-faint)] w-16 shrink-0">{h.timestamp}</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md",
                      h.status === "firing" ? "text-[var(--red)] bg-[var(--red)]/[0.10]" : "text-[var(--green)] bg-[var(--green)]/[0.10]"
                    )}>
                      {h.status === "firing" ? <BellOff size={8} /> : <CheckCircle2 size={8} />}
                      {h.status}
                    </span>
                    <span className="font-mono text-[var(--text-secondary)]">{h.value}</span>
                    {h.notified && <span className="text-[var(--text-faint)] ml-auto">notified</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div className="px-4 py-3 border-t border-[var(--line)] shrink-0 bg-[var(--surface)]">
        <div className="flex flex-wrap gap-2">
          {alert.status === "firing" && (
            <>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[var(--background)] bg-[var(--green)] rounded-md transition-colors hover:bg-[var(--green)]/90 active:scale-[0.97]">
                <CheckCircle2 size={12} />
                Resolve
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[var(--text-primary)] bg-[var(--surface-3)] rounded-md transition-colors hover:bg-[var(--surface-raised)] active:scale-[0.97]">
                <BellOff size={12} />
                Silence
              </button>
            </>
          )}
          {alert.status === "silenced" && (
            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[var(--text-primary)] bg-[var(--surface-3)] rounded-md transition-colors hover:bg-[var(--surface-raised)] active:scale-[0.97]">
              <RefreshCw size={12} />
              Unsnooze
            </button>
          )}
          <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-3)] rounded-md transition-colors hover:bg-[var(--surface-raised)] active:scale-[0.97]">
            <Copy size={12} />
            Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}
