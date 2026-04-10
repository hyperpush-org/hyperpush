"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Release } from "@/lib/mock-data"
import {
  X, GitBranch, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle2, XCircle, AlertCircle, PauseCircle, Clock,
  ExternalLink, Hash, Copy, Check, Rocket, Shield,
  FileText, Users, Zap, TrendingUp, MoreHorizontal
} from "lucide-react"

interface ReleaseDetailProps {
  release: Release
  onClose: () => void
  onOpenAI?: () => void
}

const statusConfig: Record<Release["status"], { icon: React.ElementType; color: string; label: string; bg: string }> = {
  deployed: { icon: CheckCircle2, color: "var(--green)", label: "Deployed", bg: "bg-[var(--green)]/[0.10]" },
  "rolling-back": { icon: ArrowUpRight, color: "var(--yellow)", label: "Rolling Back", bg: "bg-[var(--yellow)]/[0.10]" },
  failed: { icon: XCircle, color: "var(--red)", label: "Failed", bg: "bg-[var(--red)]/[0.10]" },
  pending: { icon: PauseCircle, color: "var(--blue)", label: "Pending", bg: "bg-[var(--blue)]/[0.10]" },
  staged: { icon: Clock, color: "var(--purple)", label: "Staged", bg: "bg-[var(--purple)]/[0.10]" },
}

const environmentConfig: Record<Release["environment"], { color: string; label: string; bg: string }> = {
  production: { color: "var(--green)", label: "Production", bg: "bg-[var(--green)]/[0.10]" },
  staging: { color: "var(--blue)", label: "Staging", bg: "bg-[var(--blue)]/[0.10]" },
  testnet: { color: "var(--purple)", label: "Testnet", bg: "bg-[var(--purple)]/[0.10]" },
  mainnet: { color: "var(--yellow)", label: "Mainnet", bg: "bg-[var(--yellow)]/[0.10]" },
}

function MetaItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--line)]/40 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={11} className="text-[var(--text-faint)] shrink-0" />}
        <span className="text-[11px] text-[var(--text-faint)]">{label}</span>
      </div>
      <span className="text-[11px] font-medium text-[var(--text-secondary)] tabular-nums text-right">{value}</span>
    </div>
  )
}

function ActionButton({ children, variant = "secondary", onClick, disabled }: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "danger" | "accent"
  onClick?: () => void
  disabled?: boolean
}) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-md text-[11px] font-medium transition-all duration-150 active:scale-[0.97]"
  const styles = {
    primary: "bg-[var(--purple)]/[0.12] text-[var(--purple)] hover:bg-[var(--purple)]/[0.18]",
    secondary: "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)]",
    danger: "bg-[var(--red)]/[0.10] text-[var(--red)] hover:bg-[var(--red)]/[0.16]",
    accent: "bg-[var(--green)]/[0.10] text-[var(--green)] hover:bg-[var(--green)]/[0.16]",
  }
  const disabledStyles = "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-current"

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(base, styles[variant], disabled && disabledStyles)}
    >
      {children}
    </button>
  )
}

export function ReleaseDetail({ release, onClose, onOpenAI }: ReleaseDetailProps) {
  const [tab, setTab] = useState<"overview" | "notes" | "changes">("overview")
  const [copied, setCopied] = useState(false)

  const status = statusConfig[release.status]
  const env = environmentConfig[release.environment]

  function copyCommit() {
    navigator.clipboard.writeText(release.commit)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  return (
    <aside className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--line)] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 px-4 h-[var(--header-height)] border-b border-[var(--line)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={copyCommit}
            title="Copy commit hash"
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            {copied ? <Check size={11} className="text-[var(--green)]" /> : <Hash size={11} />}
            {release.commit}
          </button>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset uppercase tracking-[0.03em] shrink-0",
            status.bg
          )}
            style={{ color: status.color }}
          >
            {status.label}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset shrink-0",
            env.bg
          )}
            style={{ color: env.color }}
          >
            {env.label}
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
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.4]">
              {release.version}
            </h2>
            {release.rollbackTx && (
              <span className="text-[10px] text-[var(--red)] bg-[var(--red)]/[0.10] px-1.5 py-0.5 rounded font-medium">
                Rolled back
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{release.commitMessage}</p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-faint)] font-mono">
            <span>{release.author}</span>
            <span className="text-[var(--line)]">·</span>
            <span>{release.branch}</span>
            <span className="text-[var(--line)]">·</span>
            <span>{release.deployedAt}</span>
          </div>
        </div>

        {/* Actions row */}
        <div className="px-4 pb-3 flex items-center flex-wrap gap-1.5">
          {release.rollbackable && release.status !== "failed" && (
            <ActionButton variant="danger">
              <Rocket size={11} />
              Rollback
            </ActionButton>
          )}
          <ActionButton variant="secondary">
            <GitBranch size={11} />
            View Diff
          </ActionButton>
          {release.smartContract && (
            <ActionButton variant="secondary">
              <Shield size={11} />
              Verify Contract
            </ActionButton>
          )}
          {onOpenAI && (
            <ActionButton variant="primary" onClick={onOpenAI}>
              <Zap size={11} />
              AI Analysis
            </ActionButton>
          )}
        </div>

        {/* AI insight */}
        {release.aiSummary && (
          <div className="mx-4 mb-3 rounded-lg border border-[var(--purple)]/[0.12] bg-[var(--purple)]/[0.04] overflow-hidden">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={10} className="text-[var(--purple)] shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--purple)]">AI Insight</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-[1.65]">{release.aiSummary}</p>
            </div>
          </div>
        )}

        {/* Smart contract info */}
        {release.smartContract && (
          <div className="mx-4 mb-3 rounded-lg border border-[var(--purple)]/[0.12] bg-[var(--purple)]/[0.04] overflow-hidden">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield size={10} className="text-[var(--purple)] shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--purple)]">Smart Contract</span>
                {release.smartContract.verified && (
                  <CheckCircle2 size={9} className="text-[var(--green)] ml-auto" />
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-faint)]">Address</span>
                  <code className="text-[11px] font-mono text-[var(--text-primary)] bg-[var(--surface-3)] px-1.5 py-[1px] rounded">
                    {formatAddress(release.smartContract.address)}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-faint)]">Network</span>
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">{release.smartContract.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-faint)]">Tx Hash</span>
                  <code className="text-[11px] font-mono text-[var(--text-primary)] bg-[var(--surface-3)] px-1.5 py-[1px] rounded">
                    {formatAddress(release.smartContract.txHash)}
                  </code>
                </div>
              </div>
            </div>
            <div className="px-3 py-2 border-t border-[var(--purple)]/[0.08] flex items-center gap-2 bg-[var(--purple)]/[0.02]">
              <a
                href="#"
                className="flex items-center gap-0.5 text-[11px] text-[var(--purple)] hover:underline active:scale-[0.97] shrink-0"
              >
                View on Explorer <ExternalLink size={8} />
              </a>
            </div>
          </div>
        )}

        {/* Rollback info */}
        {release.rollbackTx && (
          <div className="mx-4 mb-3 rounded-lg border border-[var(--red)]/[0.12] bg-[var(--red)]/[0.04] overflow-hidden">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowUpRight size={10} className="text-[var(--red)] shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--red)]">Rollback Transaction</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash size={10} className="text-[var(--text-faint)] shrink-0" />
                <code className="text-[11px] font-mono text-[var(--text-primary)] bg-[var(--surface-3)] px-1.5 py-[1px] rounded flex-1">
                  {release.rollbackTx}
                </code>
                <a href="#" className="text-[11px] text-[var(--red)] hover:underline flex items-center gap-0.5">
                  View <ExternalLink size={8} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Performance metrics */}
        <div className="mx-4 mb-3 px-3 py-1 rounded-lg bg-[var(--surface-2)]/60 ring-1 ring-inset ring-[var(--line)]/60">
          <MetaItem
            label="Error rate"
            value={
              <span className="flex items-center gap-1">
                {release.errorRate}%
                {release.errorRateChange !== 0 && (
                  <>
                    {release.errorRateChange > 0 ? <ArrowUpRight size={9} className="text-[var(--red)]" /> : <ArrowDownRight size={9} className="text-[var(--green)]" />}
                    <span className={cn("text-[9px]", release.errorRateChange > 0 ? "text-[var(--red)]" : "text-[var(--green)]")}>
                      {release.errorRateChange > 0 ? "+" : ""}{release.errorRateChange}%
                    </span>
                  </>
                )}
              </span>
            }
            icon={AlertCircle}
          />
          <MetaItem
            label="P95 latency"
            value={
              <span className="flex items-center gap-1">
                {release.p95Latency}ms
                {release.p95LatencyChange !== 0 && (
                  <>
                    {release.p95LatencyChange > 0 ? <ArrowUpRight size={9} className="text-[var(--red)]" /> : <ArrowDownRight size={9} className="text-[var(--green)]" />}
                    <span className={cn("text-[9px]", release.p95LatencyChange > 0 ? "text-[var(--red)]" : "text-[var(--green)]")}>
                      {release.p95LatencyChange > 0 ? "+" : ""}{release.p95LatencyChange}
                    </span>
                  </>
                )}
              </span>
            }
            icon={Zap}
          />
          <MetaItem label="Impacted issues" value={release.impactedIssues} icon={FileText} />
          <MetaItem label="Users affected" value={release.users.toLocaleString()} icon={Users} />
        </div>

        {/* Tags */}
        {release.tags.length > 0 && (
          <div className="px-4 py-3 flex items-center flex-wrap gap-1.5">
            {release.tags.map(tag => (
              <span key={tag} className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-[3px] rounded ring-1 ring-inset ring-[var(--line)] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] px-4 mt-1 sticky top-0 bg-[var(--surface)] z-10">
          {(["overview", "notes", "changes"] as const).map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-0 mr-5 py-2.5 text-[11px] font-medium border-b-[1.5px] transition-colors duration-150 capitalize",
                  active
                    ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-3 pb-8">
          {tab === "overview" && <OverviewTab release={release} />}
          {tab === "notes" && <NotesTab release={release} />}
          {tab === "changes" && <ChangesTab release={release} />}
        </div>
      </div>
    </aside>
  )
}

/* ── Tab content components ── */

function OverviewTab({ release }: { release: Release }) {
  return (
    <div className="space-y-2.5">
      <div className="text-[12px] text-[var(--text-secondary)] leading-[1.7]">
        <p className="mb-2">This release was deployed to <strong>{release.environment}</strong> {release.deployedAt}.</p>
        {release.smartContract && (
          <p className="mb-2">A smart contract was deployed as part of this release. Verify contract code on Solscan before interacting.</p>
        )}
        {release.rollbackTx && (
          <p className="text-[var(--red)]">This release was rolled back due to issues detected post-deployment.</p>
        )}
      </div>
    </div>
  )
}

function NotesTab({ release }: { release: Release }) {
  if (release.releaseNotes.length === 0) {
    return <p className="text-[12px] text-[var(--text-secondary)] py-4">No release notes available.</p>
  }
  return (
    <ul className="space-y-2">
      {release.releaseNotes.map((note, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-[var(--purple)] mt-0.5">•</span>
          <span className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{note}</span>
        </li>
      ))}
    </ul>
  )
}

function ChangesTab({ release }: { release: Release }) {
  return (
    <div className="space-y-3">
      <div className="text-[12px] text-[var(--text-secondary)]">
        <p className="mb-2">Compare this release with the previous version to see what changed.</p>
        <div className="flex items-center gap-2">
          <button className="text-[11px] text-[var(--purple)] hover:underline flex items-center gap-1">
            <ExternalLink size={9} />
            View diff on GitHub
          </button>
        </div>
      </div>
    </div>
  )
}
