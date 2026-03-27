"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CommunityLayout } from "@/components/community/community-layout"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Medal, Flame, ArrowUp, ArrowDown, Minus } from "lucide-react"

type TimePeriod = "all-time" | "monthly" | "weekly"

const leaderboardData = [
  {
    rank: 1,
    name: "ckissi",
    avatar: "CK",
    bugs: 142,
    bountyEarned: "$18,420",
    streak: 23,
    trend: "up" as const,
    trendDelta: 2,
    topProject: "solana-dex",
    level: "Legend",
  },
  {
    rank: 2,
    name: "0xreaper",
    avatar: "0R",
    bugs: 128,
    bountyEarned: "$15,850",
    streak: 17,
    trend: "up" as const,
    trendDelta: 1,
    topProject: "defi-aggregator",
    level: "Legend",
  },
  {
    rank: 3,
    name: "bugslayer.sol",
    avatar: "BS",
    bugs: 115,
    bountyEarned: "$14,200",
    streak: 31,
    trend: "same" as const,
    trendDelta: 0,
    topProject: "nft-marketplace",
    level: "Master",
  },
  {
    rank: 4,
    name: "rustacean_dev",
    avatar: "RD",
    bugs: 98,
    bountyEarned: "$11,340",
    streak: 12,
    trend: "up" as const,
    trendDelta: 3,
    topProject: "trading-platform",
    level: "Master",
  },
  {
    rank: 5,
    name: "meera.tsx",
    avatar: "MT",
    bugs: 87,
    bountyEarned: "$9,720",
    streak: 8,
    trend: "down" as const,
    trendDelta: 1,
    topProject: "solana-dex",
    level: "Expert",
  },
  {
    rank: 6,
    name: "ghostwriter",
    avatar: "GW",
    bugs: 74,
    bountyEarned: "$8,150",
    streak: 5,
    trend: "up" as const,
    trendDelta: 4,
    topProject: "defi-aggregator",
    level: "Expert",
  },
  {
    rank: 7,
    name: "anchor_chad",
    avatar: "AC",
    bugs: 62,
    bountyEarned: "$7,200",
    streak: 14,
    trend: "same" as const,
    trendDelta: 0,
    topProject: "nft-marketplace",
    level: "Expert",
  },
  {
    rank: 8,
    name: "sys_call",
    avatar: "SC",
    bugs: 55,
    bountyEarned: "$6,340",
    streak: 3,
    trend: "down" as const,
    trendDelta: 2,
    topProject: "trading-platform",
    level: "Skilled",
  },
  {
    rank: 9,
    name: "patchwork",
    avatar: "PW",
    bugs: 48,
    bountyEarned: "$5,100",
    streak: 9,
    trend: "up" as const,
    trendDelta: 1,
    topProject: "solana-dex",
    level: "Skilled",
  },
  {
    rank: 10,
    name: "null_ptr",
    avatar: "NP",
    bugs: 41,
    bountyEarned: "$4,520",
    streak: 6,
    trend: "up" as const,
    trendDelta: 2,
    topProject: "defi-aggregator",
    level: "Skilled",
  },
]

const topStats = [
  { label: "Total Bounties Paid", value: "$284,120", icon: Trophy },
  { label: "Active Hunters", value: "1,247", icon: TrendingUp },
  { label: "Bugs Fixed This Month", value: "892", icon: Medal },
]

const levelColors: Record<string, string> = {
  Legend: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  Master: "bg-accent/20 text-accent border-accent/30",
  Expert: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  Skilled: "bg-muted text-muted-foreground border-border",
}

const rankColors: Record<number, string> = {
  1: "text-chart-4",
  2: "text-muted-foreground",
  3: "text-chart-5",
}

function TrendIndicator({ trend, delta }: { trend: "up" | "down" | "same"; delta: number }) {
  if (trend === "up") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-accent">
        <ArrowUp className="w-3 h-3" />
        {delta}
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-destructive">
        <ArrowDown className="w-3 h-3" />
        {delta}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" />
    </span>
  )
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<TimePeriod>("all-time")

  return (
    <CommunityLayout
      title="Leaderboard"
      subtitle="Top contributors ranked by bugs fixed and bounties earned. Fix more, climb higher."
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden mb-10">
        {topStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-card p-6"
          >
            <stat.icon className="w-4 h-4 text-accent mb-3" />
            <p className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Time period tabs */}
      <div className="flex items-center gap-1 mb-8 p-1 bg-muted/50 rounded-lg w-fit">
        {(["all-time", "monthly", "weekly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              period === p
                ? "bg-background text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "all-time" ? "All Time" : p === "monthly" ? "This Month" : "This Week"}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Scrollable wrapper for small viewports */}
        <div className="overflow-x-auto">
        {/* Table header */}
        <div className="grid grid-cols-[3rem_1fr_5rem_6rem_5rem_6rem] sm:grid-cols-[3rem_1fr_5rem_7rem_5rem_7rem_6rem] items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-xs font-mono text-muted-foreground uppercase tracking-wider min-w-[520px]">
          <span>#</span>
          <span>Developer</span>
          <span className="hidden sm:block">Level</span>
          <span className="text-right">Bugs Fixed</span>
          <span className="text-center">Streak</span>
          <span className="text-right">Earned</span>
          <span className="text-center">Trend</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border min-w-[520px]">
          {leaderboardData.map((dev, index) => (
            <motion.div
              key={dev.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="grid grid-cols-[3rem_1fr_5rem_6rem_5rem_6rem] sm:grid-cols-[3rem_1fr_5rem_7rem_5rem_7rem_6rem] items-center gap-4 px-4 py-3.5 hover:bg-muted/20 transition-colors group"
            >
              {/* Rank */}
              <span className={`text-lg font-bold font-mono ${rankColors[dev.rank] || "text-muted-foreground"}`}>
                {dev.rank}
              </span>

              {/* Developer */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground shrink-0">
                  {dev.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate group-hover:text-accent transition-colors">{dev.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{dev.topProject}</p>
                </div>
              </div>

              {/* Level */}
              <div className="hidden sm:block">
                <Badge className={`text-[10px] ${levelColors[dev.level]}`}>
                  {dev.level}
                </Badge>
              </div>

              {/* Bugs Fixed */}
              <p className="text-right font-mono text-sm">{dev.bugs}</p>

              {/* Streak */}
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-chart-5" />
                <span className="text-sm font-mono">{dev.streak}</span>
              </div>

              {/* Earned */}
              <p className="text-right font-semibold text-sm">{dev.bountyEarned}</p>

              {/* Trend */}
              <div className="flex justify-center">
                <TrendIndicator trend={dev.trend} delta={dev.trendDelta} />
              </div>
            </motion.div>
          ))}
        </div>
        </div> {/* end overflow-x-auto */}
      </motion.div>

      {/* Bottom note */}
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Rankings update every hour based on verified bug fixes. Streaks count consecutive days with at least one merged PR.
      </p>
    </CommunityLayout>
  )
}
