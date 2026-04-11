"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EventsChart } from "@/components/dashboard/events-chart"
import { FilterBar } from "@/components/dashboard/header"
import { IssueDetail } from "@/components/dashboard/issue-detail"
import { IssueList } from "@/components/dashboard/issue-list"
import { StatsBar } from "@/components/dashboard/stats-bar"
import { useDashboardIssuesState } from "@/components/dashboard/dashboard-issues-state"
import { useDashboardShell } from "@/components/dashboard/dashboard-shell"
import type { Issue } from "@/lib/mock-data"

export function IssuesPage() {
  const { toggleAI } = useDashboardShell()
  const {
    search,
    statusFilter,
    severityFilter,
    selectedIssueId,
    selectedIssue,
    filteredIssues,
    setSearch,
    setStatusFilter,
    setSeverityFilter,
    selectIssue,
    clearSelectedIssue,
  } = useDashboardIssuesState()

  const [closingIssue, setClosingIssue] = useState<Issue | null>(null)
  const [isClosingIssuePanel, setIsClosingIssuePanel] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  const clearPendingClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearPendingClose()
    }
  }, [clearPendingClose])

  useEffect(() => {
    if (selectedIssue) {
      clearPendingClose()
      setClosingIssue(null)
      setIsClosingIssuePanel(false)
    }
  }, [clearPendingClose, selectedIssue])

  const closeIssuePanel = useCallback(() => {
    if (!selectedIssue) {
      clearSelectedIssue()
      return
    }

    clearPendingClose()
    setClosingIssue(selectedIssue)
    setIsClosingIssuePanel(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      clearSelectedIssue()
      setClosingIssue(null)
      setIsClosingIssuePanel(false)
      closeTimeoutRef.current = null
    }, 150)
  }, [clearPendingClose, clearSelectedIssue, selectedIssue])

  const handleSelectIssue = useCallback(
    (id: string) => {
      if (selectedIssueId === id) {
        closeIssuePanel()
        return
      }

      clearPendingClose()
      setClosingIssue(null)
      setIsClosingIssuePanel(false)
      selectIssue(id)
    },
    [clearPendingClose, closeIssuePanel, selectIssue, selectedIssueId],
  )

  const detailIssue = selectedIssue ?? closingIssue
  const hasIssuePanel = detailIssue !== null

  return (
    <>
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto transition-all duration-200 ease-out"
        data-has-detail-panel={hasIssuePanel ? "true" : "false"}
        data-search-value={search}
        data-selected-issue-id={selectedIssue?.id ?? ""}
        data-severity-filter={severityFilter}
        data-status-filter={statusFilter}
        data-testid="issues-shell"
      >
        <StatsBar compact={hasIssuePanel} />
        <EventsChart />
        <FilterBar
          onSearch={setSearch}
          onSeverityFilter={setSeverityFilter}
          onStatusFilter={setStatusFilter}
          search={search}
          severityFilter={severityFilter}
          statusFilter={statusFilter}
        />
        <IssueList
          issues={filteredIssues}
          onSelect={handleSelectIssue}
          selectedId={selectedIssueId}
          severityFilter={severityFilter}
          statusFilter={statusFilter}
        />
      </div>

      {detailIssue && (
        <div
          className={`relative z-10 flex w-[440px] shrink-0 flex-col overflow-hidden sm:w-[320px] md:w-[380px] ${isClosingIssuePanel ? "panel-exit" : "panel-enter"}`}
          data-testid="issue-detail-panel"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <IssueDetail issue={detailIssue} onClose={closeIssuePanel} onOpenAI={toggleAI} />
        </div>
      )}
    </>
  )
}
