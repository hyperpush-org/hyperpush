"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { MOCK_ISSUES, type Issue, type IssueStatus, type Severity } from "@/lib/mock-data"

export type IssueStatusFilter = IssueStatus | "all"
export type IssueSeverityFilter = Severity | "all"

const ISSUE_STATUS_FILTER_VALUES: IssueStatusFilter[] = [
  "all",
  "open",
  "in-progress",
  "regressed",
  "resolved",
  "ignored",
]

const ISSUE_SEVERITY_FILTER_VALUES: IssueSeverityFilter[] = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
]

const ISSUES_BY_ID = new Map(MOCK_ISSUES.map((issue) => [issue.id, issue] as const))

export function normalizeIssueStatusFilter(value?: string | null): IssueStatusFilter {
  return ISSUE_STATUS_FILTER_VALUES.includes(value as IssueStatusFilter)
    ? (value as IssueStatusFilter)
    : "all"
}

export function normalizeIssueSeverityFilter(value?: string | null): IssueSeverityFilter {
  return ISSUE_SEVERITY_FILTER_VALUES.includes(value as IssueSeverityFilter)
    ? (value as IssueSeverityFilter)
    : "all"
}

function normalizeIssueSearch(value?: string | null): string {
  return value ?? ""
}

function getIssueById(id?: string | null): Issue | null {
  if (!id) {
    return null
  }

  return ISSUES_BY_ID.get(id) ?? null
}

interface DashboardIssuesStateValue {
  search: string
  statusFilter: IssueStatusFilter
  severityFilter: IssueSeverityFilter
  selectedIssueId: string | null
  selectedIssue: Issue | null
  filteredIssues: Issue[]
  setSearch: (value: string) => void
  setStatusFilter: (value: string) => void
  setSeverityFilter: (value: string) => void
  selectIssue: (id: string) => void
  clearSelectedIssue: () => void
}

const DashboardIssuesStateContext = createContext<DashboardIssuesStateValue | null>(null)

export function DashboardIssuesStateProvider({ children }: { children: ReactNode }) {
  const [search, setSearchState] = useState("")
  const [statusFilter, setStatusFilterState] = useState<IssueStatusFilter>("all")
  const [severityFilter, setSeverityFilterState] = useState<IssueSeverityFilter>("all")
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const selectedIssue = useMemo(() => getIssueById(selectedIssueId), [selectedIssueId])

  const filteredIssues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return MOCK_ISSUES.filter((issue) => {
      if (
        normalizedSearch &&
        !issue.title.toLowerCase().includes(normalizedSearch) &&
        !issue.id.toLowerCase().includes(normalizedSearch)
      ) {
        return false
      }

      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false
      }

      if (severityFilter !== "all" && issue.severity !== severityFilter) {
        return false
      }

      return true
    })
  }, [search, severityFilter, statusFilter])

  const setSearch = useCallback((value: string) => {
    setSearchState(normalizeIssueSearch(value))
  }, [])

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(normalizeIssueStatusFilter(value))
  }, [])

  const setSeverityFilter = useCallback((value: string) => {
    setSeverityFilterState(normalizeIssueSeverityFilter(value))
  }, [])

  const selectIssue = useCallback((id: string) => {
    const nextIssue = getIssueById(id)
    setSelectedIssueId(nextIssue?.id ?? null)
  }, [])

  const clearSelectedIssue = useCallback(() => {
    setSelectedIssueId(null)
  }, [])

  const value = useMemo<DashboardIssuesStateValue>(
    () => ({
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
    }),
    [
      clearSelectedIssue,
      filteredIssues,
      search,
      selectIssue,
      selectedIssue,
      selectedIssueId,
      setSearch,
      setSeverityFilter,
      setStatusFilter,
      severityFilter,
      statusFilter,
    ],
  )

  return (
    <DashboardIssuesStateContext.Provider value={value}>
      {children}
    </DashboardIssuesStateContext.Provider>
  )
}

export function useDashboardIssuesState() {
  const value = useContext(DashboardIssuesStateContext)

  if (!value) {
    throw new Error("useDashboardIssuesState must be used within DashboardIssuesStateProvider")
  }

  return value
}
