"use client"

import { type TreasuryTransaction } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { X, ArrowDownLeft, ArrowUpRight, TrendingUp, Copy, ExternalLink, Wallet, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TreasuryTransactionDetailProps {
  transaction: TreasuryTransaction
  onClose: () => void
}

export function TreasuryTransactionDetail({ transaction, onClose }: TreasuryTransactionDetailProps) {
  const type = getTransactionType(transaction.type)
  const status = getTransactionStatus(transaction.status)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2">
          <div className={cn("w-6 h-6 rounded flex items-center justify-center", type.bgColor)}>
            <type.icon size={12} className={type.textColor} />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{transaction.id}</span>
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
        {/* Amount card */}
        <div className={cn(
          "mx-3 mt-3 p-4 rounded-lg border",
          type.isPositive ? "border-[var(--green)]/[0.3] bg-[var(--green)]/[0.05]" : "border-[var(--red)]/[0.3] bg-[var(--red)]/[0.05]"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {type.isPositive ? "Received" : "Sent"}
            </span>
            <Wallet size={12} className={type.textColor} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold", type.textColor)}>
              {type.isPositive ? "+" : "-"}${transaction.amount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {type.isPositive ? "+" : "-"}{transaction.tokenAmount.toLocaleString()} HPX tokens
          </p>
        </div>

        {/* Transaction info */}
        <div className="px-4 py-3 border-b border-[var(--line)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Details</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Type</span>
              <Badge className={cn("text-[10px] capitalize", type.badgeColor)}>
                {transaction.type}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Status</span>
              <div className="flex items-center gap-1.5">
                <status.icon size={12} className={status.textColor} />
                <span className={cn("text-xs font-medium capitalize", status.textColor)}>
                  {transaction.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Description</span>
              <span className="text-xs text-[var(--text-primary)] text-right max-w-[180px] truncate">
                {transaction.description}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Timestamp</span>
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-[var(--text-faint)]" />
                <span className="text-xs text-[var(--text-primary)]">{transaction.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* From/To */}
        {(transaction.from || transaction.to) && (
          <div className="px-4 py-3 border-b border-[var(--line)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Parties</h3>

            {transaction.from && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)]">From</span>
                  <button
                    onClick={() => copyToClipboard(transaction.from!)}
                    className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Copy size={9} />
                  </button>
                </div>
                <div className="p-2 rounded-md bg-[var(--surface-2)] border border-[var(--line)]">
                  <span className="text-xs font-mono text-[var(--text-primary)] break-all">
                    {transaction.from}
                  </span>
                </div>
              </div>
            )}

            {transaction.to && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)]">To</span>
                  <button
                    onClick={() => copyToClipboard(transaction.to!)}
                    className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Copy size={9} />
                  </button>
                </div>
                <div className="p-2 rounded-md bg-[var(--surface-2)] border border-[var(--line)]">
                  <span className="text-xs font-mono text-[var(--text-primary)] break-all">
                    {transaction.to}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction hash */}
        {transaction.txHash && (
          <div className="px-4 py-3 border-b border-[var(--line)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Transaction</h3>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--text-secondary)]">Hash</span>
              <button
                onClick={() => copyToClipboard(transaction.txHash!)}
                className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <Copy size={9} />
              </button>
            </div>
            <div className="p-2 rounded-md bg-[var(--surface-2)] border border-[var(--line)]">
              <span className="text-xs font-mono text-[var(--text-primary)] break-all">
                {transaction.txHash}
              </span>
            </div>
            <a
              href={`https://explorer.solana.com/tx/${transaction.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--purple)] hover:text-[var(--purple)]/80 transition-colors"
            >
              <ExternalLink size={10} />
              <span>View on Solana Explorer</span>
            </a>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--surface-2)]">
        {transaction.status === "pending" && (
          <Button size="sm" variant="outline" className="w-full gap-2">
            <Clock size={12} />
            <span>Awaiting Confirmation</span>
          </Button>
        )}
        {transaction.status === "confirmed" && transaction.txHash && (
          <div className="text-center">
            <CheckCircle2 size={16} className="mx-auto text-[var(--green)] mb-1" />
            <p className="text-xs text-[var(--text-secondary)]">Transaction confirmed</p>
          </div>
        )}
        {transaction.status === "failed" && (
          <div className="text-center">
            <AlertCircle size={16} className="mx-auto text-[var(--red)] mb-1" />
            <p className="text-xs text-[var(--text-secondary)]">Transaction failed</p>
          </div>
        )}
      </div>
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

function getTransactionStatus(status: string) {
  switch (status) {
    case "pending":
      return {
        icon: Clock,
        textColor: "text-[var(--yellow)]",
      }
    case "confirmed":
      return {
        icon: CheckCircle2,
        textColor: "text-[var(--green)]",
      }
    case "failed":
      return {
        icon: AlertCircle,
        textColor: "text-[var(--red)]",
      }
    default:
      return {
        icon: Clock,
        textColor: "text-[var(--text-faint)]",
      }
  }
}
