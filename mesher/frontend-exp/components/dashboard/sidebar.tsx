"use client"

import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Activity,
  GitBranch,
  Bell,
  Sparkles,
  Coins,
  Settings,
  ChevronDown,
  Box,
  Shield,
  BarChart3,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
} from "lucide-react"

const NAV_ITEMS = [
  { icon: AlertTriangle, label: "Issues", href: "issues", badge: "24" },
  { icon: Activity, label: "Performance", href: "performance" },
  { icon: Cpu, label: "Solana Programs", href: "solana-programs" },
  { icon: GitBranch, label: "Releases", href: "releases" },
  { icon: Bell, label: "Alerts", href: "alerts", badge: "3" },
  { icon: Sparkles, label: "AI Copilot", href: "ai", accent: true },
  { icon: Coins, label: "Bounties", href: "bounties", badge: "4" },
  { icon: BarChart3, label: "Dashboards", href: "dashboards" },
  { icon: Shield, label: "Treasury", href: "treasury" },
  { icon: Search, label: "Discover", href: "discover" },
]

interface SidebarProps {
  active: string
  onNavigate: (href: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ active, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const c = collapsed

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col bg-[var(--surface)] z-30 transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: c ? "var(--sidebar-collapsed)" : "var(--sidebar-width)", boxShadow: "var(--shadow-sidebar)" }}
    >
      {/* Logo row */}
      <div className={cn(
        "flex items-center border-b border-[var(--line)] shrink-0",
        c ? "justify-center" : "justify-between px-5"
      )} style={{ height: 'var(--header-height)' }}>
        {!c && <img src="/logo-light.svg" alt="hyperpush" className="h-5" />}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all duration-150 active:scale-[0.93] shrink-0"
        >
          {c ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Project selector */}
      <button className={cn(
        "flex items-center border-b border-[var(--line)] hover:bg-[var(--surface-2)] transition-colors active:scale-[0.98] shrink-0",
        c ? "justify-center py-3" : "justify-between gap-2 px-5 py-3"
      )}>
        <div className="w-5 h-5 rounded-[5px] bg-[var(--surface-3)] flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-[var(--line)]">
          <Box size={10} className="text-[var(--green)]" />
        </div>
        {!c && (
          <>
            <span className="flex-1 text-left text-xs font-medium text-[var(--text-primary)] truncate">hyperpush-web</span>
            <ChevronDown size={12} className="text-[var(--text-tertiary)] flex-shrink-0" />
          </>
        )}
      </button>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-2", c ? "px-1.5" : "px-2.5")}>
        {!c && (
          <div className="px-2 pt-1.5 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Monitor</p>
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.href
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              title={c ? item.label : undefined}
              className={cn(
                "w-full flex items-center rounded-md text-[12.5px] font-medium transition-all duration-150 group active:scale-[0.97] mb-0.5",
                c ? "justify-center py-2" : "justify-between px-2.5 py-[7px]",
                isActive
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-[var(--shadow-inset-subtle)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {c ? (
                <item.icon
                  size={16}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                  )}
                />
              ) : (
                <>
                  <span className="flex items-center gap-2.5">
                    <item.icon
                      size={14}
                      className={cn(
                        "transition-colors flex-shrink-0",
                        isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                      )}
                    />
                    <span>{item.label}</span>
                    {item.accent && !isActive && (
                      <span className="text-[9px] font-bold text-[var(--purple)] bg-[var(--purple-dim)] px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">new</span>
                    )}
                  </span>
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] leading-none tabular-nums",
                      isActive
                        ? "bg-[var(--text-primary)] text-[var(--background)]"
                        : "bg-[var(--surface-3)] text-[var(--text-tertiary)]"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-[var(--line)] py-3 shrink-0", c ? "px-1.5" : "px-3")}>
        <button
          onClick={() => onNavigate("settings")}
          title={c ? "Settings" : undefined}
          className={cn(
            "w-full flex items-center rounded-md text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors active:scale-[0.97]",
            c ? "justify-center py-2" : "gap-2.5 px-2 py-2"
          )}
        >
          <Settings size={14} className="text-[var(--text-tertiary)] flex-shrink-0" />
          {!c && <span>Settings</span>}
        </button>
        <div className={cn("flex items-center mt-2", c ? "justify-center" : "gap-2.5 px-2")}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] ring-1 ring-inset ring-[var(--line)] flex-shrink-0">
            N
          </div>
          {!c && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">alex.kim</p>
              <p className="text-[10px] text-[var(--text-tertiary)] truncate">owner</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
