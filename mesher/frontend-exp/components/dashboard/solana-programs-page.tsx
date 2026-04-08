"use client"

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  MOCK_PROGRAM,
  MOCK_PROGRAM_STATS,
  MOCK_INSTRUCTIONS,
  MOCK_CU_SERIES,
  MOCK_INSTRUCTION_VOLUME_SERIES,
  MOCK_LOG_EVENTS,
  MOCK_ACCOUNT_WATCHERS,
  MOCK_PROGRAM_ERRORS,
  MOCK_DEPLOY_HISTORY,
  type ParsedLogEvent,
  type InstructionType,
} from "@/lib/solana-mock-data"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import {
  Cpu,
  Radio,
  Eye,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  ChevronRight,
  Copy,
  ExternalLink,
  Shield,
  Database,
  Zap,
  Hash,
  Users,
  Layers,
  Clock,
  RotateCw,
  Terminal,
  Box,
  Minus,
} from "lucide-react"

/* ═══════════════════════════════════════════════════
   Shared tooltip for recharts
   ═══════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-[11px] font-mono" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[var(--text-tertiary)] mb-1.5 text-[10px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--text-secondary)] text-[9px] uppercase">{p.dataKey === "avgCU" ? "Avg" : p.dataKey === "p95CU" ? "P95" : p.dataKey === "maxCU" ? "Max" : p.dataKey}</span>
          <span className="ml-auto font-semibold" style={{ color: p.color }}>
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            {suffix && <span className="text-[var(--text-faint)] font-normal ml-0.5">{suffix}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Program identity strip — the "who" at the top
   ═══════════════════════════════════════════════════ */
function ProgramStrip() {
  const p = MOCK_PROGRAM
  const s = MOCK_PROGRAM_STATS
  const healthColor: Record<string, string> = {
    nominal: "var(--green)",
    "elevated-failures": "var(--yellow)",
    degraded: "var(--red)",
    halted: "var(--red)",
  }
  const hc = healthColor[p.health]

  return (
    <div className="border-b border-[var(--line)] bg-[var(--surface)] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Program identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--line)] flex items-center justify-center">
              <Box size={14} className="text-[var(--purple)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{p.label}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset uppercase tracking-[0.04em]"
                  style={{ color: hc, backgroundColor: `color-mix(in srgb, ${hc} 12%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${hc} 20%, transparent)` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hc }} />
                  {p.health}
                </span>
                {p.upgradeStatus === "live" && (
                  <span className="text-[9px] font-medium text-[var(--text-faint)] bg-[var(--surface-2)] px-1.5 py-[2px] rounded ring-1 ring-inset ring-[var(--line)]">
                    <Shield size={8} className="inline -mt-px mr-0.5" />immutable-ready
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{p.programId}</span>
                <button className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"><Copy size={9} /></button>
                <button className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"><ExternalLink size={9} /></button>
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-[var(--line)] mx-2" />

          {/* Indexer status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Radio size={10} className={s.indexLag <= 10 ? "text-[var(--green)]" : "text-[var(--yellow)]"} />
              <span className="text-[10px] text-[var(--text-secondary)]">
                Slot <span className="font-mono text-[var(--text-primary)]">{s.lastIndexedSlot.toLocaleString()}</span>
              </span>
              <span className={cn(
                "text-[9px] font-mono px-1 py-[1px] rounded",
                s.indexLag <= 10
                  ? "text-[var(--green)] bg-[var(--green)]/[0.08]"
                  : "text-[var(--yellow)] bg-[var(--yellow)]/[0.08]"
              )}>
                {s.indexLag === 0 ? "synced" : `-${s.indexLag} slots`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: quick metrics */}
        <div className="flex items-center gap-6">
          <QuickStat label="24h Ixns" value={s.totalInstructions24h.toLocaleString()} />
          <QuickStat label="Success" value={`${s.successRate}%`} color={s.successRate >= 97 ? "var(--green)" : s.successRate >= 94 ? "var(--yellow)" : "var(--red)"} />
          <QuickStat label="Avg CU" value={s.avgComputeUnits.toLocaleString()} />
          <QuickStat label="Signers" value={s.uniqueSigners24h.toLocaleString()} />
        </div>
      </div>
    </div>
  )
}

function QuickStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-0.5">{label}</p>
      <p className="text-[14px] font-bold tabular-nums leading-none tracking-tight" style={{ color: color || "var(--text-primary)" }}>{value}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Compute Unit chart (slot-bucketed)
   ═══════════════════════════════════════════════════ */
function ComputeUnitChart() {
  return (
    <div className="px-5 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu size={11} className="text-[var(--text-tertiary)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Compute Units</span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { key: "Avg", color: "var(--green)" },
            { key: "P95", color: "var(--yellow)" },
            { key: "Max", color: "var(--red)" },
          ].map(({ key, color }) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
              <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color }} />
              {key}
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_CU_SERIES} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradAvgCU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradP95CU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--yellow)" stopOpacity={0.10} />
                <stop offset="100%" stopColor="var(--yellow)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.4} horizontal vertical={false} />
            <XAxis dataKey="slotLabel" tick={false} axisLine={false} tickLine={false} height={0} />
            <YAxis width={40} tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTooltip suffix="CU" />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
            <ReferenceLine y={200000} stroke="var(--red)" strokeDasharray="4 4" strokeOpacity={0.3} label={{ value: "Budget", position: "right", fontSize: 9, fill: "var(--text-faint)" }} />
            <Area type="monotone" dataKey="avgCU" stroke="var(--green)" strokeWidth={1.5} fill="url(#gradAvgCU)" animationDuration={800} />
            <Area type="monotone" dataKey="p95CU" stroke="var(--yellow)" strokeWidth={1} fill="url(#gradP95CU)" animationDuration={800} animationBegin={100} />
            <Area type="monotone" dataKey="maxCU" stroke="var(--red)" strokeWidth={1} fill="transparent" strokeDasharray="2 2" animationDuration={800} animationBegin={200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Instruction volume chart
   ═══════════════════════════════════════════════════ */
function InstructionVolumeChart() {
  return (
    <div className="px-5 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={11} className="text-[var(--text-tertiary)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Instruction Volume</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
            <span className="w-[6px] h-[6px] rounded-full bg-[var(--green)]" />Success
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
            <span className="w-[6px] h-[6px] rounded-full bg-[var(--red)]" />Failed
          </span>
        </div>
      </div>
      <div style={{ height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_INSTRUCTION_VOLUME_SERIES} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.4} horizontal vertical={false} />
            <XAxis dataKey="slotLabel" tick={false} axisLine={false} tickLine={false} height={0} />
            <YAxis width={32} tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)", opacity: 0.5 }} />
            <Bar dataKey="success" stackId="a" fill="var(--green)" fillOpacity={0.5} radius={[0, 0, 0, 0]} animationDuration={800} />
            <Bar dataKey="failed" stackId="a" fill="var(--red)" fillOpacity={0.7} radius={[1, 1, 0, 0]} animationDuration={800} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Instruction breakdown table
   ═══════════════════════════════════════════════════ */
function InstructionTable({ onSelect }: { onSelect: (ix: InstructionType) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-3 pb-1">
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={11} className="text-[var(--text-tertiary)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Instructions</span>
          <span className="text-[10px] text-[var(--text-faint)]">· {MOCK_INSTRUCTIONS.length} types</span>
        </div>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_64px_80px_64px_56px] gap-2 px-5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)] border-b border-[var(--line-subtle)]">
        <span>Instruction</span>
        <span className="text-right">Count</span>
        <span className="text-right">Success</span>
        <span className="text-right">Avg CU</span>
        <span className="text-right">P95 CU</span>
        <span className="text-right">Trend</span>
      </div>
      <div className="divide-y divide-[var(--line-subtle)]">
        {MOCK_INSTRUCTIONS.map((ix) => (
          <button
            key={ix.name}
            onClick={() => onSelect(ix)}
            className="w-full grid grid-cols-[1fr_80px_64px_80px_64px_56px] gap-2 px-5 py-2.5 text-left hover:bg-[var(--surface-2)] transition-colors group active:scale-[0.998]"
          >
            <div className="min-w-0">
              <span className="text-[12px] font-mono font-medium text-[var(--text-primary)] group-hover:text-[var(--green)] transition-colors">{ix.name}</span>
              <span className="block text-[9px] font-mono text-[var(--text-faint)] mt-0.5">{ix.discriminator}</span>
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-[var(--text-primary)] text-right self-center">{ix.count24h.toLocaleString()}</span>
            <span className={cn(
              "text-[11px] font-semibold tabular-nums text-right self-center",
              ix.successRate >= 98 ? "text-[var(--green)]" : ix.successRate >= 95 ? "text-[var(--yellow)]" : "text-[var(--red)]"
            )}>{ix.successRate}%</span>
            <span className="text-[11px] tabular-nums text-[var(--text-secondary)] text-right self-center">{ix.avgCU.toLocaleString()}</span>
            <span className="text-[11px] tabular-nums text-[var(--text-secondary)] text-right self-center">{ix.p95CU.toLocaleString()}</span>
            <span className={cn(
              "text-[10px] font-medium tabular-nums text-right self-center flex items-center justify-end gap-0.5",
              ix.trend > 10 ? "text-[var(--red)]" : ix.trend < -5 ? "text-[var(--green)]" : "text-[var(--text-faint)]"
            )}>
              {ix.trend > 0 ? <ArrowUpRight size={9} /> : ix.trend < 0 ? <ArrowDownRight size={9} /> : <Minus size={9} />}
              {Math.abs(ix.trend)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Log event feed (parsed program logs)
   ═══════════════════════════════════════════════════ */
function LogEventFeed({ events, onSelect }: { events: ParsedLogEvent[]; onSelect: (e: ParsedLogEvent) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={11} className="text-[var(--green)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Parsed Logs</span>
          <span className="text-[10px] text-[var(--text-faint)]">· live</span>
        </div>
        <span className="text-[9px] text-[var(--text-faint)] tabular-nums">{MOCK_PROGRAM_STATS.logEventsIngested.toLocaleString()} ingested</span>
      </div>
      <div className="space-y-px px-3 py-2">
        {events.map((ev) => (
          <button
            key={ev.id}
            onClick={() => onSelect(ev)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--surface-2)] transition-colors group text-left active:scale-[0.998]"
          >
            {/* Status dot */}
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              ev.status === "success" ? "bg-[var(--green)]" : "bg-[var(--red)]"
            )} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-[var(--text-primary)]">{ev.instruction}</span>
                {ev.errorCode && (
                  <span className="text-[9px] font-mono text-[var(--red)] bg-[var(--red)]/[0.08] px-1 py-[1px] rounded ring-1 ring-inset ring-[var(--red)]/15">{ev.errorCode}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono text-[var(--text-faint)]">{ev.signature}</span>
                <span className="text-[9px] text-[var(--text-faint)]">·</span>
                <span className="text-[9px] text-[var(--text-faint)]">{ev.signerKey}</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] tabular-nums text-[var(--text-tertiary)]">{ev.computeUnits.toLocaleString()} CU</span>
              <span className="text-[10px] text-[var(--text-faint)]">{ev.timestamp}</span>
              <ChevronRight size={12} className="text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Log detail panel (slide-in)
   ═══════════════════════════════════════════════════ */
function LogDetailPanel({ event, onClose }: { event: ParsedLogEvent; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            event.status === "success" ? "bg-[var(--green)]" : "bg-[var(--red)]"
          )} />
          <span className="text-[13px] font-mono font-semibold text-[var(--text-primary)]">{event.instruction}</span>
        </div>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.93]">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-px bg-[var(--line-subtle)] border-b border-[var(--line)]">
          <MetaCell label="Signature" value={event.signature} mono />
          <MetaCell label="Slot" value={event.slot.toLocaleString()} />
          <MetaCell label="Signer" value={event.signerKey} mono />
          <MetaCell label="Compute Units" value={`${event.computeUnits.toLocaleString()} / 200,000`} />
          <MetaCell label="Status" value={event.status} status={event.status} />
          <MetaCell label="Time" value={event.timestamp} />
        </div>

        {/* Error section */}
        {event.errorMessage && (
          <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--red)]/[0.03]">
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[var(--red)]/20 to-transparent" />
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={11} className="text-[var(--red)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--red)]">Error</span>
              <span className="text-[10px] font-mono text-[var(--red)]/70">{event.errorCode}</span>
            </div>
            <p className="text-[12px] font-mono text-[var(--text-primary)] leading-relaxed">{event.errorMessage}</p>
          </div>
        )}

        {/* Accounts involved */}
        <div className="px-5 py-3 border-b border-[var(--line)]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] block mb-2">Accounts ({event.accounts.length})</span>
          <div className="space-y-1">
            {event.accounts.map((acc, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--text-faint)] w-3 tabular-nums">{i}</span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">{acc}</span>
                <button className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors ml-auto"><Copy size={9} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Raw program logs */}
        <div className="px-5 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] block mb-2">Program Logs</span>
          <div className="bg-[var(--background)] rounded-md ring-1 ring-inset ring-[var(--line)] p-3 overflow-x-auto">
            {event.logLines.map((line, i) => {
              const isError = line.toLowerCase().includes("error") || line.includes("failed")
              const isSuccess = line.includes("success")
              const isConsumed = line.includes("consumed")
              return (
                <div key={i} className="flex gap-2">
                  <span className="text-[9px] text-[var(--text-faint)] tabular-nums w-3 shrink-0 select-none">{i + 1}</span>
                  <span className={cn(
                    "text-[10.5px] font-mono leading-[1.7] break-all",
                    isError ? "text-[var(--red)]" : isSuccess ? "text-[var(--green)]" : isConsumed ? "text-[var(--yellow)]" : "text-[var(--text-secondary)]"
                  )}>{line}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaCell({ label, value, mono, status }: { label: string; value: string; mono?: boolean; status?: string }) {
  const isSuccess = status === "success"
  const isFailed = status === "failed"
  return (
    <div className="bg-[var(--surface)] px-5 py-2.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)] block mb-0.5">{label}</span>
      <span className={cn(
        "text-[12px] leading-none",
        mono ? "font-mono text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium",
        isSuccess && "text-[var(--green)]",
        isFailed && "text-[var(--red)]",
      )}>{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Right sidebar — Account watchers + Errors + Deploys
   ═══════════════════════════════════════════════════ */
function RightSidebar() {
  return (
    <div className="w-[300px] shrink-0 border-l border-[var(--line)] bg-[var(--surface)] overflow-y-auto flex flex-col">
      {/* Account watchers */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Eye size={11} className="text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Account Watchers</span>
          </div>
          <span className="text-[9px] text-[var(--text-faint)]">{MOCK_ACCOUNT_WATCHERS.filter(w => w.status === "watching").length} active</span>
        </div>
        <div className="space-y-1.5">
          {MOCK_ACCOUNT_WATCHERS.map((w) => (
            <div key={w.id} className="rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--line)] px-3 py-2 hover:ring-[var(--text-faint)]/20 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    w.status === "watching" ? "bg-[var(--green)]" : w.status === "stale" ? "bg-[var(--yellow)]" : "bg-[var(--text-faint)]"
                  )} />
                  <span className="text-[11px] font-medium text-[var(--text-primary)]">{w.label}</span>
                </div>
                <span className="text-[9px] font-mono text-[var(--text-faint)]">{w.address}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[var(--text-faint)]">{w.dataSize}B</span>
                  <span className="text-[9px] text-[var(--text-faint)]">·</span>
                  <span className="text-[9px] text-[var(--text-faint)]">{(w.lamports / 1e9).toFixed(2)} SOL</span>
                </div>
                <span className="text-[9px] tabular-nums text-[var(--text-secondary)]">{w.changesDetected24h.toLocaleString()} Δ</span>
              </div>
              {/* Watch fields */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {w.watchFields.map((f) => (
                  <span key={f} className="text-[8px] font-mono text-[var(--text-faint)] bg-[var(--surface)] px-1 py-[1px] rounded ring-1 ring-inset ring-[var(--line)]">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error breakdown */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle size={11} className="text-[var(--red)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Error Codes</span>
        </div>
        <div className="space-y-1">
          {MOCK_PROGRAM_ERRORS.map((err) => (
            <div key={err.code} className="flex items-center gap-2 py-1.5 group cursor-pointer hover:bg-[var(--surface-2)] -mx-1 px-1 rounded transition-colors">
              <span className="text-[10px] font-mono text-[var(--red)] bg-[var(--red)]/[0.08] px-1.5 py-[2px] rounded ring-1 ring-inset ring-[var(--red)]/15 shrink-0">{err.hexCode}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-[var(--text-primary)] block truncate">{err.name}</span>
                <span className="text-[8px] text-[var(--text-faint)] font-mono">{err.affectedInstruction}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">{err.count24h}</span>
                <span className={cn(
                  "text-[8px] font-medium tabular-nums flex items-center justify-end gap-0.5 mt-0.5",
                  err.trend > 10 ? "text-[var(--red)]" : err.trend < -5 ? "text-[var(--green)]" : "text-[var(--text-faint)]"
                )}>
                  {err.trend > 0 ? "+" : ""}{err.trend}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy history */}
      <div className="px-4 pt-4 pb-3 flex-1">
        <div className="flex items-center gap-1.5 mb-3">
          <RotateCw size={11} className="text-[var(--text-tertiary)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Deploy History</span>
        </div>
        <div className="space-y-0">
          {MOCK_DEPLOY_HISTORY.map((d, i) => (
            <div key={d.slot} className="relative pl-5 pb-4 group">
              {/* Timeline line */}
              {i < MOCK_DEPLOY_HISTORY.length - 1 && (
                <div className="absolute left-[7px] top-3 bottom-0 w-px bg-[var(--line)]" />
              )}
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-0 top-[3px] w-[15px] h-[15px] rounded-full flex items-center justify-center ring-2 ring-[var(--surface)]",
                d.type === "deploy" ? "bg-[var(--purple)]" : d.type === "upgrade" ? "bg-[var(--blue)]" : "bg-[var(--yellow)]"
              )}>
                {d.type === "deploy" ? <Zap size={8} className="text-white" /> : d.type === "upgrade" ? <ArrowUpRight size={8} className="text-white" /> : <Shield size={8} className="text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[var(--text-primary)] capitalize">{d.type}</span>
                  <span className="text-[9px] text-[var(--text-faint)]">{d.timestamp}</span>
                </div>
                {d.note && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{d.note}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-mono text-[var(--text-faint)]">slot {d.slot.toLocaleString()}</span>
                  <span className="text-[8px] text-[var(--text-faint)]">·</span>
                  <span className="text-[8px] font-mono text-[var(--text-faint)]">{(d.executableSize / 1024).toFixed(0)}KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Main page composition
   ═══════════════════════════════════════════════════ */
export function SolanaProgramsPage() {
  const [selectedLog, setSelectedLog] = useState<ParsedLogEvent | null>(null)
  const [selectedInstruction, setSelectedInstruction] = useState<InstructionType | null>(null)
  const [animating, setAnimating] = useState(false)
  const [activeTab, setActiveTab] = useState<"logs" | "instructions">("logs")
  const panelRef = useRef<HTMLDivElement>(null)

  const closePanel = useCallback(() => {
    if (!selectedLog) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedLog(null)
      setAnimating(false)
    }, 150)
  }, [selectedLog])

  const openLog = useCallback((ev: ParsedLogEvent) => {
    if (selectedLog?.id === ev.id) {
      closePanel()
    } else {
      setSelectedLog(ev)
      setAnimating(false)
    }
  }, [selectedLog, closePanel])

  const hasPanel = selectedLog !== null

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content area — three-column: content + right sidebar */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Center content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Program identity strip */}
          <ProgramStrip />

          {/* Charts row — side by side */}
          <div className={cn(
            "grid border-b border-[var(--line)] bg-[var(--surface)]",
            hasPanel ? "grid-cols-1" : "grid-cols-2"
          )}>
            <div className={!hasPanel ? "border-r border-[var(--line)]" : ""}>
              <ComputeUnitChart />
            </div>
            {!hasPanel && <InstructionVolumeChart />}
          </div>

          {/* Tab switcher */}
          <div className="flex items-center border-b border-[var(--line)] bg-[var(--surface)] px-5">
            <button
              onClick={() => setActiveTab("logs")}
              className={cn(
                "px-3 py-2.5 text-[11px] font-medium transition-all border-b-2 -mb-px",
                activeTab === "logs"
                  ? "text-[var(--text-primary)] border-[var(--green)]"
                  : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]"
              )}
            >
              <Radio size={10} className="inline -mt-px mr-1.5" />
              Parsed Logs
            </button>
            <button
              onClick={() => setActiveTab("instructions")}
              className={cn(
                "px-3 py-2.5 text-[11px] font-medium transition-all border-b-2 -mb-px",
                activeTab === "instructions"
                  ? "text-[var(--text-primary)] border-[var(--green)]"
                  : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]"
              )}
            >
              <Terminal size={10} className="inline -mt-px mr-1.5" />
              Instruction Breakdown
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "logs" ? (
            <LogEventFeed events={MOCK_LOG_EVENTS} onSelect={openLog} />
          ) : (
            <InstructionTable onSelect={(ix) => {
              // For now just switch back to logs filtered to that instruction type
              setActiveTab("logs")
            }} />
          )}
        </div>

        {/* Right sidebar — always visible unless detail panel is open */}
        {!hasPanel && <RightSidebar />}
      </div>

      {/* Detail panel */}
      {hasPanel && (
        <div
          ref={panelRef}
          className={`flex flex-col w-[440px] shrink-0 overflow-hidden bg-[var(--surface)] ${animating ? "panel-exit" : "panel-enter"}`}
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <LogDetailPanel event={selectedLog!} onClose={closePanel} />
        </div>
      )}
    </div>
  )
}
