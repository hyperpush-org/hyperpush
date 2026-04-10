"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header, FilterBar } from "@/components/dashboard/header"
import { StatsBar } from "@/components/dashboard/stats-bar"
import { EventsChart } from "@/components/dashboard/events-chart"
import { IssueList } from "@/components/dashboard/issue-list"
import { IssueDetail } from "@/components/dashboard/issue-detail"
import { AIPanel } from "@/components/dashboard/ai-panel"
import { PerformancePage } from "@/components/dashboard/performance-page"
import { SolanaProgramsPage } from "@/components/dashboard/solana-programs-page"
import { ReleasesPage } from "@/components/dashboard/releases-page"
import { AlertsPage } from "@/components/dashboard/alerts-page"
import { MOCK_ISSUES } from "@/lib/mock-data"
import { Sparkles } from "lucide-react"
import { BountiesPage } from "@/components/dashboard/bounties-page"
import { TreasuryPage } from "@/components/dashboard/treasury-page"
import { SettingsPage } from "@/components/dashboard/settings/settings-page"

type RightPanel = { type: "issue"; id: string } | { type: "ai" } | null

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("issues")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")

  // Auto-collapse sidebar on small screens (matches sm breakpoint where header text appears)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)')

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setSidebarCollapsed(e.matches)
    }

    // Initial check
    setSidebarCollapsed(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleMediaChange)
    return () => mediaQuery.removeEventListener('change', handleMediaChange)
  }, [])

  // Panel state with animation support
  const [panel, setPanel] = useState<RightPanel>(null)
  const [animating, setAnimating] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Track whether the sidebar was auto-collapsed when copilot opened on Solana Programs at <1920px.
  // Using a ref so it doesn't drive re-renders.
  const copilotAutoCollapsedSidebar = useRef(false)

  const selectedIssue = panel?.type === "issue"
    ? MOCK_ISSUES.find((i) => i.id === panel.id) ?? null
    : null

  const filteredIssues = useMemo(() => {
    return MOCK_ISSUES.filter((issue) => {
      if (search && !issue.title.toLowerCase().includes(search.toLowerCase()) && !issue.id.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && issue.status !== statusFilter) return false
      if (severityFilter !== "all" && issue.severity !== severityFilter) return false
      return true
    })
  }, [search, statusFilter, severityFilter])

  const closePanel = useCallback(() => {
    if (!panel) return
    // Restore sidebar if it was auto-collapsed when copilot opened
    if (panel.type === "ai" && copilotAutoCollapsedSidebar.current) {
      setSidebarCollapsed(false)
      copilotAutoCollapsedSidebar.current = false
    }
    setAnimating(true)
    // Let exit animation play, then unmount
    setTimeout(() => {
      setPanel(null)
      setAnimating(false)
    }, 150)
  }, [panel])

  const openIssue = useCallback((id: string) => {
    if (panel?.type === "issue" && panel.id === id) {
      closePanel()
    } else {
      setPanel({ type: "issue", id })
      setAnimating(false)
    }
  }, [panel, closePanel])

  const toggleAI = useCallback(() => {
    if (panel?.type === "ai") {
      closePanel()
    } else {
      // Auto-collapse sidebar when opening copilot on Solana Programs at <1920px
      if (activeNav === "solana-programs" && !sidebarCollapsed && window.innerWidth < 1920) {
        setSidebarCollapsed(true)
        copilotAutoCollapsedSidebar.current = true
      }
      setPanel({ type: "ai" })
      setAnimating(false)
    }
  }, [panel, closePanel, activeNav, sidebarCollapsed])

  const hasRight = panel !== null

  // Close panels when switching nav
  const handleNavigate = useCallback((href: string) => {
    if (href !== activeNav) {
      setPanel(null)
      setAnimating(false)
    }
    setActiveNav(href)
  }, [activeNav])

  const isPerformance = activeNav === "performance"
  const isSolanaPrograms = activeNav === "solana-programs"
  const isReleases = activeNav === "releases"
  const isAlerts = activeNav === "alerts"
  const isBounties = activeNav === "bounties"
  const isTreasury = activeNav === "treasury"
  const isSettings = activeNav === "settings"
  const pageTitle = isPerformance ? "Performance" : isSolanaPrograms ? "Solana Programs" : isReleases ? "Releases" : isAlerts ? "Alerts" : isBounties ? "Bounties" : isTreasury ? "Treasury" : isSettings ? "Settings" : "Issues"

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden font-sans">
      <Sidebar active={activeNav} onNavigate={handleNavigate} collapsed={sidebarCollapsed} onToggleCollapse={() => {
        // If the user manually toggles the sidebar, drop the auto-collapse tracking
        // so we don't fight them when the copilot panel closes
        copilotAutoCollapsedSidebar.current = false
        setSidebarCollapsed(!sidebarCollapsed)
      }} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden transition-[margin] duration-200 ease-out" style={{ marginLeft: sidebarCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)" }}>
        {!isSettings && (
          <Header title={pageTitle}>
            <button
              onClick={toggleAI}
              className={`flex items-center gap-1.5 px-2 sm:px-3 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.97] min-h-[32px] h-8 shrink-0 ${
                panel?.type === "ai"
                  ? "bg-[var(--purple-dim)] text-[var(--purple)] border-[var(--purple)]/30"
                  : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
              }`}
              aria-label="AI Copilot"
            >
              <Sparkles size={11} className="shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">AI Copilot</span>
            </button>
          </Header>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {isSettings ? (
            <SettingsPage />
          ) : isPerformance ? (
            <PerformancePage />
          ) : isSolanaPrograms ? (
            <SolanaProgramsPage />
          ) : isReleases ? (
            <ReleasesPage />
          ) : isAlerts ? (
            <AlertsPage />
          ) : isBounties ? (
            <BountiesPage />
          ) : isTreasury ? (
            <TreasuryPage />
          ) : (
            <>
              {/* Issues column */}
              <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out">
                <StatsBar compact={hasRight} />
                <EventsChart />
                <FilterBar
                  search={search}
                  onSearch={setSearch}
                  statusFilter={statusFilter}
                  onStatusFilter={setStatusFilter}
                  severityFilter={severityFilter}
                  onSeverityFilter={setSeverityFilter}
                />
                <IssueList
                  issues={filteredIssues}
                  selectedId={panel?.type === "issue" ? panel.id : null}
                  onSelect={openIssue}
                  statusFilter={statusFilter}
                  severityFilter={severityFilter}
                />
              </div>

              {/* Issue detail panel (issues page only) */}
              {selectedIssue && (
                <div
                  ref={panelRef}
                  className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
                  style={{ boxShadow: "var(--shadow-panel)" }}
                >
                  <IssueDetail
                    issue={selectedIssue}
                    onClose={closePanel}
                    onOpenAI={toggleAI}
                  />
                </div>
              )}
            </>
          )}

          {/* AI panel (available on all pages) */}
          {panel?.type === "ai" && (
            <div
              ref={panelRef}
              className={`flex flex-col w-[440px] md:w-[380px] sm:w-[320px] shrink-0 overflow-hidden relative z-10 ${animating ? "panel-exit" : "panel-enter"}`}
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              <AIPanel onClose={closePanel} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
