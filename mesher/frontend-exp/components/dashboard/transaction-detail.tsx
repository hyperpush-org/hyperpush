"use client"

import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/mock-data"
import { X, Server, Globe, Cog, Compass, Copy, Check } from "lucide-react"
import { useState, useMemo } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

/* ── Props ── */
interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
}

/* ── Config ── */
const statusConfig: Record<string, { classes: string }> = {
  healthy: { classes: "text-[var(--green)] bg-[var(--green)]/[0.08] ring-[var(--green)]/15" },
  degraded: { classes: "text-[var(--yellow)] bg-[var(--yellow)]/[0.08] ring-[var(--yellow)]/15" },
  critical: { classes: "text-[var(--red)] bg-[var(--red)]/[0.10] ring-[var(--red)]/20" },
}

const operationLabels: Record<string, { icon: React.ElementType; label: string }> = {
  "http.server": { icon: Server, label: "Backend" },
  pageload: { icon: Globe, label: "Pageload" },
  navigation: { icon: Compass, label: "Navigation" },
  task: { icon: Cog, label: "Task" },
}

/* ── Helpers ── */

function MetaItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-[7px]">
      <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      <span className={cn("text-[11px] font-medium tabular-nums", accent || "text-[var(--text-primary)]")}>{value}</span>
    </div>
  )
}

function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-md px-2.5 py-2 text-[10px] font-mono" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[var(--text-tertiary)] mb-1 text-[9px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5 py-0.5">
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.dataKey}</span>
          <span className="ml-auto font-semibold" style={{ color: p.color }}>{Math.round(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function useTxnSeries(t: Transaction) {
  return useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const jitter = Math.random() * 0.3 - 0.15
      return {
        time: `${(19 - i) * 3}m`,
        p50: Math.floor(t.p50 * (1 + jitter)),
        p95: Math.floor(t.p95 * (1 + jitter)),
      }
    })
  }, [t.p50, t.p95])
}

function useSpanBreakdown(t: Transaction) {
  return useMemo(() => {
    if (t.operation === "http.server") {
      const dbPct = 35 + Math.random() * 15
      const httpPct = 10 + Math.random() * 10
      const serializePct = 5 + Math.random() * 5
      return [
        { label: "db.query", pct: dbPct, color: "var(--blue)" },
        { label: "http.client", pct: httpPct, color: "var(--yellow)" },
        { label: "serialize", pct: serializePct, color: "var(--purple)" },
        { label: "app", pct: 100 - dbPct - httpPct - serializePct, color: "var(--green)" },
      ]
    }
    if (t.operation === "pageload") {
      return [
        { label: "resource", pct: 28, color: "var(--blue)" },
        { label: "paint", pct: 22, color: "var(--green)" },
        { label: "script", pct: 35, color: "var(--yellow)" },
        { label: "layout", pct: 15, color: "var(--purple)" },
      ]
    }
    return [
      { label: "compute", pct: 60, color: "var(--blue)" },
      { label: "network", pct: 25, color: "var(--yellow)" },
      { label: "other", pct: 15, color: "var(--text-faint)" },
    ]
  }, [t.operation])
}

/* ── Main ── */
export function TransactionDetail({ transaction: t, onClose }: TransactionDetailProps) {
  const [tab, setTab] = useState<"overview" | "spans" | "tags">("overview")
  const [copied, setCopied] = useState(false)
  const series = useTxnSeries(t)
  const spans = useSpanBreakdown(t)
  const st = statusConfig[t.status] ?? statusConfig.healthy
  const op = operationLabels[t.operation] ?? { icon: Cog, label: t.operation }
  const OpIcon = op.icon

  function copyName() {
    navigator.clipboard.writeText(t.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const apdexColor = t.apdex >= 0.9 ? "var(--green)" : t.apdex >= 0.75 ? "var(--yellow)" : "var(--red)"
  const failColor = t.failureRate > 3 ? "var(--red)" : t.failureRate > 1 ? "var(--yellow)" : "var(--text-primary)"
  const maxP = Math.max(t.p50, t.p75, t.p95, t.p99)

  return (
    <aside className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--line)] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 px-4 h-[var(--header-height)] border-b border-[var(--line)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={copyName}
            title="Copy transaction name"
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            {copied ? <Check size={11} className="text-[var(--green)]" /> : <Copy size={11} />}
          </button>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset capitalize shrink-0",
            st.classes
          )}>
            {t.status}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded text-[10px] font-medium leading-none bg-[var(--surface-3)] text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--line)] shrink-0">
            <OpIcon size={9} />
            {op.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 -mr-1 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-[0.92] shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Title + inline key metrics */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--line)]">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.4] break-words tracking-[-0.01em] font-mono">
            {t.name}
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 mb-3">{t.project} · {t.samples.toLocaleString()} samples</p>

          {/* Inline metrics — not cards, just values in a row */}
          <div className="flex items-baseline gap-5">
            <InlineStat label="P95" value={`${t.p95.toLocaleString()}`} unit="ms" color={t.p95 > 1000 ? "var(--red)" : t.p95 > 500 ? "var(--yellow)" : "var(--text-primary)"} />
            <InlineStat label="Apdex" value={t.apdex.toFixed(2)} color={apdexColor} />
            <InlineStat label="TPM" value={`${t.tpm}`} color="var(--green)" />
            <InlineStat label="Fail" value={`${t.failureRate}%`} color={failColor} />
          </div>
        </div>

        {/* Latency sparkline — borderless, flows naturally */}
        <div className="px-4 pt-3 pb-2 border-b border-[var(--line)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Latency</span>
            <div className="flex items-center gap-3">
              {[
                { key: "p50", color: "var(--green)" },
                { key: "p95", color: "var(--yellow)" },
              ].map(({ key, color }) => (
                <span key={key} className="flex items-center gap-1 text-[9px] text-[var(--text-secondary)] uppercase">
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                  {key}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 56 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="detailP50" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--green)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="detailP95" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--yellow)" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="var(--yellow)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} height={0} />
                <YAxis width={0} tick={false} axisLine={false} tickLine={false} />
                <Tooltip content={<MiniTooltip />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="p50" stroke="var(--green)" strokeWidth={1.5} fill="url(#detailP50)" dot={false} />
                <Area type="monotone" dataKey="p95" stroke="var(--yellow)" strokeWidth={1} fill="url(#detailP95)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Percentile bars — tight, integrated with the chart section */}
          <div className="mt-2 space-y-[3px]">
            {([
              { label: "p50", value: t.p50 },
              { label: "p75", value: t.p75 },
              { label: "p95", value: t.p95 },
              { label: "p99", value: t.p99 },
            ] as const).map(({ label, value }) => {
              const pct = Math.min(100, (value / maxP) * 100)
              const color = value < 200 ? "var(--green)" : value < 500 ? "var(--blue)" : value < 1000 ? "var(--yellow)" : "var(--red)"
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[var(--text-faint)] w-6 shrink-0 uppercase">{label}</span>
                  <div className="flex-1 h-[3px] rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.6 }} />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums w-12 text-right" style={{ color }}>
                    {value.toLocaleString()}<span className="text-[8px] text-[var(--text-faint)] font-normal">ms</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Span breakdown — minimal, just the bar + legend */}
        <div className="px-4 pt-3 pb-3 border-b border-[var(--line)]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2 block">Breakdown</span>
          <div className="h-2 rounded-full overflow-hidden flex mb-2">
            {spans.map((s) => (
              <div
                key={s.label}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${s.pct}%`, backgroundColor: s.color, opacity: 0.6 }}
                title={`${s.label}: ${s.pct.toFixed(0)}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {spans.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color, opacity: 0.7 }} />
                {s.label}
                <span className="text-[var(--text-faint)] tabular-nums">{s.pct.toFixed(0)}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[var(--line)] px-4 sticky top-0 bg-[var(--surface)] z-10">
          {(["overview", "spans", "tags"] as const).map((tb) => {
            const label = tb === "overview" ? "Overview" : tb === "spans" ? "Spans" : "Tags"
            const active = tab === tb
            return (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={cn(
                  "px-0 mr-5 py-2.5 text-[11px] font-medium border-b-[1.5px] transition-colors duration-150",
                  active
                    ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-3 pb-8">
          {tab === "overview" && <OverviewTab transaction={t} />}
          {tab === "spans" && <SpansTab transaction={t} />}
          {tab === "tags" && <TagsTab transaction={t} />}
        </div>
      </div>
    </aside>
  )
}

/* ── Inline stat — just label + value, no box ── */
function InlineStat({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)] mb-0.5">{label}</p>
      <p className="text-[16px] font-bold leading-none tabular-nums" style={{ color }}>
        {value}
        {unit && <span className="text-[9px] text-[var(--text-faint)] font-medium ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}

/* ── Tab content ── */

function OverviewTab({ transaction: t }: { transaction: Transaction }) {
  const trendColor = t.trend > 0 ? "text-[var(--red)]" : t.trend < 0 ? "text-[var(--green)]" : "text-[var(--text-primary)]"
  return (
    <div className="divide-y divide-[var(--line)]/50">
      <MetaItem label="Operation" value={t.operation} />
      <MetaItem label="Project" value={t.project} />
      <MetaItem label="Throughput" value={`${t.tpm} tpm`} />
      <MetaItem label="Failure Rate" value={`${t.failureRate}%`} accent={t.failureRate > 3 ? "text-[var(--red)]" : undefined} />
      <MetaItem label="Apdex" value={t.apdex.toFixed(2)} accent={t.apdex < 0.75 ? "text-[var(--red)]" : t.apdex < 0.9 ? "text-[var(--yellow)]" : "text-[var(--green)]"} />
      <MetaItem label="Trend vs prev." value={`${t.trend > 0 ? "+" : ""}${t.trend}%`} accent={trendColor} />
      <MetaItem label="Users affected" value={t.users > 0 ? t.users.toLocaleString() : "—"} />
      <MetaItem label="Total samples" value={t.samples.toLocaleString()} />
    </div>
  )
}

function SpansTab({ transaction: t }: { transaction: Transaction }) {
  const mockSpans = t.operation === "http.server" ? [
    { op: "db.query", desc: "SELECT * FROM events WHERE project_id = $1", duration: Math.floor(t.p50 * 0.35), status: "ok" },
    { op: "db.query", desc: "SELECT COUNT(*) FROM issues WHERE ...", duration: Math.floor(t.p50 * 0.18), status: "ok" },
    { op: "http.client", desc: "POST https://hooks.slack.com/services/...", duration: Math.floor(t.p50 * 0.12), status: "ok" },
    { op: "serialize", desc: "JSON.stringify response", duration: Math.floor(t.p50 * 0.05), status: "ok" },
  ] : t.operation === "pageload" ? [
    { op: "resource.script", desc: "/static/js/main.chunk.js", duration: Math.floor(t.p50 * 0.2), status: "ok" },
    { op: "resource.css", desc: "/static/css/app.css", duration: Math.floor(t.p50 * 0.08), status: "ok" },
    { op: "paint", desc: "LCP: FeedList", duration: Math.floor(t.p50 * 0.22), status: "ok" },
    { op: "measure", desc: "TTI", duration: Math.floor(t.p50 * 0.35), status: "ok" },
  ] : [
    { op: "compute", desc: "Transaction signing", duration: Math.floor(t.p50 * 0.4), status: "ok" },
    { op: "network", desc: "RPC sendTransaction", duration: Math.floor(t.p50 * 0.45), status: t.failureRate > 3 ? "error" : "ok" },
  ]

  return (
    <div className="space-y-1.5">
      {mockSpans.map((span, i) => (
        <div key={i} className={cn(
          "rounded-md border text-[11px] font-mono overflow-hidden",
          span.status === "error"
            ? "border-[var(--red)]/20 bg-[var(--red)]/[0.04]"
            : "border-[var(--line)] bg-[var(--surface-2)]"
        )}>
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-[1px] rounded bg-[var(--surface-3)] text-[var(--text-tertiary)] shrink-0">{span.op}</span>
              <span className="text-[var(--text-secondary)] truncate">{span.desc}</span>
            </div>
            <span className={cn(
              "text-[10px] font-semibold tabular-nums shrink-0 ml-2",
              span.status === "error" ? "text-[var(--red)]" : "text-[var(--text-primary)]"
            )}>
              {span.duration}ms
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function TagsTab({ transaction: t }: { transaction: Transaction }) {
  const tags = [
    { key: "transaction", value: t.name },
    { key: "op", value: t.operation },
    { key: "project", value: t.project },
    { key: "environment", value: "production" },
    { key: "release", value: "v2.3.1" },
    { key: "browser", value: "Chrome 120" },
    { key: "os", value: "macOS 14.3" },
    { key: "runtime", value: "node 20.11.0" },
  ]

  return (
    <div className="space-y-2.5">
      {tags.map(({ key, value }) => (
        <div key={key} className="flex items-start gap-3">
          <span className="text-[10px] text-[var(--text-faint)] w-20 flex-shrink-0 font-mono mt-[3px]">{key}</span>
          <span className="text-[10px] text-[var(--text-primary)] bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--line)] px-2 py-[2px] rounded font-mono break-all">{value}</span>
        </div>
      ))}
    </div>
  )
}
