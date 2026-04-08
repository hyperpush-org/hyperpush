"use client"

import { MOCK_EVENT_SERIES } from "@/lib/mock-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-[11px] font-mono" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[var(--text-tertiary)] mb-1.5 text-[10px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--text-secondary)] capitalize">{p.dataKey}</span>
          <span className="ml-auto font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function EventsChart() {
  return (
    <div className="px-6 pt-4 pb-4 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Event Volume</span>
          <div className="flex items-center gap-4">
            {[
              { key: "critical", color: "var(--red)" },
              { key: "high", color: "var(--yellow)" },
              { key: "medium", color: "var(--blue)" },
              { key: "low", color: "var(--text-faint)" },
            ].map(({ key, color }) => (
              <span key={key} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] capitalize">
                <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color }} />
                {key}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 88 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_EVENT_SERIES} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradCrit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--red)" stopOpacity={0.20} />
                <stop offset="100%" stopColor="var(--red)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--yellow)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--yellow)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--line)"
              strokeOpacity={0.4}
              horizontal
              vertical={false}
            />
            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} height={0} />
            <YAxis width={32} tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
            <Area type="monotone" dataKey="medium" stroke="var(--blue)" strokeWidth={1} fill="url(#gradMed)" animationDuration={800} animationBegin={200} />
            <Area type="monotone" dataKey="high" stroke="var(--yellow)" strokeWidth={1.5} fill="url(#gradHigh)" animationDuration={800} animationBegin={100} />
            <Area type="monotone" dataKey="critical" stroke="var(--red)" strokeWidth={1.5} fill="url(#gradCrit)" animationDuration={800} animationBegin={0} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
