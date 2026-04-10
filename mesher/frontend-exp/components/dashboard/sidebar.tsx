"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Activity,
  GitBranch,
  Bell,
  Coins,
  Settings,
  ChevronDown,
  Box,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  Check,
  Plus,
} from "lucide-react"

// ─── Project data ───────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: "hyperpush-web", label: "hyperpush-web", color: "var(--green)" },
  { id: "hyperpush-api", label: "hyperpush-api", color: "var(--blue)" },
]

type NavItem = {
  icon: React.ElementType
  label: string
  href: string
  badge?: string
  accent?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { icon: AlertTriangle, label: "Issues", href: "issues", badge: "24" },
  { icon: Activity, label: "Performance", href: "performance" },
  { icon: Cpu, label: "Solana Programs", href: "solana-programs" },
  { icon: GitBranch, label: "Releases", href: "releases" },
  { icon: Bell, label: "Alerts", href: "alerts", badge: "3" },
  { icon: Coins, label: "Bounties", href: "bounties", badge: "4" },
  { icon: Shield, label: "Treasury", href: "treasury" },
  { icon: Settings, label: "Settings", href: "settings" },
]

interface SidebarProps {
  active: string
  onNavigate: (href: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ active, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const c = collapsed
  const [activeProject, setActiveProject] = useState("hyperpush-web")
  const [projectOpen, setProjectOpen] = useState(false)
  const project = PROJECTS.find((p) => p.id === activeProject) ?? PROJECTS[0]

  // When collapsed, close the inline panel (it doesn't fit)
  const handleToggleProject = () => {
    if (c) return
    setProjectOpen((o) => !o)
  }

  const handleSelectProject = (id: string) => {
    setActiveProject(id)
    setProjectOpen(false)
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col bg-[var(--surface)] z-30 transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: c ? "var(--sidebar-collapsed)" : "var(--sidebar-width)", boxShadow: "var(--shadow-sidebar)" }}
    >
      {/* Logo row */}
      <div className={cn(
        "flex items-center border-b border-[var(--line)] shrink-0",
        c ? "justify-center" : "justify-between px-5"
      )} style={{ height: "var(--header-height)" }}>
        {!c && <img src="/logo-light.svg" alt="hyperpush" className="h-5" />}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all duration-150 active:scale-[0.93] shrink-0"
        >
          {c ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Project selector — inline accordion */}
      <div className="shrink-0">
        {/* Trigger row */}
        <button
          onClick={handleToggleProject}
          className={cn(
            "flex items-center w-full transition-colors shrink-0",
            c ? "justify-center py-3" : "justify-between gap-2 px-5 py-3",
            projectOpen
              ? "bg-[var(--surface-2)]"
              : "hover:bg-[var(--surface-2)]"
          )}
        >
          <div className="w-5 h-5 rounded-[5px] bg-[var(--surface-3)] flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-[var(--line)]">
            <Box size={10} style={{ color: project.color }} />
          </div>
          {!c && (
            <>
              <span className="flex-1 text-left text-xs font-medium text-[var(--text-primary)] truncate">
                {project.label}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200",
                  projectOpen && "rotate-180"
                )}
              />
            </>
          )}
        </button>

        {/* Inline panel — slides open below the trigger */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            projectOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          )}
          aria-hidden={!projectOpen}
        >
          <div className="bg-[var(--surface-2)] border-b border-[var(--line)] py-1.5">
            {/* Section label */}
            <div className="px-5 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                Projects
              </p>
            </div>

            {/* Project rows */}
            {PROJECTS.map((p) => {
              const isSelected = activeProject === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-5 py-[7px] text-[12px] font-medium transition-colors",
                    isSelected
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
                  )}
                >
                  <div className="w-5 h-5 rounded-[5px] bg-[var(--surface-3)] flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-[var(--line)]">
                    <Box size={10} style={{ color: p.color }} />
                  </div>
                  <span className="flex-1 text-left truncate">{p.label}</span>
                  {isSelected && <Check size={11} className="shrink-0 text-[var(--green)]" />}
                </button>
              )
            })}

            {/* Separator + new project */}
            <div className="mx-4 my-1.5 h-px bg-[var(--line)]" />
            <button
              onClick={() => setProjectOpen(false)}
              className="w-full flex items-center gap-2.5 px-5 py-[7px] text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
            >
              <div className="w-5 h-5 rounded-[5px] bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-[var(--line)]">
                <Plus size={10} className="text-[var(--text-faint)]" />
              </div>
              <span>New project…</span>
            </button>
          </div>
        </div>

        {/* Border below the whole block */}
        {!projectOpen && <div className="border-b border-[var(--line)]" />}
      </div>

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
        <div className={cn("flex items-center", c ? "justify-center" : "justify-between gap-2.5 px-2")}>
          <div className={cn("flex items-center", c ? "" : "gap-2.5")}>
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
          <button
            onClick={() => onNavigate("settings")}
            title="Settings"
            className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all duration-150 active:scale-[0.93] shrink-0"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
