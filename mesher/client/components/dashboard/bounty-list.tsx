"use client"

import { type BountyClaim, type BountyClaimStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, AlertCircle, XCircle, ExternalLink, GitPullRequest, ChevronRight } from "lucide-react"

interface BountyListProps {
  bounties: BountyClaim[]
  selectedId: string | null
  onSelect: (bounty: BountyClaim) => void
}

export function BountyList({ bounties, selectedId, onSelect }: BountyListProps) {
  if (bounties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
          <Clock size={24} className="text-[var(--text-faint)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">No bounty claims found</p>
        <p className="text-xs text-[var(--text-faint)] mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--line)]">
      {bounties.map((bounty) => {
        const isSelected = selectedId === bounty.id
        const status = getStatusInfo(bounty.status)

        return (
          <button
            key={bounty.id}
            onClick={() => onSelect(bounty)}
            className={cn(
              "w-full text-left px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors group relative",
              isSelected && "bg-[var(--surface-2)]"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Status icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                status.bgColor
              )}>
                <status.icon size={14} className={status.textColor} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">{bounty.id}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                    status.badgeColor
                  )}>
                    {status.label}
                  </span>
                  {bounty.severity && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                      getSeverityColor(bounty.severity)
                    )}>
                      {bounty.severity}
                    </span>
                  )}
                </div>

                {/* Issue title */}
                <p className="text-sm font-medium text-[var(--text-primary)] truncate mb-1 group-hover:text-[var(--purple)] transition-colors">
                  {bounty.issueTitle}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <GitPullRequest size={11} />
                    {bounty.issueId}
                  </span>
                  <span className="font-mono">{bounty.project}</span>
                  <span className="text-[var(--text-faint)]">by</span>
                  <span className="font-medium text-[var(--text-primary)]">{bounty.claimant}</span>
                  <span className="text-[var(--text-faint)]">•</span>
                  <span>{bounty.claimedAt}</span>
                </div>

                {/* Bounty amount */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--green)]">
                    ${bounty.bountyAmount.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {bounty.tokenAmount.toLocaleString()} HPX
                  </span>
                  {bounty.votes && (
                    <span className="text-xs text-[var(--text-faint)] ml-auto">
                      {bounty.votes.up}↑ {bounty.votes.down}↓
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight
                size={14}
                className={cn(
                  "shrink-0 mt-1 transition-colors",
                  isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-faint)] group-hover:text-[var(--text-secondary)]"
                )}
              />
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--purple)]" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function getStatusInfo(status: BountyClaimStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
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
