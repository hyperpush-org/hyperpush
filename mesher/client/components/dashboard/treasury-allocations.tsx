"use client"

import { type TreasuryAllocation } from "@/lib/mock-data"
import { PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreasuryAllocationsProps {
  allocations: TreasuryAllocation[]
  compact?: boolean
}

export function TreasuryAllocations({ allocations, compact = false }: TreasuryAllocationsProps) {
  const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0)

  return (
    <div className={cn("p-4 lg:p-5", !compact && "border-b border-[var(--line)] lg:border-b-0 lg:border-l border-[var(--line)]")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart size={14} className="text-[var(--purple)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Allocations</h3>
        </div>
        <span className="text-[11px] text-[var(--text-tertiary)]">${totalAmount.toLocaleString()}</span>
      </div>

      {/* Donut chart visualization */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {allocations.map((alloc, i) => {
              const dashArray = `${alloc.percentage} ${100 - alloc.percentage}`
              const dashOffset = allocations.slice(0, i).reduce((sum, a) => sum + a.percentage, 0) * -1
              return (
                <circle
                  key={alloc.category}
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="transparent"
                  stroke={alloc.color}
                  strokeWidth="3"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              )
            })}
          </svg>
          {/* Center hole text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--text-primary)]">
              {totalAmount >= 1000 ? `${(totalAmount / 1000).toFixed(0)}K` : totalAmount}
            </span>
          </div>
        </div>

        {/* Allocations list */}
        <div className="flex-1 space-y-1.5">
          {allocations.map((alloc) => (
            <div key={alloc.category} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alloc.color }} />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">{alloc.category}</span>
                <div className="text-right">
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {alloc.percentage}%
                  </span>
                  <span className="text-[10px] text-[var(--text-faint)] ml-1">
                    ${alloc.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="p-3 rounded-md bg-[var(--surface-2)] border border-[var(--line)]">
          <p className="text-[10px] text-[var(--text-faint)] leading-relaxed">
            Treasury funds are allocated based on community governance. Bounties receive the largest allocation to incentivize bug fixes.
          </p>
        </div>
      )}
    </div>
  )
}
