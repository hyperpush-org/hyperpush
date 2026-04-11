"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, Activity, DollarSign, Calendar } from "lucide-react"

interface PriceHistoryPoint {
  time: string
  price: number
}

interface VolumeHistoryPoint {
  time: string
  volume: number
  deposits: number
  withdrawals: number
}

interface TreasuryPriceChartProps {
  priceHistory: PriceHistoryPoint[]
  volumeHistory: VolumeHistoryPoint[]
  compact?: boolean
}

export function TreasuryPriceChart({ priceHistory, volumeHistory, compact = false }: TreasuryPriceChartProps) {
  const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0
  const previousPrice = priceHistory[priceHistory.length - 2]?.price || currentPrice
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100
  const isPriceUp = priceChange >= 0

  const currentVolume = volumeHistory[volumeHistory.length - 1]?.volume || 0

  // Generate SVG path for price line
  const maxPrice = Math.max(...priceHistory.map(p => p.price))
  const minPrice = Math.min(...priceHistory.map(p => p.price))
  const priceRange = maxPrice - minPrice || 1

  const generatePricePath = () => {
    const step = 100 / (priceHistory.length - 1)
    return priceHistory.map((p, i) => {
      const x = i * step
      const y = 100 - ((p.price - minPrice) / priceRange) * 80
      return `${x},${y}`
    }).join(" ")
  }

  // Generate SVG path for volume bars
  const maxVolume = Math.max(...volumeHistory.map(v => v.volume))
  const generateVolumeBars = () => {
    const barWidth = 100 / volumeHistory.length - 0.5
    return volumeHistory.map((v, i) => {
      const x = i * (100 / volumeHistory.length)
      const height = (v.volume / maxVolume) * 100
      const color = v.deposits > v.withdrawals ? "var(--green)" : "var(--red)"
      return `<rect x="${x}%" y="${100 - height}%" width="${barWidth}%" height="${height}%" fill="${color}" opacity="0.3" />`
    }).join("")
  }

  return (
    <div className="border-r border-[var(--line)] p-4 lg:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-[var(--green)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">HPX Token</h3>
        </div>
        {!compact && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
            <Calendar size={10} />
            <span>Last 60m</span>
          </div>
        )}
      </div>

      {/* Price display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            ${currentPrice.toFixed(4)}
          </span>
          <span className={cn(
            "text-xs font-medium",
            isPriceUp ? "text-[var(--green)]" : "text-[var(--red)]"
          )}>
            {isPriceUp ? "+" : ""}{priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Activity size={10} className="text-[var(--text-faint)]" />
          <span className="text-xs text-[var(--text-tertiary)]">
            24h Volume: ${(currentVolume / 1000).toFixed(0)}K
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32 lg:h-40">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Volume bars */}
          <g dangerouslySetInnerHTML={{ __html: generateVolumeBars() }} />

          {/* Price line */}
          <path
            d={`M ${generatePricePath()}`}
            fill="none"
            stroke="var(--green)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Area under the line */}
          <path
            d={`M ${generatePricePath()} L 100,100 L 0,100 Z`}
            fill="var(--green)"
            opacity="0.1"
          />

          {/* Current price indicator */}
          <circle cx="100" cy={100 - ((currentPrice - minPrice) / priceRange) * 80} r="1.5" fill="var(--green)" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--text-faint)]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-[var(--green)]" />
          <span>Net Inflow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-[var(--red)]" />
          <span>Net Outflow</span>
        </div>
      </div>
    </div>
  )
}
