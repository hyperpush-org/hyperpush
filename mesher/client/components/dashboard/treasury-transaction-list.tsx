"use client"

import { type TreasuryTransaction } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet, ChevronRight, Clock } from "lucide-react"

interface TreasuryTransactionListProps {
  transactions: TreasuryTransaction[]
  selectedId: string | null
  onSelect: (txn: TreasuryTransaction) => void
}

export function TreasuryTransactionList({ transactions, selectedId, onSelect }: TreasuryTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
          <Wallet size={24} className="text-[var(--text-faint)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">No transactions found</p>
        <p className="text-xs text-[var(--text-faint)] mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--line)]">
      {transactions.map((txn) => {
        const isSelected = selectedId === txn.id
        const type = getTransactionType(txn.type)

        return (
          <button
            key={txn.id}
            onClick={() => onSelect(txn)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-[var(--surface-2)] transition-colors group relative",
              isSelected && "bg-[var(--surface-2)]"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Type icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                type.bgColor
              )}>
                <type.icon size={14} className={type.textColor} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">{txn.id}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                    type.badgeColor
                  )}>
                    {txn.type}
                  </span>
                  {txn.status !== "confirmed" && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                      getStatusColor(txn.status)
                    )}>
                      {txn.status}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm font-medium text-[var(--text-primary)] truncate mb-1">
                  {txn.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {txn.timestamp}
                  </span>
                  {txn.from && (
                    <>
                      <span className="text-[var(--text-faint)]">from</span>
                      <span className="font-mono truncate max-w-[120px]">{txn.from}</span>
                    </>
                  )}
                  {txn.to && (
                    <>
                      <span className="text-[var(--text-faint)]">to</span>
                      <span className="font-mono truncate max-w-[120px]">{txn.to}</span>
                    </>
                  )}
                </div>

                {/* Amount */}
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-bold",
                    type.textColor
                  )}>
                    {type.isPositive ? "+" : "-"}${txn.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {type.isPositive ? "+" : "-"}{txn.tokenAmount.toLocaleString()} HPX
                  </span>
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

function getTransactionType(type: string) {
  switch (type) {
    case "deposit":
      return {
        icon: ArrowDownLeft,
        textColor: "text-[var(--green)]",
        bgColor: "bg-[var(--green)]/[0.10]",
        badgeColor: "bg-[var(--green)]/[0.10] text-[var(--green)]",
        isPositive: true,
      }
    case "withdrawal":
      return {
        icon: ArrowUpRight,
        textColor: "text-[var(--red)]",
        bgColor: "bg-[var(--red)]/[0.10]",
        badgeColor: "bg-[var(--red)]/[0.10] text-[var(--red)]",
        isPositive: false,
      }
    case "payout":
      return {
        icon: ArrowUpRight,
        textColor: "text-[var(--purple)]",
        bgColor: "bg-[var(--purple)]/[0.10]",
        badgeColor: "bg-[var(--purple)]/[0.10] text-[var(--purple)]",
        isPositive: false,
      }
    case "reward":
      return {
        icon: TrendingUp,
        textColor: "text-[var(--blue)]",
        bgColor: "bg-[var(--blue)]/[0.10]",
        badgeColor: "bg-[var(--blue)]/[0.10] text-[var(--blue)]",
        isPositive: false,
      }
    case "fee":
      return {
        icon: TrendingUp,
        textColor: "text-[var(--yellow)]",
        bgColor: "bg-[var(--yellow)]/[0.12]",
        badgeColor: "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]",
        isPositive: true,
      }
    default:
      return {
        icon: Wallet,
        textColor: "text-[var(--text-faint)]",
        bgColor: "bg-[var(--surface-2)]",
        badgeColor: "bg-[var(--surface-2)] text-[var(--text-tertiary)]",
        isPositive: false,
      }
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-[var(--yellow)]/[0.12] text-[var(--yellow)]"
    case "confirmed":
      return "bg-[var(--green)]/[0.10] text-[var(--green)]"
    case "failed":
      return "bg-[var(--red)]/[0.12] text-[var(--red)]"
    default:
      return "bg-[var(--surface-2)] text-[var(--text-tertiary)]"
  }
}
