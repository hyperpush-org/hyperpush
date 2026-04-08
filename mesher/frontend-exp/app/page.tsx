"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header, FilterBar } from "@/components/dashboard/header"
import { StatsBar } from "@/components/dashboard/stats-bar"
import { EventsChart } from "@/components/dashboard/events-chart"
import { IssueList } from "@/components/dashboard/issue-list"
import { IssueDetail } from "@/components/dashboard/issue-detail"
import { AIPanel } from "@/components/dashboard/ai-panel"
import { PerformancePage } from "@/components/dashboard/performance-page"
import { SolanaProgramsPage } from "@/components/dashboard/solana-programs-page"
import { MOCK_ISSUES } from "@/lib/mock-data"
import { Sparkles } from "lucide-react"

type RightPanel = { type: "issue"; id: string } | { type: "ai" } | null

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("issues")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")

  // Panel state with animation support
  const [panel, setPanel] = useState<RightPanel>(null)
  const [animating, setAnimating] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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
      setPanel({ type: "ai" })
      setAnimating(false)
    }
  }, [panel, closePanel])

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
  const pageTitle = isPerformance ? "Performance" : isSolanaPrograms ? "Solana Programs" : "Issues"

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden font-sans">
      <Sidebar active={activeNav} onNavigate={handleNavigate} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden transition-[margin] duration-200 ease-out" style={{ marginLeft: sidebarCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)" }}>
        <Header title={pageTitle}>
          <button
            onClick={toggleAI}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all duration-150 active:scale-[0.97] ${
              panel?.type === "ai"
                ? "bg-[var(--purple-dim)] text-[var(--purple)] border-[var(--purple)]/30"
                : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
            }`}
          >
            <Sparkles size={11} />
            AI Copilot
          </button>
        </Header>

        <div className="flex flex-1 overflow-hidden">
          {isPerformance ? (
            <PerformancePage />
          ) : isSolanaPrograms ? (
            <SolanaProgramsPage />
          ) : (
            <>
              {/* Issues column */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-200 ease-out">
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
                {/* Issue count */}
                <div className="px-6 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] font-semibold tabular-nums">{filteredIssues.length}</span> issues
                    {statusFilter !== "all" && <span className="text-[var(--text-faint)]"> · {statusFilter}</span>}
                    {severityFilter !== "all" && <span className="text-[var(--text-faint)]"> · {severityFilter}</span>}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--text-faint)]">Sort: Last seen</span>
                    <button className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.97]">Bulk actions</button>
                  </div>
                </div>
                <IssueList
                  issues={filteredIssues}
                  selectedId={panel?.type === "issue" ? panel.id : null}
                  onSelect={openIssue}
                />
              </div>

              {/* Issue detail panel (issues page only) */}
              {selectedIssue && (
                <div
                  ref={panelRef}
                  className={`flex flex-col w-[440px] shrink-0 overflow-hidden ${animating ? "panel-exit" : "panel-enter"}`}
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
              className={`flex flex-col w-[440px] shrink-0 overflow-hidden ${animating ? "panel-exit" : "panel-enter"}`}
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
