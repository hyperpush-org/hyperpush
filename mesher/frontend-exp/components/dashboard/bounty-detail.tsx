"use client"

import { type BountyClaim, BountyClaimStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, Clock, AlertCircle, XCircle, ExternalLink, Copy, GitPullRequest, ChevronRight, DollarSign, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BountyDetailProps {
  bounty: BountyClaim
  onClose: () => void
}

export function BountyDetail({ bounty, onClose }: BountyDetailProps) {
  const status = getStatusInfo(bounty.status)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2">
          <div className={cn("w-6 h-6 rounded flex items-center justify-center", status.bgColor)}>
            <status.icon size={12} className={status.textColor} />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{bounty.id}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all duration-150 active:scale-[0.93]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Bounty amount card */}
        <div className="mx-3 mt-3 p-4 rounded-lg border border-[var(--green)]/[0.3] bg-[var(--green)]/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Bounty Amount</span>
            <DollarSign size={12} className="text-[var(--green)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--green)]">
              ${bounty.bountyAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {bounty.tokenAmount.toLocaleString()} HPX tokens
          </p>
          {bounty.status === "paid" && bounty.txHash && (
            <button
              onClick={() => copyToClipboard(bounty.txHash!)}
              className="mt-2 flex items-center gap-1 text-[10px] text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Copy size={9} />
              <span className="font-mono">{bounty.txHash.slice(0, 10)}...</span>
            </button>
          )}
        </div>

        {/* Issue info */}
        <div className="px-4 py-3 border-b border-[var(--line)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Issue</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-secondary)]">ID</span>
            <span className="text-xs font-mono text-[var(--text-primary)]">{bounty.issueId}</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{bounty.issueTitle}</p>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px]", getSeverityColor(bounty.severity))}>
              {bounty.severity}
            </Badge>
            <span className="text-xs text-[var(--text-faint)]">{bounty.project}</span>
          </div>
        </div>

        {/* Claimant info */}
        <div className="px-4 py-3 border-b border-[var(--line)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Claimant</h3>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center text-[11px] font-bold text-[var(--text-primary)] ring-1 ring-inset ring-[var(--line)]">
              {bounty.claimant.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{bounty.claimant}</p>
              <p className="text-xs text-[var(--text-faint)]">Claimed {bounty.claimedAt}</p>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="px-4 py-3 border-b border-[var(--line)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Status</h3>
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("w-6 h-6 rounded flex items-center justify-center", status.badgeColor)}>
              <status.icon size={12} />
            </div>
            <span className={cn("text-sm font-medium", status.textColor)}>{status.label}</span>
          </div>

          {/* PR Link */}
          {bounty.prUrl && (
            <a
              href={bounty.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--purple)] transition-colors group"
            >
              <GitPullRequest size={12} className="group-hover:text-[var(--purple)]" />
              <span className="font-medium">View Pull Request</span>
              <ExternalLink size={10} className="text-[var(--text-faint)]" />
            </a>
          )}

          {/* Review notes */}
          {bounty.reviewNotes && (
            <div className="mt-3 p-3 rounded-md bg-[var(--surface-2)] border border-[var(--line)]">
              <p className="text-xs text-[var(--text-secondary)]">{bounty.reviewNotes}</p>
            </div>
          )}

          {/* Resolved time */}
          {bounty.resolvedAt && (
            <p className="text-xs text-[var(--text-faint)] mt-2">Resolved {bounty.resolvedAt}</p>
          )}
        </div>

        {/* Reviewers */}
        {bounty.reviewers.length > 0 && (
          <div className="px-4 py-3 border-b border-[var(--line)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Reviewers</h3>
            <div className="flex flex-wrap gap-2">
              {bounty.reviewers.map((reviewer) => (
                <Badge key={reviewer} variant="outline" className="text-[11px]">
                  {reviewer}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Votes */}
        {bounty.votes && (
          <div className="px-4 py-3 border-b border-[var(--line)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Community Votes</h3>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--green)]/[0.10] text-[var(--green)] text-xs font-medium transition-all hover:bg-[var(--green)]/[0.15]">
                <ThumbsUp size={12} />
                <span>{bounty.votes.up}</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--red)]/[0.10] text-[var(--red)] text-xs font-medium transition-all hover:bg-[var(--red)]/[0.15]">
                <ThumbsDown size={12} />
                <span>{bounty.votes.down}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--surface-2)]">
        {bounty.status === "pending" && (
          <Button size="sm" className="w-full gap-2">
            <Clock size={12} />
            <span>Start Review</span>
          </Button>
        )}
        {bounty.status === "under-review" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <XCircle size={12} />
              <span>Reject</span>
            </Button>
            <Button size="sm" className="flex-1 gap-2">
              <CheckCircle2 size={12} />
              <span>Approve</span>
            </Button>
          </div>
        )}
        {bounty.status === "approved" && (
          <Button size="sm" className="w-full gap-2">
            <DollarSign size={12} />
            <span>Process Payout</span>
          </Button>
        )}
        {bounty.status === "disputed" && (
          <Button variant="outline" size="sm" className="w-full gap-2">
            <AlertCircle size={12} />
            <span>Escalate to Governance</span>
          </Button>
        )}
        {bounty.status === "paid" && (
          <div className="text-center">
            <CheckCircle2 size={16} className="mx-auto text-[var(--green)] mb-1" />
            <p className="text-xs text-[var(--text-secondary)]">Payout completed</p>
          </div>
        )}
        {bounty.status === "rejected" && (
          <div className="text-center">
            <XCircle size={16} className="mx-auto text-[var(--red)] mb-1" />
            <p className="text-xs text-[var(--text-secondary)]">Claim was rejected</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusInfo(status: BountyClaimStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Pending Review",
        icon: Clock,
        textColor: "text-[var(--yellow)]",
        bgColor: "bg-[var(--yellow)]/[0.10]",
        badgeColor: "bg-[var(--yellow)]/[0.10] text-[var(--yellow)]",
      }
    case "under-review":
      return {
        label: "Under Review",
        icon: Clock,
        textColor: "text-[var(--blue)]",
        bgColor: "bg-[var(--blue)]/[0.10]",
        badgeColor: "bg-[var(--blue)]/[0.10] text-[var(--blue)]",
      }
    case "approved":
      return {
        label: "Approved",
        icon: CheckCircle2,
        textColor: "text-[var(--green)]",
        bgColor: "bg-[var(--green)]/[0.10]",
        badgeColor: "bg-[var(--green)]/[0.10] text-[var(--green)]",
      }
    case "paid":
      return {
        label: "Paid",
        icon: CheckCircle2,
        textColor: "text-[var(--green)]",
        bgColor: "bg-[var(--green)]/[0.10]",
        badgeColor: "bg-[var(--green)] text-[var(--background)]",
      }
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        textColor: "text-[var(--red)]",
        bgColor: "bg-[var(--red)]/[0.10]",
        badgeColor: "bg-[var(--red)]/[0.10] text-[var(--red)]",
      }
    case "disputed":
      return {
        label: "Disputed",
        icon: AlertCircle,
        textColor: "text-[var(--purple)]",
        bgColor: "bg-[var(--purple)]/[0.10]",
        badgeColor: "bg-[var(--purple)]/[0.10] text-[var(--purple)]",
      }
    default:
      return {
        label: status,
        icon: Clock,
        textColor: "text-[var(--text-faint)]",
        bgColor: "bg-[var(--surface-2)]",
        badgeColor: "bg-[var(--surface-2)] text-[var(--text-tertiary)]",
      }
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-[var(--red)]/[0.12] text-[var(--red)]"
    case "high":
      return "bg-[var(--orange)]/[0.12] text-[var(--orange)]"
    case "medium":
      return "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]"
    case "low":
      return "bg-[var(--blue)]/[0.10] text-[var(--blue)]"
    default:
      return "bg-[var(--surface-2)] text-[var(--text-tertiary)]"
  }
}
