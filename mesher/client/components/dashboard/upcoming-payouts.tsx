"use client"

import { type UpcomingPayout } from "@/lib/mock-data"
import { Clock, DollarSign, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpcomingPayoutsProps {
  payouts: UpcomingPayout[]
}

export function UpcomingPayouts({ payouts }: UpcomingPayoutsProps) {
  if (payouts.length === 0) return null

  return (
    <div className="border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="px-4 py-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-[var(--yellow)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Upcoming Payouts</h3>
          <span className="ml-auto text-[10px] text-[var(--text-faint)]">{payouts.length} pending</span>
        </div>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {payouts.map((payout) => (
          <div key={payout.id} className="px-4 py-3 hover:bg-[var(--surface-2)] transition-colors">
            <div className="flex items-start gap-3">
              {/* Status icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                payout.status === "approved" ? "bg-[var(--green)]/[0.10]" : "bg-[var(--yellow)]/[0.12]"
              )}>
                <DollarSign size={14} className={payout.status === "approved" ? "text-[var(--green)]" : "text-[var(--yellow)]"} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">{payout.issueId}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                    payout.status === "approved" ? "bg-[var(--green)]/[0.10] text-[var(--green)]" : "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]"
                  )}>
                    {payout.status.replace("-", " ")}
                  </span>
                </div>

                {/* Issue title */}
                <p className="text-sm font-medium text-[var(--text-primary)] truncate mb-1">
                  {payout.issueTitle}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                  <span>by {payout.claimant}</span>
                  <span className="text-[var(--text-faint)]">•</span>
                  <span>{payout.scheduledFor}</span>
                </div>

                {/* Amount */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--green)]">
                    ${payout.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {payout.tokenAmount.toLocaleString()} HPX
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight size={14} className="shrink-0 mt-1 text-[var(--text-faint)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
