"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Settings as SettingsIcon,
  Coins,
  Wallet,
  Users,
  GitBranch,
  Key,
  AlertTriangle,
  CreditCard,
  Shield,
  Bell,
  User,
  Save,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Info,
  ChevronDown,
  Monitor,
  Zap,
} from "lucide-react"
import { MOCK_TREASURY } from "@/lib/mock-data"

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsTab =
  | "general" | "bounty" | "token" | "team"
  | "integrations" | "api-keys" | "alerts" | "billing"
  | "security" | "notifications" | "profile"

// ─── Nav groups ────────────────────────────────────────────────────────────────

const NAV_GROUPS: Array<{
  label: string
  items: Array<{ id: SettingsTab; label: string; icon: React.ElementType }>
}> = [
  {
    label: "Project",
    items: [
      { id: "general",      label: "General",      icon: SettingsIcon },
      { id: "bounty",       label: "Bounty",        icon: Coins },
      { id: "token",        label: "Token",         icon: Wallet },
      { id: "team",         label: "Team",          icon: Users },
      { id: "integrations", label: "Integrations",  icon: GitBranch },
      { id: "api-keys",     label: "API Keys",      icon: Key },
      { id: "alerts",       label: "Alerts",        icon: AlertTriangle },
      { id: "billing",      label: "Billing",       icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "security",      label: "Security",      icon: Shield },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "profile",       label: "Profile",       icon: User },
    ],
  },
]

// ─── Mock data ────────────────────────────────────────────────────────────────

const PROJECT_CONFIG = {
  name: "hyperpush-web",
  description: "Main web application for error tracking and bug bounty platform",
  defaultEnvironment: "production",
  dataRetention: "90 days",
  publicDashboard: true,
  allowAnonymousIssues: false,
}
const BOUNTY_CONFIG = {
  enabled: true, publicBoardEnabled: true,
  autoApproveThreshold: 10, requireVerification: true, minReputation: 5,
  severityAmounts: {
    critical: { min: 100, max: 1000 }, high: { min: 50, max: 500 },
    medium: { min: 25, max: 250 },     low: { min: 10, max: 100 },
  },
}
const TEAM_MEMBERS = [
  { id: "1", name: "alex.kim",         email: "alex@hyperpush.dev",    role: "owner",     avatar: "AK", lastSeen: "Active now" },
  { id: "2", name: "sarah.dev",        email: "sarah@hyperpush.dev",   role: "admin",     avatar: "SD", lastSeen: "5m ago" },
  { id: "3", name: "dev.sol",          email: "dev@hyperpush.dev",     role: "developer", avatar: "DS", lastSeen: "1h ago" },
  { id: "4", name: "frontend_newbie",  email: "newbie@hyperpush.dev",  role: "viewer",    avatar: "FN", lastSeen: "3d ago" },
]
const INTEGRATIONS = [
  { id: "github",  name: "GitHub",  icon: GitBranch, connected: true,  detail: "hyperpush/web · main" },
  { id: "slack",   name: "Slack",   icon: Bell,      connected: true,  detail: "#alerts, #bounties" },
  { id: "discord", name: "Discord", icon: Users,     connected: false, detail: "Not connected" },
]
const API_KEYS = [
  { id: "hpk_live_xxxxx",   name: "Production",         scopes: ["read", "write"],   lastUsed: "2h ago",  createdAt: "30d ago" },
  { id: "hpk_test_xxxxx",   name: "Development",        scopes: ["read"],            lastUsed: "1d ago",  createdAt: "45d ago" },
  { id: "hpx_custom_xxxxx", name: "Custom Integration", scopes: ["read", "alerts"],  lastUsed: "5m ago",  createdAt: "7d ago" },
]
const BILLING_INFO = {
  plan: "Pro", monthlyPrice: 29, nextBillingDate: "May 10, 2026",
  eventsIncluded: 100000, eventsUsed: 67842,
  aiAnalysisUsed: 18, aiAnalysisIncluded: 30,
  tradingVolume: 8750, tradingVolumeTarget: 10000,
}
const ALERT_RULES = [
  { id: "ALT-001", name: "Critical Error Rate",      condition: "error_rate > 5%",         severity: "critical", enabled: true,  channels: ["email", "slack"] },
  { id: "ALT-002", name: "P95 Latency Degradation",  condition: "p95_latency > 2000ms",    severity: "high",     enabled: true,  channels: ["slack"] },
  { id: "ALT-003", name: "Smart Contract Failure",   condition: "tx_failure_rate > 10%",   severity: "critical", enabled: true,  channels: ["email", "slack"] },
  { id: "ALT-004", name: "Low User Impact",          condition: "affected_users < 10",     severity: "low",      enabled: false, channels: ["email"] },
]
const NOTIF_PREFS = { email: true, slack: true, discord: false, critical: true, high: true, medium: false, low: false, weeklyDigest: true, bountyClaims: true, paymentReceived: true }
const USER_PROFILE = { name: "Alex Kim", email: "alex@hyperpush.dev", username: "alex.kim", avatar: "AK", walletConnected: true, walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", totalEarned: 12500, completedBounties: 47 }
const ACTIVE_SESSIONS = [
  { id: "1", device: "Chrome on macOS",   location: "San Francisco, CA", ip: "192.168.1.1", lastActive: "Active now", current: true },
  { id: "2", device: "Safari on iOS",     location: "San Francisco, CA", ip: "192.168.1.2", lastActive: "2h ago",     current: false },
  { id: "3", device: "Chrome on Windows", location: "New York, NY",      ip: "192.168.1.3", lastActive: "1d ago",     current: false },
]

// ─── Primitives ────────────────────────────────────────────────────────────────

function Toggle({ defaultChecked, onChange }: { defaultChecked?: boolean; onChange?: () => void }) {
  const [on, setOn] = useState(defaultChecked ?? false)
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => { setOn(!on); onChange?.() }}
      className={cn(
        "relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none",
        on ? "bg-[var(--green)]" : "bg-[var(--surface-3)] border border-[var(--line)]"
      )}
    >
      <span className={cn("block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 mt-[2px]", on ? "translate-x-[18px]" : "translate-x-[2px]")} />
    </button>
  )
}

// Input/select base styles
const iCls = "h-9 px-3 rounded-md bg-[var(--surface-2)] border border-[var(--line)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--green)]/40 focus:ring-1 focus:ring-[var(--green)]/20 transition-all"
const sCls = iCls + " appearance-none cursor-pointer pr-8"

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
    </div>
  )
}

// ─── Layout primitives ─────────────────────────────────────────────────────────

/** Full-width section separator with label */
function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-8 pb-1 first:pt-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-faint)] shrink-0">
        {title}
      </span>
      <div className="flex-1 h-px bg-[var(--line)]" />
      {action}
    </div>
  )
}

/** Two-column row: label+desc left | control right */
function SettingRow({ label, description, children, last }: { label: string; description?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-8 py-3.5", !last && "border-b border-[var(--line)]")}>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{label}</p>
        {description && <p className="text-[11.5px] text-[var(--text-tertiary)] mt-0.5 leading-snug">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Stacked row: label above, full-width control below */
function InputRow({ label, description, children, last }: { label: string; description?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-3.5", !last && "border-b border-[var(--line)]")}>
      <p className="text-[13px] font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
      {description && <p className="text-[11.5px] text-[var(--text-tertiary)] mb-2.5">{description}</p>}
      {!description && <div className="mb-2" />}
      {children}
    </div>
  )
}

/** Generic bare row (for lists, etc.) */
function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-3 flex items-center", !last && "border-b border-[var(--line)]")}>
      {children}
    </div>
  )
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const SVCOLS: Record<string, string> = {
  critical: "text-[var(--red)]   bg-[var(--red)]/[0.10]",
  high:     "text-[var(--yellow)] bg-[var(--yellow)]/[0.10]",
  medium:   "text-[var(--blue)]  bg-[var(--blue)]/[0.08]",
  low:      "text-[var(--text-secondary)] bg-[var(--surface-3)]",
}
const ROLCOLS: Record<string, string> = {
  owner:     "text-[var(--green)]  bg-[var(--green)]/[0.08]",
  admin:     "text-[var(--blue)]   bg-[var(--blue)]/[0.08]",
  developer: "text-[var(--yellow)] bg-[var(--yellow)]/[0.08]",
  viewer:    "text-[var(--text-secondary)] bg-[var(--surface-3)]",
}
function SevBadge({ s }: { s: string }) {
  return <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0", SVCOLS[s] || SVCOLS.low)}>{s}</span>
}
function RoleBadge({ r }: { r: string }) {
  return <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0", ROLCOLS[r] || ROLCOLS.viewer)}>{r}</span>
}

// ─── Buttons ───────────────────────────────────────────────────────────────────

function Btn({ children, icon: Icon, onClick, ghost, danger, small }: { children: React.ReactNode; icon?: React.ElementType; onClick?: () => void; ghost?: boolean; danger?: boolean; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-150 active:scale-[0.97]",
        small ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[11px]",
        danger ? "bg-[var(--red)]/[0.10] text-[var(--red)] hover:bg-[var(--red)]/[0.18]"
          : ghost ? "bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          : "bg-[var(--green)]/[0.10] text-[var(--green)] hover:bg-[var(--green)]/[0.18]"
      )}
    >
      {Icon && <Icon size={11} />}
      {children}
    </button>
  )
}

// ─── TrendingUp (svg) ──────────────────────────────────────────────────────────

function TUp({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = "var(--green)" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const mark = () => setDirty(true)

  const save = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false); setSaved(true); setDirty(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-[var(--surface)] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 border-b border-[var(--line)] shrink-0" style={{ height: "var(--header-height)" }}>
        <div className="flex items-center gap-2.5">
          <SettingsIcon size={14} className="text-[var(--text-tertiary)]" />
          <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-[-0.01em]">Settings</span>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[11px] text-[var(--yellow)]">Unsaved changes</span>}
          {saved && <span className="flex items-center gap-1 text-[11px] text-[var(--green)]"><Check size={10} />Saved</span>}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
              dirty && !saving
                ? "bg-[var(--green)]/[0.10] text-[var(--green)] hover:bg-[var(--green)]/[0.18]"
                : "text-[var(--text-faint)] cursor-not-allowed"
            )}
          >
            {saving ? <><RefreshCw size={11} className="animate-spin" />Saving…</> : <><Save size={11} />Save</>}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 border-r border-[var(--line)] overflow-y-auto py-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-5 pt-5 border-t border-[var(--line)]")}>
              <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-[6px] text-[12.5px] font-medium transition-colors duration-100 relative",
                      active
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {active && <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-r-sm bg-[var(--green)]" />}
                    <item.icon size={13} className={active ? "text-[var(--green)]" : ""} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-7 max-w-3xl mx-auto w-full">
            {tab === "general"      && <GeneralTab      onChange={mark} />}
            {tab === "bounty"       && <BountyTab        onChange={mark} />}
            {tab === "token"        && <TokenTab />}
            {tab === "team"         && <TeamTab          onChange={mark} />}
            {tab === "integrations" && <IntegrationsTab  onChange={mark} />}
            {tab === "api-keys"     && <APIKeysTab       onChange={mark} />}
            {tab === "alerts"       && <AlertsTab        onChange={mark} />}
            {tab === "billing"      && <BillingTab />}
            {tab === "security"     && <SecurityTab      onChange={mark} />}
            {tab === "notifications"&& <NotificationsTab onChange={mark} />}
            {tab === "profile"      && <ProfileTab       onChange={mark} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page title ────────────────────────────────────────────────────────────────

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-1 pb-5 border-b border-[var(--line)]">
      <h2 className="text-[17px] font-semibold text-[var(--text-primary)] tracking-[-0.02em]">{title}</h2>
      <p className="text-[12.5px] text-[var(--text-tertiary)] mt-1">{subtitle}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: General
// ═══════════════════════════════════════════════════════════════════════════════

function GeneralTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="General" subtitle="Project name, environment defaults, and data handling" />

      <SectionHead title="Project" />

      <InputRow label="Project name" description="Displayed in the dashboard and integrations">
        <input type="text" defaultValue={PROJECT_CONFIG.name} onChange={onChange} className={iCls + " w-full"} />
      </InputRow>

      <InputRow label="Description" description="Brief summary shown in exports and reports">
        <textarea
          defaultValue={PROJECT_CONFIG.description}
          onChange={onChange}
          rows={3}
          className={iCls + " w-full h-auto py-2 resize-none leading-relaxed"}
        />
      </InputRow>

      <SectionHead title="Defaults" />

      <SettingRow label="Default environment" description="Pre-selected when opening the dashboard">
        <SelectWrap>
          <select defaultValue={PROJECT_CONFIG.defaultEnvironment} onChange={onChange} className={sCls + " w-40"}>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </SelectWrap>
      </SettingRow>

      <SettingRow label="Data retention" description="Events older than this are automatically deleted" last>
        <SelectWrap>
          <select defaultValue={PROJECT_CONFIG.dataRetention} onChange={onChange} className={sCls + " w-36"}>
            <option>30 days</option>
            <option>90 days</option>
            <option>180 days</option>
            <option>1 year</option>
          </select>
        </SelectWrap>
      </SettingRow>

      <SectionHead title="Visibility" />

      <SettingRow label="Public dashboard" description="Anyone with the link can view your dashboard">
        <Toggle defaultChecked={PROJECT_CONFIG.publicDashboard} onChange={onChange} />
      </SettingRow>

      <SettingRow label="Anonymous issue submission" description="Allow users without accounts to report issues via the SDK" last>
        <Toggle defaultChecked={PROJECT_CONFIG.allowAnonymousIssues} onChange={onChange} />
      </SettingRow>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Bounty
// ═══════════════════════════════════════════════════════════════════════════════

function BountyTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="Bounty" subtitle="Reward tiers, approval flow, and public bug board" />

      <SectionHead title="Program" />

      <SettingRow label="Enable bounties" description="Attach bounty amounts to issues">
        <Toggle defaultChecked={BOUNTY_CONFIG.enabled} onChange={onChange} />
      </SettingRow>
      <SettingRow label="Public bug board" description="Show open bounties on the public leaderboard" last>
        <Toggle defaultChecked={BOUNTY_CONFIG.publicBoardEnabled} onChange={onChange} />
      </SettingRow>

      <SectionHead title="Approval" />

      <SettingRow label="Auto-approve threshold" description="Minimum upvotes to auto-approve a claim">
        <input type="number" defaultValue={BOUNTY_CONFIG.autoApproveThreshold} onChange={onChange} className={iCls + " w-20 text-center"} />
      </SettingRow>
      <SettingRow label="Require PR verification" description="A merged pull request must be linked before payout">
        <Toggle defaultChecked={BOUNTY_CONFIG.requireVerification} onChange={onChange} />
      </SettingRow>
      <SettingRow label="Minimum reputation" description="Score required to submit a claim" last>
        <input type="number" defaultValue={BOUNTY_CONFIG.minReputation} onChange={onChange} className={iCls + " w-20 text-center"} />
      </SettingRow>

      <SectionHead title="Reward tiers" />

      <div>
        {Object.entries(BOUNTY_CONFIG.severityAmounts).map(([sev, amounts], i, arr) => (
          <div key={sev} className={cn("flex items-center gap-3 py-3", i < arr.length - 1 && "border-b border-[var(--line)]")}>
            <SevBadge s={sev} />
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-[var(--text-faint)]">$</span>
              <input type="number" defaultValue={amounts.min} onChange={onChange} className={iCls + " w-[70px] h-8 text-[12px] text-center"} />
              <span className="text-[11px] text-[var(--text-faint)]">–</span>
              <input type="number" defaultValue={amounts.max} onChange={onChange} className={iCls + " w-[80px] h-8 text-[12px] text-center"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Token
// ═══════════════════════════════════════════════════════════════════════════════

function TokenTab() {
  const t = MOCK_TREASURY
  return (
    <div>
      <PageTitle title="Token" subtitle="Treasury balance, economics, and free tier progress" />

      <div className="flex items-start gap-2.5 py-3 mb-1 text-[11.5px] text-[var(--text-tertiary)] leading-relaxed">
        <Info size={13} className="text-[var(--purple)] shrink-0 mt-0.5" />
        Token economics are set at the protocol level. Display preferences can be customized below.
      </div>

      <SectionHead title="Token" />

      {[
        { label: "Symbol",      value: t.token },
        { label: "Price",       value: `$${t.price.toFixed(4)}` },
        { label: "24h change",  value: `${t.change > 0 ? "+" : ""}${t.change}%`, accent: t.change > 0 ? "var(--green)" : "var(--red)" },
        { label: "Open bounties", value: String(t.openBounties) },
      ].map((row, i, arr) => (
        <SettingRow key={row.label} label={row.label} last={i === arr.length - 1}>
          <span className="text-[13px] font-semibold tabular-nums" style={row.accent ? { color: row.accent } : { color: "var(--text-primary)" }}>
            {row.value}
          </span>
        </SettingRow>
      ))}

      <SectionHead title="Treasury" />

      <div className="py-4 border-b border-[var(--line)]">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[11px] text-[var(--text-faint)] uppercase tracking-[0.07em] mb-1">Balance</p>
            <p className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight leading-none">
              {t.balance.toLocaleString()} <span className="text-[14px] text-[var(--text-secondary)] font-semibold">{t.token}</span>
            </p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">${t.usdValue.toFixed(2)} USD</p>
          </div>
          <div className="flex items-center gap-1 text-[var(--green)]">
            <TUp size={13} />
            <span className="text-[12px] font-semibold">+{t.change}%</span>
          </div>
        </div>
        <div className="flex gap-4 pt-3 border-t border-[var(--line)]">
          {[["Paid out", `$${t.paidOut}`], ["Open bounties", String(t.openBounties)], ["Next payout", t.nextPayout]].map(([l, v]) => (
            <div key={l}>
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-[0.07em]">{l}</p>
              <p className="text-[12px] font-semibold text-[var(--text-secondary)] mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <SectionHead title="Free tier unlock" />

      <div className="py-4 border-b border-[var(--line)]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Trading volume</span>
          <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">
            ${BILLING_INFO.tradingVolume.toLocaleString()} / ${BILLING_INFO.tradingVolumeTarget.toLocaleString()}
          </span>
        </div>
        <ProgressBar value={BILLING_INFO.tradingVolume} max={BILLING_INFO.tradingVolumeTarget} />
        <p className="text-[11px] text-[var(--text-faint)] mt-2">
          ${(BILLING_INFO.tradingVolumeTarget - BILLING_INFO.tradingVolume).toLocaleString()} more to unlock Pro for free
        </p>
      </div>

      <SectionHead title="Allocation" />

      {[
        { label: "Bounties",          pct: 60, color: "var(--green)",  amount: "$3,042" },
        { label: "Community rewards", pct: 20, color: "var(--purple)", amount: "$1,014" },
        { label: "Platform fees",     pct: 15, color: "var(--blue)",   amount: "$761" },
        { label: "Reserves",          pct: 5,  color: "var(--yellow)", amount: "$253" },
      ].map((row, i, arr) => (
        <div key={row.label} className={cn("py-3", i < arr.length - 1 && "border-b border-[var(--line)]")}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="text-[12.5px] text-[var(--text-secondary)]">{row.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--text-faint)]">{row.amount}</span>
              <span className="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums w-8 text-right">{row.pct}%</span>
            </div>
          </div>
          <ProgressBar value={row.pct} max={100} color={row.color} />
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Team
// ═══════════════════════════════════════════════════════════════════════════════

function TeamTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="Team" subtitle="Manage members, roles, and pending invitations" />

      <SectionHead title={`Members · ${TEAM_MEMBERS.length}`} action={<Btn icon={Plus}>Invite</Btn>} />

      {TEAM_MEMBERS.map((m, i) => (
        <Row key={m.id} last={i === TEAM_MEMBERS.length - 1}>
          <div className="w-7 h-7 rounded-full bg-[var(--surface-3)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] shrink-0">
            {m.avatar}
          </div>
          <div className="flex-1 min-w-0 mx-3">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{m.name}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">{m.email}</p>
          </div>
          <RoleBadge r={m.role} />
          <span className="text-[11px] text-[var(--text-faint)] w-16 text-right ml-3 shrink-0">{m.lastSeen}</span>
          {m.role !== "owner" && (
            <button className="ml-2 p-1 rounded text-[var(--text-faint)] hover:text-[var(--red)] transition-colors">
              <Trash2 size={12} />
            </button>
          )}
        </Row>
      ))}

      <SectionHead title="Pending invitations" />
      <p className="py-6 text-center text-[12px] text-[var(--text-faint)]">No pending invitations</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Integrations
// ═══════════════════════════════════════════════════════════════════════════════

function IntegrationsTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="Integrations" subtitle="Connect third-party services and configure webhooks" />

      <SectionHead title="Connections" />

      {INTEGRATIONS.map((integ, i) => (
        <Row key={integ.id} last={i === INTEGRATIONS.length - 1}>
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <integ.icon size={14} className={integ.connected ? "text-[var(--text-secondary)]" : "text-[var(--text-faint)]"} />
          </div>
          <div className="flex-1 min-w-0 mx-3">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{integ.name}</p>
            <p className={cn("text-[11px]", integ.connected ? "text-[var(--green)]" : "text-[var(--text-faint)]")}>
              {integ.detail}
            </p>
          </div>
          {integ.connected
            ? <><span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] mr-2" /><Btn ghost>Configure</Btn></>
            : <Btn>Connect</Btn>
          }
        </Row>
      ))}

      <SectionHead title="Webhooks" action={<Btn icon={Plus}>Add</Btn>} />

      <Row last>
        <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center shrink-0">
          <ExternalLink size={13} className="text-[var(--text-faint)]" />
        </div>
        <div className="flex-1 min-w-0 mx-3">
          <p className="text-[13px] font-medium text-[var(--text-primary)]">Production Alerts</p>
          <p className="text-[11px] text-[var(--text-faint)] font-mono truncate">https://api.example.com/webhooks/mesher</p>
        </div>
        <span className="text-[10px] font-semibold text-[var(--green)] mr-2">Active</span>
        <button className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--red)] transition-colors">
          <Trash2 size={12} />
        </button>
      </Row>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: API Keys
// ═══════════════════════════════════════════════════════════════════════════════

function APIKeysTab({ onChange }: { onChange: () => void }) {
  const [create, setCreate] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (id: string) => { navigator.clipboard.writeText(id); setCopied(id); setTimeout(() => setCopied(null), 1500) }

  return (
    <div>
      <PageTitle title="API Keys" subtitle="Create and manage access credentials" />

      {create && (
        <div className="mb-6 pb-6 border-b border-[var(--line)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">New key</p>
            <button onClick={() => setCreate(false)} className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors">
              <X size={13} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11.5px] font-medium text-[var(--text-secondary)] mb-1.5">Name</label>
              <input type="text" placeholder="e.g. Production App" className={iCls + " w-full"} />
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-[var(--text-secondary)] mb-1.5">Scopes</p>
              <div className="flex flex-wrap gap-1.5">
                {["read", "write", "alerts", "admin"].map((s) => (
                  <label key={s} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--line)] cursor-pointer hover:border-[var(--green)]/30 transition-colors text-[11.5px] text-[var(--text-secondary)]">
                    <input type="checkbox" className="w-3 h-3 accent-[var(--green)]" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Btn>Create key</Btn>
              <Btn ghost onClick={() => setCreate(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      <SectionHead title={`Keys · ${API_KEYS.length}`} action={!create ? <Btn icon={Plus} onClick={() => setCreate(true)}>Create</Btn> : undefined} />

      {API_KEYS.map((key, i) => (
        <Row key={key.id} last={i === API_KEYS.length - 1}>
          <div className="w-7 h-7 rounded-md bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <Key size={12} className="text-[var(--text-faint)]" />
          </div>
          <div className="flex-1 min-w-0 mx-3">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{key.name}</p>
            <p className="text-[10.5px] font-mono text-[var(--text-faint)] truncate">{key.id}</p>
          </div>
          <div className="flex items-center gap-1 mr-3">
            {key.scopes.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[9.5px] text-[var(--text-tertiary)]">{s}</span>
            ))}
          </div>
          <span className="text-[11px] text-[var(--text-faint)] tabular-nums mr-2 hidden sm:block">{key.lastUsed}</span>
          <button onClick={() => copy(key.id)} className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors">
            {copied === key.id ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} />}
          </button>
          <button className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--red)] transition-colors ml-0.5">
            <Trash2 size={12} />
          </button>
        </Row>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Alerts
// ═══════════════════════════════════════════════════════════════════════════════

function AlertsTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="Alerts" subtitle="Configure rules, thresholds, and notification channels" />

      <SectionHead title={`Rules · ${ALERT_RULES.filter((r) => r.enabled).length} active`} action={<Btn icon={Plus}>Create</Btn>} />

      {ALERT_RULES.map((rule, i) => (
        <Row key={rule.id} last={i === ALERT_RULES.length - 1}>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-0.5", rule.enabled ? "bg-[var(--green)]" : "bg-[var(--surface-3)]")} />
          <div className="flex-1 min-w-0 mx-3">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">{rule.name}</p>
              {!rule.enabled && <span className="text-[10px] text-[var(--text-faint)]">disabled</span>}
            </div>
            <p className="text-[11px] font-mono text-[var(--text-faint)]">{rule.condition}</p>
          </div>
          <div className="flex items-center gap-1 mr-2">
            {rule.channels.map((ch) => (
              <span key={ch} className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[9.5px] text-[var(--text-tertiary)] capitalize">{ch}</span>
            ))}
          </div>
          <SevBadge s={rule.severity} />
          <button className="ml-2 p-1 rounded text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors">
            <SettingsIcon size={12} />
          </button>
        </Row>
      ))}

      <SectionHead title="Channels" />

      {[
        { name: "Email",     detail: "alex@hyperpush.dev",    on: true },
        { name: "Slack",     detail: "#alerts, #bounties",    on: true },
        { name: "Discord",   detail: "Not configured",        on: false },
        { name: "PagerDuty", detail: "Not configured",        on: false },
      ].map((ch, i, arr) => (
        <Row key={ch.name} last={i === arr.length - 1}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{ch.name}</p>
            <p className={cn("text-[11px]", ch.on ? "text-[var(--text-tertiary)]" : "text-[var(--text-faint)]")}>{ch.detail}</p>
          </div>
          {ch.on ? <Btn ghost>Configure</Btn> : <Btn>Connect</Btn>}
        </Row>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Billing
// ═══════════════════════════════════════════════════════════════════════════════

function BillingTab() {
  const b = BILLING_INFO
  return (
    <div>
      <PageTitle title="Billing" subtitle="Plan, usage, and payment method" />

      {/* Plan summary — inline, no card */}
      <div className="flex items-center justify-between py-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-[var(--green)]" />
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Pro Plan</span>
          <span className="text-[12px] text-[var(--text-tertiary)]">· ${b.monthlyPrice}/month</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-faint)]">Renews {b.nextBillingDate}</span>
          <Btn ghost>Manage</Btn>
        </div>
      </div>

      <SectionHead title="Usage this month" />

      {[
        { label: "Events",              used: b.eventsUsed,       total: b.eventsIncluded,      color: "var(--blue)" },
        { label: "AI analysis sessions", used: b.aiAnalysisUsed,  total: b.aiAnalysisIncluded,  color: "var(--purple)" },
      ].map((item, i, arr) => (
        <div key={item.label} className={cn("py-3.5", i < arr.length - 1 && "border-b border-[var(--line)]")}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] text-[var(--text-secondary)]">{item.label}</span>
            <span className="text-[11.5px] text-[var(--text-faint)] tabular-nums">{item.used.toLocaleString()} / {item.total.toLocaleString()}</span>
          </div>
          <ProgressBar value={item.used} max={item.total} color={item.color} />
          <p className="text-[10.5px] text-[var(--text-faint)] mt-1.5">{(item.total - item.used).toLocaleString()} remaining</p>
        </div>
      ))}

      <SectionHead title="Free tier unlock" />

      <div className="py-3.5 border-b border-[var(--line)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12.5px] text-[var(--text-secondary)]">Monthly trading volume</span>
          <span className="text-[11.5px] text-[var(--text-faint)] tabular-nums">${b.tradingVolume.toLocaleString()} / ${b.tradingVolumeTarget.toLocaleString()}</span>
        </div>
        <ProgressBar value={b.tradingVolume} max={b.tradingVolumeTarget} />
        <p className="text-[10.5px] text-[var(--text-faint)] mt-1.5">${(b.tradingVolumeTarget - b.tradingVolume).toLocaleString()} more to unlock Pro for free</p>
      </div>

      <SectionHead title="Payment" />

      <Row last>
        <div className="flex items-center gap-3 flex-1">
          <CreditCard size={14} className="text-[var(--text-faint)]" />
          <div>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Visa ending in 4242</p>
            <p className="text-[11px] text-[var(--text-faint)]">Expires 12/27</p>
          </div>
        </div>
        <Btn ghost>Update</Btn>
      </Row>

      <SectionHead title="Plans" />

      {[
        { name: "Self-Hosted", price: "Free",      detail: "Unlimited events · self-managed",            current: false },
        { name: "Pro",         price: "$29/mo",    detail: "100K events · AI analysis · 10 members",     current: true },
        { name: "Pro+",        price: "$100/mo",   detail: "1M events · unlimited team · priority support", current: false },
      ].map((plan, i, arr) => (
        <div key={plan.name} className={cn("flex items-center justify-between py-3", i < arr.length - 1 && "border-b border-[var(--line)]")}>
          <div className="flex items-center gap-2.5">
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", plan.current ? "bg-[var(--green)]" : "bg-[var(--surface-3)]")} />
            <div>
              <span className="text-[13px] font-medium text-[var(--text-primary)]">{plan.name}</span>
              {plan.current && <span className="ml-2 text-[10px] text-[var(--green)]">current</span>}
              <p className="text-[11px] text-[var(--text-faint)]">{plan.detail}</p>
            </div>
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-secondary)] tabular-nums">{plan.price}</span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Security
// ═══════════════════════════════════════════════════════════════════════════════

function SecurityTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="Security" subtitle="Two-factor authentication, sessions, and account access" />

      <SectionHead title="Authentication" />

      <Row last>
        <div className="w-8 h-8 rounded-lg bg-[var(--green)]/[0.08] border border-[var(--green)]/[0.20] flex items-center justify-center shrink-0">
          <Shield size={14} className="text-[var(--green)]" />
        </div>
        <div className="flex-1 min-w-0 mx-3">
          <p className="text-[13px] font-medium text-[var(--text-primary)]">2FA enabled</p>
          <p className="text-[11px] text-[var(--text-tertiary)]">Authenticator app · Set up 14 days ago</p>
        </div>
        <Btn ghost>Manage</Btn>
      </Row>

      <SectionHead title={`Sessions · ${ACTIVE_SESSIONS.length}`} action={<Btn danger small>Revoke others</Btn>} />

      {ACTIVE_SESSIONS.map((s, i) => (
        <Row key={s.id} last={i === ACTIVE_SESSIONS.length - 1}>
          <div className={cn("w-7 h-7 rounded-md border flex items-center justify-center shrink-0", s.current ? "bg-[var(--green)]/[0.08] border-[var(--green)]/[0.20]" : "bg-[var(--surface-2)] border-[var(--line)]")}>
            <Monitor size={12} className={s.current ? "text-[var(--green)]" : "text-[var(--text-faint)]"} />
          </div>
          <div className="flex-1 min-w-0 mx-3">
            <p className="text-[12.5px] font-medium text-[var(--text-primary)]">{s.device}</p>
            <p className="text-[10.5px] text-[var(--text-faint)]">{s.location} · {s.ip}</p>
          </div>
          <span className={cn("text-[11px] tabular-nums", s.current ? "text-[var(--green)]" : "text-[var(--text-faint)]")}>
            {s.current ? "this session" : s.lastActive}
          </span>
          {!s.current && (
            <button className="ml-2 p-1 rounded text-[var(--text-faint)] hover:text-[var(--red)] transition-colors">
              <X size={12} />
            </button>
          )}
        </Row>
      ))}

      <SectionHead title="Password" />

      <SettingRow label="Password" description="Last changed 30 days ago" last>
        <Btn ghost>Change</Btn>
      </SettingRow>

      <SectionHead title="Danger zone" />

      <div className="py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Delete account</p>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">Permanently removes all data. Cannot be undone.</p>
          </div>
          <Btn danger>Delete account</Btn>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Notifications
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationsTab({ onChange }: { onChange: () => void }) {
  return (
    <div>
      <PageTitle title="Notifications" subtitle="Choose how and when you receive alerts and digests" />

      <SectionHead title="Channels" />

      {[
        { label: "Email",   detail: "alex@hyperpush.dev",    key: "email"   as keyof typeof NOTIF_PREFS },
        { label: "Slack",   detail: "#alerts, #bounties",    key: "slack"   as keyof typeof NOTIF_PREFS },
        { label: "Discord", detail: "Not connected",         key: "discord" as keyof typeof NOTIF_PREFS },
      ].map((ch, i, arr) => (
        <SettingRow key={ch.label} label={ch.label} description={ch.detail} last={i === arr.length - 1}>
          <Toggle defaultChecked={NOTIF_PREFS[ch.key] as boolean} onChange={onChange} />
        </SettingRow>
      ))}

      <SectionHead title="By severity" />

      {(["critical", "high", "medium", "low"] as const).map((sev, i, arr) => (
        <div key={sev} className={cn("flex items-center justify-between py-3.5", i < arr.length - 1 && "border-b border-[var(--line)]")}>
          <SevBadge s={sev} />
          <Toggle defaultChecked={NOTIF_PREFS[sev]} onChange={onChange} />
        </div>
      ))}

      <SectionHead title="Event types" />

      <SettingRow label="Weekly digest" description="Summary delivered every Monday morning">
        <Toggle defaultChecked={NOTIF_PREFS.weeklyDigest} onChange={onChange} />
      </SettingRow>
      <SettingRow label="Bounty claim submitted" description="Someone submitted a claim on your bounties">
        <Toggle defaultChecked={NOTIF_PREFS.bountyClaims} onChange={onChange} />
      </SettingRow>
      <SettingRow label="Payment received" description="A payout arrived in your connected wallet" last>
        <Toggle defaultChecked={NOTIF_PREFS.paymentReceived} onChange={onChange} />
      </SettingRow>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Profile
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileTab({ onChange }: { onChange: () => void }) {
  const p = USER_PROFILE
  return (
    <div>
      <PageTitle title="Profile" subtitle="Identity, wallet connection, and bounty history" />

      {/* Avatar + name — top of page */}
      <div className="flex items-center gap-3.5 py-4 border-b border-[var(--line)] mb-1">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] border border-[var(--line)] flex items-center justify-center text-[14px] font-bold text-[var(--text-secondary)] shrink-0">
          {p.avatar}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">{p.name}</p>
          <p className="text-[11.5px] text-[var(--text-tertiary)]">{p.email}</p>
        </div>
      </div>

      <SectionHead title="Identity" />

      <InputRow label="Display name">
        <input type="text" defaultValue={p.name} onChange={onChange} className={iCls + " w-full"} />
      </InputRow>
      <InputRow label="Email address">
        <input type="email" defaultValue={p.email} onChange={onChange} className={iCls + " w-full"} />
      </InputRow>
      <InputRow label="Username" last>
        <input type="text" defaultValue={p.username} onChange={onChange} className={iCls + " w-full"} />
      </InputRow>

      <SectionHead title="Wallet" />

      <div className="py-3.5 border-b border-[var(--line)]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Wallet connected</span>
          </div>
          <button className="text-[11px] text-[var(--text-faint)] hover:text-[var(--red)] transition-colors">Disconnect</button>
        </div>
        <div className="px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--line)]">
          <p className="text-[11.5px] font-mono text-[var(--text-secondary)] break-all">{p.walletAddress}</p>
        </div>
        <p className="text-[10.5px] text-[var(--text-faint)] mt-2">Bounty payouts are sent to this wallet in HPX tokens</p>
      </div>

      <SectionHead title="History" />

      <div className="grid grid-cols-2 gap-px py-1">
        {[
          { label: "Total earned",       value: `$${p.totalEarned.toLocaleString()}` },
          { label: "Bounties completed", value: String(p.completedBounties) },
        ].map(({ label, value }) => (
          <div key={label} className="py-4">
            <p className="text-[10.5px] text-[var(--text-faint)] uppercase tracking-[0.08em] mb-1.5">{label}</p>
            <p className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
