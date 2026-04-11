import { expect, test } from '@playwright/test'

type RuntimeSignalTracker = {
  consoleErrors: string[]
  failedRequests: string[]
}

type DirectEntryRouteCase = {
  label: string
  pathname: string
  routeKey: string
  assert: (page: import('@playwright/test').Page) => Promise<void>
}

type IssuesShellStateExpectation = {
  search: string
  statusFilter: string
  severityFilter: string
  selectedIssueId: string
  detailVisible: boolean
}

const directEntryRoutes: DirectEntryRouteCase[] = [
  {
    label: 'issues',
    pathname: '/',
    routeKey: 'issues',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
      await expect(page.getByTestId('issues-shell')).toBeVisible()
      await expect(page.getByTestId('issues-search-input')).toBeVisible()
    },
  },
  {
    label: 'performance',
    pathname: '/performance',
    routeKey: 'performance',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Performance', level: 1 })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Apdex', exact: true })).toBeVisible()
    },
  },
  {
    label: 'solana programs',
    pathname: '/solana-programs',
    routeKey: 'solana-programs',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Solana Programs', level: 1 })).toBeVisible()
      await expect(page.getByRole('button', { name: /Parsed Logs/i })).toBeVisible()
    },
  },
  {
    label: 'releases',
    pathname: '/releases',
    routeKey: 'releases',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Releases', level: 1 })).toBeVisible()
      await expect(page.getByPlaceholder('Search releases…')).toBeVisible()
    },
  },
  {
    label: 'alerts',
    pathname: '/alerts',
    routeKey: 'alerts',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Alerts', level: 1 })).toBeVisible()
      await expect(page.getByPlaceholder('Search alerts…')).toBeVisible()
    },
  },
  {
    label: 'bounties',
    pathname: '/bounties',
    routeKey: 'bounties',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Bounties', level: 1 })).toBeVisible()
      await expect(page.getByPlaceholder('Search claims…')).toBeVisible()
    },
  },
  {
    label: 'treasury',
    pathname: '/treasury',
    routeKey: 'treasury',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Treasury', level: 1 })).toBeVisible()
      await expect(page.getByPlaceholder('Search transactions…')).toBeVisible()
    },
  },
  {
    label: 'settings',
    pathname: '/settings',
    routeKey: 'settings',
    assert: async (page) => {
      await expect(page.getByTestId('ai-copilot-toggle')).toHaveCount(0)
      await expect(page.getByText('Project name', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    },
  },
]

const settingsDirectEntryRoute = directEntryRoutes.find((route) => route.routeKey === 'settings')

if (!settingsDirectEntryRoute) {
  throw new Error('Expected a settings direct-entry route case for deep-link parity checks')
}

function attachRuntimeSignalTracking(page: import('@playwright/test').Page): RuntimeSignalTracker {
  const runtimeSignals: RuntimeSignalTracker = {
    consoleErrors: [],
    failedRequests: [],
  }

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeSignals.consoleErrors.push(message.text())
    }
  })

  page.on('requestfailed', (request) => {
    runtimeSignals.failedRequests.push(
      `${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown error'}`,
    )
  })

  page.on('response', (response) => {
    if (response.status() >= 400) {
      runtimeSignals.failedRequests.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      )
    }
  })

  return runtimeSignals
}

function clearRuntimeSignals(runtimeSignals: RuntimeSignalTracker) {
  runtimeSignals.consoleErrors.length = 0
  runtimeSignals.failedRequests.length = 0
}

async function assertCleanRuntimeSignals(runtimeSignals: RuntimeSignalTracker) {
  expect(runtimeSignals.consoleErrors, 'Expected the dashboard shell to boot without console errors').toEqual([])
  expect(runtimeSignals.failedRequests, 'Expected the dashboard shell to avoid failed requests').toEqual([])
}

async function expectPathname(page: import('@playwright/test').Page, pathname: string) {
  await expect
    .poll(async () => page.evaluate(() => window.location.pathname))
    .toBe(pathname)
}

async function assertDirectEntryRoute(page: import('@playwright/test').Page, route: DirectEntryRouteCase) {
  await page.goto(route.pathname)

  await expectPathname(page, route.pathname)
  await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', route.routeKey)
  await expect(page.getByTestId(`sidebar-nav-${route.routeKey}`)).toHaveAttribute('data-active', 'true')
  await route.assert(page)
}

async function assertIssuesShellState(
  page: import('@playwright/test').Page,
  { search, statusFilter, severityFilter, selectedIssueId, detailVisible }: IssuesShellStateExpectation,
) {
  const issuesShell = page.getByTestId('issues-shell')
  const searchInput = page.getByTestId('issues-search-input')
  const detailPanel = page.getByTestId('issue-detail-panel')

  await expect(searchInput).toHaveValue(search)
  await expect(issuesShell).toHaveAttribute('data-search-value', search)
  await expect(issuesShell).toHaveAttribute('data-status-filter', statusFilter)
  await expect(issuesShell).toHaveAttribute('data-severity-filter', severityFilter)
  await expect(issuesShell).toHaveAttribute('data-selected-issue-id', selectedIssueId)

  if (detailVisible) {
    await expect(detailPanel).toBeVisible()
    return
  }

  await expect(detailPanel).toBeHidden()
}

test.describe('dashboard route parity', () => {
  test('issues shell keeps current root landmarks and shell controls', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)

    await page.goto('/')

    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
    await expect(page.getByTestId('issues-shell')).toBeVisible()
    await expect(page.getByTestId('sidebar-nav-issues')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('issues-search-input')).toBeVisible()
    await expect(page.getByText('Bulk actions')).toBeVisible()

    await page.getByTestId('sidebar-collapse-toggle').click()
    await expect(page.getByTestId('dashboard-sidebar')).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeVisible()
    await expect(page.getByTestId('ai-panel').getByText('AI Copilot', { exact: true })).toBeVisible()

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeHidden()
    await expect(page.getByTestId('dashboard-sidebar')).toHaveAttribute('data-collapsed', 'true')

    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('issues shell handles repeated AI toggles and small-screen auto-collapse', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 })
    const runtimeSignals = attachRuntimeSignalTracking(page)

    await page.goto('/')

    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await expect(page.getByTestId('dashboard-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeVisible()
    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeHidden()
    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeVisible()

    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('issues interactions persist across shell re-renders and detail toggles', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)

    await page.goto('/')

    const issuesShell = page.getByTestId('issues-shell')
    const searchInput = page.getByTestId('issues-search-input')
    const detailPanel = page.getByTestId('issue-detail-panel')
    const issueRow = page.getByTestId('issue-row-HPX-1039')

    await expect(issuesShell).toHaveAttribute('data-status-filter', 'all')
    await expect(issuesShell).toHaveAttribute('data-severity-filter', 'all')
    await expect(issuesShell).toHaveAttribute('data-selected-issue-id', '')

    await searchInput.fill('HPX-1039')
    await expect(searchInput).toHaveValue('HPX-1039')
    await expect(issuesShell).toHaveAttribute('data-search-value', 'HPX-1039')

    await page.getByTestId('issues-status-filter-regressed').click()
    await expect(issuesShell).toHaveAttribute('data-status-filter', 'regressed')

    await page.getByTestId('issues-severity-filter-critical').click()
    await expect(issuesShell).toHaveAttribute('data-severity-filter', 'critical')

    await expect(issueRow).toBeVisible()
    await issueRow.click()
    await expect(issuesShell).toHaveAttribute('data-selected-issue-id', 'HPX-1039')
    await expect(detailPanel).toBeVisible()

    await page.getByTestId('sidebar-nav-performance').click()
    await expect(page.getByRole('heading', { name: 'Performance', level: 1 })).toBeVisible()
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'performance')

    await page.getByTestId('sidebar-nav-issues').click()
    await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await expect(searchInput).toHaveValue('HPX-1039')
    await expect(issuesShell).toHaveAttribute('data-search-value', 'HPX-1039')
    await expect(issuesShell).toHaveAttribute('data-status-filter', 'regressed')
    await expect(issuesShell).toHaveAttribute('data-severity-filter', 'critical')
    await expect(issuesShell).toHaveAttribute('data-selected-issue-id', 'HPX-1039')
    await expect(detailPanel).toBeVisible()

    await page.getByTestId('issue-detail-close').click()
    await expect(detailPanel).toBeHidden()
    await expect(issuesShell).toHaveAttribute('data-selected-issue-id', '')

    await issueRow.click()
    await expect(detailPanel).toBeVisible()
    await expect(issuesShell).toHaveAttribute('data-selected-issue-id', 'HPX-1039')

    await searchInput.fill('')
    await expect(searchInput).toHaveValue('')
    await expect(issuesShell).toHaveAttribute('data-search-value', '')

    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('solana programs AI auto-collapses the sidebar and restores it on close', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const runtimeSignals = attachRuntimeSignalTracking(page)
    const sidebar = page.getByTestId('dashboard-sidebar')
    const aiPanel = page.getByTestId('ai-panel')

    await page.goto('/solana-programs')

    await expectPathname(page, '/solana-programs')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'solana-programs')
    await expect(page.getByTestId('sidebar-nav-solana-programs')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Solana Programs', level: 1 })).toBeVisible()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(aiPanel).toBeVisible()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(aiPanel).toBeHidden()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(aiPanel).toBeVisible()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(aiPanel).toBeHidden()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false')

    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('browser back and forward preserve issues state after search, filters, and detail changes', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)
    const issuesShell = page.getByTestId('issues-shell')
    const issueRow = page.getByTestId('issue-row-HPX-1039')

    await page.goto('/')

    await page.getByTestId('issues-search-input').fill('HPX-1039')
    await page.getByTestId('issues-status-filter-regressed').click()
    await page.getByTestId('issues-severity-filter-critical').click()
    await expect(issueRow).toBeVisible()
    await issueRow.click()

    await assertIssuesShellState(page, {
      search: 'HPX-1039',
      statusFilter: 'regressed',
      severityFilter: 'critical',
      selectedIssueId: 'HPX-1039',
      detailVisible: true,
    })

    await page.getByTestId('sidebar-nav-performance').click()
    await expectPathname(page, '/performance')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'performance')
    await expect(page.getByTestId('sidebar-nav-performance')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Performance', level: 1 })).toBeVisible()

    await page.goBack()
    await expectPathname(page, '/')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await expect(page.getByTestId('sidebar-nav-issues')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
    await assertIssuesShellState(page, {
      search: 'HPX-1039',
      statusFilter: 'regressed',
      severityFilter: 'critical',
      selectedIssueId: 'HPX-1039',
      detailVisible: true,
    })

    await page.goForward()
    await expectPathname(page, '/performance')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'performance')
    await expect(page.getByRole('heading', { name: 'Performance', level: 1 })).toBeVisible()

    await page.goBack()
    await expectPathname(page, '/')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await assertIssuesShellState(page, {
      search: 'HPX-1039',
      statusFilter: 'regressed',
      severityFilter: 'critical',
      selectedIssueId: 'HPX-1039',
      detailVisible: true,
    })

    await page.getByTestId('issue-detail-close').click()
    await expect(issuesShell).toHaveAttribute('data-selected-issue-id', '')
    await assertIssuesShellState(page, {
      search: 'HPX-1039',
      statusFilter: 'regressed',
      severityFilter: 'critical',
      selectedIssueId: '',
      detailVisible: false,
    })

    await page.getByTestId('sidebar-nav-alerts').click()
    await expectPathname(page, '/alerts')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'alerts')
    await expect(page.getByRole('heading', { name: 'Alerts', level: 1 })).toBeVisible()

    await page.goBack()
    await expectPathname(page, '/')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await assertIssuesShellState(page, {
      search: 'HPX-1039',
      statusFilter: 'regressed',
      severityFilter: 'critical',
      selectedIssueId: '',
      detailVisible: false,
    })

    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('navigation parity keeps URL, active nav, AI visibility, and settings chrome aligned', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)

    await page.goto('/')

    const issuesShell = page.getByTestId('issues-shell')
    const searchInput = page.getByTestId('issues-search-input')
    const sidebar = page.getByTestId('dashboard-sidebar')

    await searchInput.fill('HPX-1039')
    await expect(issuesShell).toHaveAttribute('data-search-value', 'HPX-1039')
    await page.getByTestId('issues-status-filter-regressed').click()
    await expect(issuesShell).toHaveAttribute('data-status-filter', 'regressed')
    await page.getByTestId('issues-severity-filter-critical').click()
    await expect(issuesShell).toHaveAttribute('data-severity-filter', 'critical')

    await page.getByTestId('sidebar-collapse-toggle').click()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeVisible()

    await page.getByTestId('sidebar-nav-performance').click()
    await expectPathname(page, '/performance')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'performance')
    await expect(page.getByTestId('sidebar-nav-performance')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Performance', level: 1 })).toBeVisible()
    await expect(page.getByTestId('ai-panel')).toBeHidden()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('ai-copilot-toggle').click()
    await expect(page.getByTestId('ai-panel')).toBeVisible()

    await page.getByTestId('sidebar-nav-releases').click()
    await expectPathname(page, '/releases')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'releases')
    await expect(page.getByTestId('sidebar-nav-releases')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Releases', level: 1 })).toBeVisible()
    await expect(page.getByTestId('ai-panel')).toBeHidden()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('sidebar-footer-settings').click()
    await expectPathname(page, '/settings')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'settings')
    await expect(page.getByTestId('sidebar-nav-settings')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('ai-copilot-toggle')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Settings' })).toHaveCount(0)
    await expect(page.getByText('Project name', { exact: true })).toBeVisible()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.getByTestId('sidebar-nav-issues').click()
    await expectPathname(page, '/')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await expect(page.getByTestId('sidebar-nav-issues')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
    await expect(page.getByTestId('issues-search-input')).toHaveValue('HPX-1039')
    await expect(issuesShell).toHaveAttribute('data-search-value', 'HPX-1039')
    await expect(issuesShell).toHaveAttribute('data-status-filter', 'regressed')
    await expect(issuesShell).toHaveAttribute('data-severity-filter', 'critical')
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('direct-entry settings boots cleanly before any in-app navigation', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)

    await assertDirectEntryRoute(page, settingsDirectEntryRoute)
    await assertCleanRuntimeSignals(runtimeSignals)
  })

  test('direct-entry routes render the expected shell state and landmarks', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)

    for (const route of directEntryRoutes) {
      await test.step(`direct entry: ${route.label}`, async () => {
        await assertDirectEntryRoute(page, route)
        await assertCleanRuntimeSignals(runtimeSignals)
        clearRuntimeSignals(runtimeSignals)
      })
    }
  })

  test('direct-entry routes fall back to issues for unknown paths', async ({ page }) => {
    const runtimeSignals = attachRuntimeSignalTracking(page)

    await page.goto('/does-not-exist/deep-link')

    expect(await page.evaluate(() => window.location.pathname)).toBe('/does-not-exist/deep-link')
    await expect(page.getByTestId('dashboard-shell')).toHaveAttribute('data-route-key', 'issues')
    await expect(page.getByTestId('sidebar-nav-issues')).toHaveAttribute('data-active', 'true')
    await expect(page.getByRole('heading', { name: 'Issues', level: 1 })).toBeVisible()
    await expect(page.getByTestId('issues-search-input')).toBeVisible()

    await assertCleanRuntimeSignals(runtimeSignals)
  })
})
