"use client"

import { MOCK_TREASURY } from "@/lib/mock-data"
import { TrendingUp, Coins, ArrowUpRight } from "lucide-react"

export function TreasuryWidget() {
  const t = MOCK_TREASURY
  const isUp = t.change > 0

  return (
    <div className="border-t border-[var(--line)] px-5 py-4 bg-[var(--surface)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Coins size={12} className="text-[var(--green)]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">HPX Treasury</span>
        </div>
        <a href="#" className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--green)] flex items-center gap-0.5 transition-colors">
          View <ArrowUpRight size={9} />
        </a>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xl font-bold text-[var(--foreground)] leading-none">${t.usdValue.toFixed(2)}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{t.balance.toLocaleString()} {t.token}</p>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={11} className={isUp ? "text-[var(--green)]" : "text-[var(--red)]"} />
          <span className={`text-xs font-semibold ${isUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {isUp ? "+" : ""}{t.change}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Open Bounties", value: t.openBounties },
          { label: "Paid Out", value: `$${t.paidOut}` },
          { label: "Next Est.", value: t.nextPayout },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--surface-2)] rounded px-2 py-2 border border-[var(--line)]">
            <p className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-xs font-bold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
