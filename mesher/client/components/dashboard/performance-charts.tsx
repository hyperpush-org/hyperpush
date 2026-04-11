"use client"

import { MOCK_LATENCY_SERIES, MOCK_THROUGHPUT_SERIES, MOCK_APDEX_SERIES } from "@/lib/mock-data"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

/* ── Shared tooltip ── */
function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-[11px] font-mono" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[var(--text-tertiary)] mb-1.5 text-[10px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--text-secondary)] uppercase text-[9px]">{p.dataKey}</span>
          <span className="ml-auto font-semibold" style={{ color: p.color }}>
            {typeof p.value === "number" ? (p.value < 1 ? p.value.toFixed(2) : Math.round(p.value)) : p.value}
            {suffix && <span className="text-[var(--text-faint)] font-normal ml-0.5">{suffix}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Chart section header ── */
function ChartHeader({ title, legend }: { title: string; legend?: { key: string; color: string }[] }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{title}</span>
      {legend && (
        <div className="flex items-center gap-4">
          {legend.map(({ key, color }) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] uppercase">
              <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color }} />
              {key}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Latency over time ── */
export function LatencyChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`px-6 pt-4 pb-4 ${!compact ? "border-r border-[var(--line)]" : ""}`}>
      <ChartHeader
        title="Latency"
        legend={[
          { key: "P50", color: "var(--green)" },
          { key: "P75", color: "var(--blue)" },
          { key: "P95", color: "var(--yellow)" },
        ]}
      />
      <div style={{ height: compact ? 72 : 88 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_LATENCY_SERIES} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradP50" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradP75" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity={0.10} />
                <stop offset="100%" stopColor="var(--blue)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradP95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--yellow)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--yellow)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.4} horizontal vertical={false} />
            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} height={0} />
            <YAxis width={32} tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip suffix="ms" />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
            <Area type="monotone" dataKey="p50" stroke="var(--green)" strokeWidth={1.5} fill="url(#gradP50)" animationDuration={800} />
            <Area type="monotone" dataKey="p75" stroke="var(--blue)" strokeWidth={1} fill="url(#gradP75)" animationDuration={800} animationBegin={100} />
            <Area type="monotone" dataKey="p95" stroke="var(--yellow)" strokeWidth={1.5} fill="url(#gradP95)" animationDuration={800} animationBegin={200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── Throughput over time ── */
export function ThroughputChart() {
  return (
    <div className="px-6 pt-4 pb-4 border-r border-[var(--line)]">
      <ChartHeader
        title="Throughput"
        legend={[
          { key: "TPM", color: "var(--green)" },
          { key: "Errors", color: "var(--red)" },
        ]}
      />
      <div style={{ height: 88 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_THROUGHPUT_SERIES} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.4} horizontal vertical={false} />
            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} height={0} />
            <YAxis width={32} tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)", opacity: 0.5 }} />
            <Bar dataKey="tpm" fill="var(--green)" fillOpacity={0.6} radius={[1, 1, 0, 0]} animationDuration={800} />
            <Bar dataKey="errors" fill="var(--red)" fillOpacity={0.7} radius={[1, 1, 0, 0]} animationDuration={800} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── Apdex over time ── */
export function ApdexChart() {
  return (
    <div className="px-6 pt-4 pb-4">
      <ChartHeader
        title="Apdex"
        legend={[{ key: "Score", color: "var(--purple)" }]}
      />
      <div style={{ height: 88 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_APDEX_SERIES} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.4} horizontal vertical={false} />
            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} height={0} />
            <YAxis width={32} domain={[0.5, 1]} tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
            <ReferenceLine y={0.75} stroke="var(--yellow)" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={0.9} stroke="var(--green)" strokeDasharray="4 4" strokeOpacity={0.3} />
            <Line type="monotone" dataKey="apdex" stroke="var(--purple)" strokeWidth={1.5} dot={false} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
