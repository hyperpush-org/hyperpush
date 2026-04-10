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
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Copy,
  ExternalLink,
  Layers,
  Terminal,
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
   Program identity strip - the "who" at the top
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
    <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6 py-3">

      {/* min-[1360px]+: single row. below: identity row + stats row */}
      <div className="flex flex-col min-[1360px]:flex-row min-[1360px]:items-center min-[1360px]:justify-between min-[1360px]:gap-3">

        {/* Identity block — name/badge + address/slot */}
        <div className="min-w-0">
          {/* Row 1: name + health badge */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{p.label}</span>
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-[2px] rounded leading-none ring-1 ring-inset uppercase tracking-[0.04em] shrink-0"
              style={{ color: hc, backgroundColor: `color-mix(in srgb, ${hc} 12%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${hc} 20%, transparent)` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hc }} />
              {p.health}
            </span>
          </div>

          {/* Row 2: address · slot */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{p.programId}</span>
              <button className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"><Copy size={9} /></button>
              <button className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"><ExternalLink size={9} /></button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[var(--line)] select-none">·</span>
              <Radio size={9} className={s.indexLag <= 10 ? "text-[var(--green)]" : "text-[var(--yellow)]"} />
              <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                Slot <span className="font-mono text-[var(--text-primary)]">{s.lastIndexedSlot.toLocaleString()}</span>
              </span>
              <span className={cn(
                "text-[9px] font-mono px-1 py-[1px] rounded whitespace-nowrap",
                s.indexLag <= 10
                  ? "text-[var(--green)] bg-[var(--green)]/[0.08]"
                  : "text-[var(--yellow)] bg-[var(--yellow)]/[0.08]"
              )}>
                {s.indexLag === 0 ? "synced" : `-${s.indexLag} slots`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row — second row on <lg, right-aligned on lg+ */}
        <div className={cn(
          "flex items-center gap-4 sm:gap-6 min-[1360px]:shrink-0",
          // on small screens: new row with top border as separator
          "mt-2.5 pt-2.5 border-t border-[var(--line-subtle)]",
          // on min-[1360px]+: inline, no border/padding
          "min-[1360px]:mt-0 min-[1360px]:pt-0 min-[1360px]:border-t-0"
        )}>
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
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--text-faint)] mb-0.5 whitespace-nowrap">{label}</p>
      <p className="text-[13px] font-bold tabular-nums leading-none tracking-tight" style={{ color: color || "var(--text-primary)" }}>{value}</p>
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
    <div>
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

const logStatusAccent: Record<string, string> = {
  success: "var(--green)",
  failed: "var(--red)",
}

const logStatusTextClass: Record<string, string> = {
  success: "text-[var(--green)]",
  failed: "text-[var(--red)]",
}

function LogEventRow({ event: ev, onClick }: { event: ParsedLogEvent; onClick: () => void }) {
  const accent = logStatusAccent[ev.status] || "var(--text-faint)"

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left",
        "border-b border-[var(--line)]",
        "transition-colors duration-100",
        "hover:bg-[var(--surface-2)]/60"
      )}
    >
      {/* Full-height left status stripe */}
      <div
        className="absolute left-0 inset-y-0 w-[3px]"
        style={{ backgroundColor: accent, opacity: ev.status === "success" ? 0.5 : 1 }}
      />

      <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-3.5">
        <div className="flex items-start gap-3 sm:gap-5">

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Instruction name */}
            <p className="text-[13.5px] sm:text-sm font-semibold font-mono text-[var(--text-primary)] leading-snug">
              {ev.instruction}
            </p>

            {/* Meta row: status · error code · signature · signer */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.05em] leading-none", logStatusTextClass[ev.status])}>
                {ev.status}
              </span>
              {ev.errorCode && (
                <>
                  <span className="text-[var(--line)]">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[var(--red)] bg-[var(--red)]/[0.10] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--red)]/20">
                    {ev.errorCode}
                  </span>
                </>
              )}
              <span className="text-[var(--line)]">·</span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">{ev.signature}</span>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">{ev.signerKey}</span>
            </div>

            {/* Bottom row: slot · error preview */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[var(--text-faint)] tabular-nums">
                slot <span className="font-mono text-[var(--text-secondary)]">{ev.slot.toLocaleString()}</span>
              </span>
              {ev.errorMessage && (
                <>
                  <span className="text-[var(--line)] opacity-60">·</span>
                  <span className="text-[11px] text-[var(--red)]/70 truncate max-w-[20rem]">{ev.errorMessage}</span>
                </>
              )}
            </div>
          </div>

          {/* Right: key stats — widths mirror column headers */}
          <div className="flex-shrink-0 flex items-start gap-2 sm:gap-3 pt-0.5">
            <div className="text-right w-[52px] sm:w-[60px]">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none tabular-nums">
                {ev.computeUnits.toLocaleString()}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">CU</p>
            </div>
            <div className="text-right w-[52px] sm:w-[60px]">
              <p className="text-[12px] font-medium text-[var(--text-primary)] leading-none">{ev.timestamp}</p>
              <p className="text-[10px] text-[var(--text-faint)] mt-1">ago</p>
            </div>
          </div>

        </div>
      </div>
    </button>
  )
}

function LogEventFeed({ events, onSelect }: { events: ParsedLogEvent[]; onSelect: (e: ParsedLogEvent) => void }) {
  return (
    <div>
      {/* Combined header: count + live indicator on left, column headers on right */}
      <div className="flex flex-wrap items-center pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 gap-y-1.5 border-b border-[var(--line)] bg-[var(--surface)]">
        {/* Left: log count + live badge + ingested */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
            <span className="text-[var(--text-primary)] font-semibold tabular-nums">{events.length}</span> logs
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--green)] bg-[var(--green)]/[0.08] px-1.5 py-[2px] rounded-[4px] leading-none ring-1 ring-inset ring-[var(--green)]/15">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" style={{ animationDuration: "2s" }} />
            live
          </span>
          <span className="text-[10px] text-[var(--text-faint)] tabular-nums">
            {MOCK_PROGRAM_STATS.logEventsIngested.toLocaleString()} ingested
          </span>
        </div>

        {/* Right: column headers — pushed to far right */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[52px] sm:w-[60px] text-right">CU</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-faint)] w-[52px] sm:w-[60px] text-right">Time</span>
        </div>
      </div>

      {/* Rows */}
      {events.map((ev) => (
        <LogEventRow key={ev.id} event={ev} onClick={() => onSelect(ev)} />
      ))}
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
    <>
      {/* Scroll parent — one scroll context for content column + sidebar together */}
      <div className="flex items-start flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out">

        {/* Main content column — no own scroll */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Program identity strip */}
          <ProgramStrip />

          {/* Charts row */}
          <div className="grid border-b border-[var(--line)] bg-[var(--surface)] grid-cols-1 lg:grid-cols-2">
            <div className="border-b border-[var(--line)] lg:border-b-0 lg:border-r">
              <ComputeUnitChart />
            </div>
            <InstructionVolumeChart />
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
              setActiveTab("logs")
            }} />
          )}
        </div>
      </div>

      {/* Detail panel */}
      {hasPanel && (
        <div
          ref={panelRef}
          className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <LogDetailPanel event={selectedLog!} onClose={closePanel} />
        </div>
      )}
    </>
  )
}
