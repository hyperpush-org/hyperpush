export type Severity = "critical" | "high" | "medium" | "low"
export type IssueStatus = "open" | "ignored" | "resolved" | "regressed" | "in-progress"

export interface Issue {
  id: string
  title: string
  subtitle: string
  file: string
  severity: Severity
  status: IssueStatus
  count: number
  users: number
  project: string
  environment: string
  firstSeen: string
  lastSeen: string
  assignee?: string
  tags: string[]
  stacktrace: StackFrame[]
  breadcrumbs: Breadcrumb[]
  githubIssue?: string
  bounty?: number
  aiSummary?: string
  suspectCommit?: string
}

export interface StackFrame {
  file: string
  line: number
  col: number
  fn: string
  code: string[]
  highlight: number
  isApp: boolean
}

export interface Breadcrumb {
  time: string
  type: string
  message: string
  level: "info" | "warning" | "error"
}

export const MOCK_ISSUES: Issue[] = [
  {
    id: "HPX-1042",
    title: "TypeError: Cannot read properties of undefined (reading 'map')",
    subtitle: "Unhandled exception in Feed component during SSR",
    file: "src/components/Feed.tsx:47",
    severity: "critical",
    status: "open",
    count: 1847,
    users: 312,
    project: "hyperpush-web",
    environment: "production",
    firstSeen: "2h ago",
    lastSeen: "just now",
    assignee: "alex.kim",
    tags: ["react", "ssr", "production"],
    bounty: 250,
    githubIssue: "#1204",
    aiSummary: "The `events` prop is undefined when the Feed component renders server-side before the data fetch resolves. Suspect commit: `c8f2a91` by @alex.kim on Apr 3rd introduced an async boundary mismatch. Recommend adding a null check at line 47 and verifying the suspense boundary wrapping Feed.",
    suspectCommit: "c8f2a91",
    stacktrace: [
      { file: "src/components/Feed.tsx", line: 47, col: 22, fn: "Feed.render", code: ["  const items = events.map(e => (", "    <FeedItem key={e.id} event={e} />", "  ))"], highlight: 0, isApp: true },
      { file: "src/pages/index.tsx", line: 83, col: 5, fn: "IndexPage", code: ["  return <Feed events={data?.events} />"], highlight: 0, isApp: true },
      { file: "node_modules/react-dom/server.js", line: 4221, col: 14, fn: "renderToString", code: ["  return renderToStringImpl(element)"], highlight: 0, isApp: false },
    ],
    breadcrumbs: [
      { time: "12:01:42", type: "navigation", message: "Navigated to /feed", level: "info" },
      { time: "12:01:43", type: "fetch", message: "GET /api/v1/events → 200 (148ms)", level: "info" },
      { time: "12:01:44", type: "console", message: "Warning: data?.events is undefined", level: "warning" },
      { time: "12:01:44", type: "exception", message: "TypeError: Cannot read properties of undefined", level: "error" },
    ],
  },
  {
    id: "HPX-1041",
    title: "NetworkError: Failed to fetch /api/v1/events — timeout after 10s",
    subtitle: "RPC call to events API times out intermittently under load",
    file: "src/lib/api.ts:112",
    severity: "high",
    status: "open",
    count: 423,
    users: 89,
    project: "hyperpush-web",
    environment: "production",
    firstSeen: "4h ago",
    lastSeen: "12s ago",
    tags: ["network", "api", "timeout"],
    bounty: 150,
    aiSummary: "Intermittent fetch timeouts correlate with traffic spikes above 1200 req/min. The 10s timeout is hit when the upstream Mesh queue is saturated. Increasing the timeout or adding a retry with exponential backoff at src/lib/api.ts:112 should resolve this.",
    suspectCommit: "a3d9e12",
    stacktrace: [
      { file: "src/lib/api.ts", line: 112, col: 10, fn: "fetchEvents", code: ["  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })", "  return res.json()"], highlight: 0, isApp: true },
      { file: "src/hooks/useEvents.ts", line: 31, col: 18, fn: "useEvents", code: ["  const data = await fetchEvents(params)"], highlight: 0, isApp: true },
    ],
    breadcrumbs: [
      { time: "11:44:02", type: "fetch", message: "GET /api/v1/events → pending", level: "info" },
      { time: "11:44:12", type: "exception", message: "AbortError: The operation was aborted (timeout 10000ms)", level: "error" },
    ],
  },
  {
    id: "HPX-1040",
    title: "ReferenceError: analytics is not defined",
    subtitle: "Analytics script not loaded before tracking call",
    file: "src/utils/tracking.ts:23",
    severity: "low",
    status: "open",
    count: 87,
    users: 44,
    project: "hyperpush-web",
    environment: "production",
    firstSeen: "1d ago",
    lastSeen: "1m ago",
    tags: ["analytics", "tracking"],
    stacktrace: [
      { file: "src/utils/tracking.ts", line: 23, col: 3, fn: "trackEvent", code: ["  analytics.track(eventName, props)"], highlight: 0, isApp: true },
    ],
    breadcrumbs: [
      { time: "10:22:11", type: "console", message: "analytics script blocked by ad-blocker", level: "warning" },
      { time: "10:22:12", type: "exception", message: "ReferenceError: analytics is not defined", level: "error" },
    ],
  },
  {
    id: "HPX-1039",
    title: "SolanaError: Transaction signature verification failed",
    subtitle: "Mainnet-beta signature mismatch on high-fee transactions",
    file: "src/solana/tx.ts:88",
    severity: "critical",
    status: "regressed",
    count: 234,
    users: 178,
    project: "hyperpush-solana",
    environment: "production",
    firstSeen: "6h ago",
    lastSeen: "30s ago",
    assignee: "dev.sol",
    tags: ["solana", "mainnet", "signature"],
    bounty: 500,
    githubIssue: "#1199",
    aiSummary: "Signature verification failures began with the v2.3.1 release. The transaction serialization changed in @solana/web3.js 1.87 — versioned transactions are not being signed with the correct message format. Revert to legacy transaction format or update signing logic.",
    suspectCommit: "f1c3b44",
    stacktrace: [
      { file: "src/solana/tx.ts", line: 88, col: 12, fn: "signAndSend", code: ["  const sig = await wallet.signTransaction(tx)", "  await connection.sendRawTransaction(sig.serialize())"], highlight: 0, isApp: true },
    ],
    breadcrumbs: [
      { time: "09:15:33", type: "rpc", message: "sendRawTransaction → Error 0x1 (signature verification failed)", level: "error" },
    ],
  },
  {
    id: "HPX-1038",
    title: "ChunkLoadError: Loading chunk vendors~main failed",
    subtitle: "Webpack chunk fails to load after recent deploy",
    file: "webpack://hyperpush/./src/index.ts",
    severity: "high",
    status: "in-progress",
    count: 612,
    users: 201,
    project: "hyperpush-web",
    environment: "production",
    firstSeen: "8h ago",
    lastSeen: "2m ago",
    tags: ["webpack", "deploy", "chunk"],
    aiSummary: "Chunk hash changed on deploy but CDN is still serving stale chunk URLs. Invalidate the CloudFront cache for /static/js/* after every deploy to fix.",
    stacktrace: [
      { file: "__webpack_require__", line: 23, col: 1, fn: "requireEnsure", code: ["  // dynamic import fails"], highlight: 0, isApp: false },
    ],
    breadcrumbs: [
      { time: "08:01:00", type: "navigation", message: "User visited /dashboard", level: "info" },
      { time: "08:01:01", type: "exception", message: "ChunkLoadError: Loading chunk vendors~main failed.", level: "error" },
    ],
  },
  {
    id: "HPX-1037",
    title: "UnhandledPromiseRejection: JWT expired",
    subtitle: "Auth token expires silently without refresh trigger",
    file: "src/auth/session.ts:55",
    severity: "medium",
    status: "open",
    count: 189,
    users: 67,
    project: "hyperpush-api",
    environment: "production",
    firstSeen: "2d ago",
    lastSeen: "5m ago",
    tags: ["auth", "jwt", "session"],
    stacktrace: [
      { file: "src/auth/session.ts", line: 55, col: 7, fn: "validateSession", code: ["  const decoded = jwt.verify(token, secret)"], highlight: 0, isApp: true },
    ],
    breadcrumbs: [],
  },
  {
    id: "HPX-1036",
    title: "Error: ECONNREFUSED 127.0.0.1:5432",
    subtitle: "Postgres connection refused in serverless function cold start",
    file: "src/db/pool.ts:12",
    severity: "high",
    status: "resolved",
    count: 90,
    users: 0,
    project: "hyperpush-api",
    environment: "staging",
    firstSeen: "3d ago",
    lastSeen: "1d ago",
    tags: ["postgres", "serverless", "cold-start"],
    stacktrace: [],
    breadcrumbs: [],
  },
]

export const MOCK_STATS = {
  totalEvents: 3482,
  affectedUsers: 891,
  mttr: "1h 24m",
  crashFreeSessions: "98.2%",
  openIssues: 24,
  criticalIssues: 3,
  eventsPerMin: 18,
  uptime: "99.8%",
}

export const MOCK_EVENT_SERIES = Array.from({ length: 30 }, (_, i) => ({
  time: `${i * 2}m ago`,
  critical: Math.floor(Math.random() * 40 + 10),
  high: Math.floor(Math.random() * 60 + 20),
  medium: Math.floor(Math.random() * 30 + 5),
  low: Math.floor(Math.random() * 20 + 2),
})).reverse()

export const MOCK_TREASURY = {
  token: "HPX",
  price: 0.0342,
  change: +12.4,
  balance: 14820,
  usdValue: 507.0,
  openBounties: 4,
  paidOut: 1250,
  nextPayout: "~$375",
}

/* ── Performance data ── */

export type VitalRating = "good" | "needs-improvement" | "poor"
export type TransactionStatus = "healthy" | "degraded" | "critical"

export interface Transaction {
  id: string
  name: string
  operation: "http.server" | "pageload" | "navigation" | "resource" | "task"
  project: string
  tpm: number
  p50: number
  p75: number
  p95: number
  p99: number
  failureRate: number
  apdex: number
  users: number
  status: TransactionStatus
  trend: number // percentage change vs previous period, positive = slower
  samples: number
}

export interface WebVital {
  name: string
  abbrev: string
  value: number
  unit: string
  rating: VitalRating
  p75: number
  target: number
  description: string
}

export const MOCK_PERF_STATS = {
  apdex: 0.87,
  tpm: 342,
  p50: 124,
  p75: 287,
  p95: 890,
  p99: 2140,
  failureRate: 2.3,
  throughput: "342/min",
  totalTransactions: 492480,
  slowTransactions: 1247,
  errorRate: 2.3,
}

export const MOCK_WEB_VITALS: WebVital[] = [
  { name: "Largest Contentful Paint", abbrev: "LCP", value: 2.1, unit: "s", rating: "good", p75: 2.4, target: 2.5, description: "Time to render the largest visible content element" },
  { name: "Interaction to Next Paint", abbrev: "INP", value: 180, unit: "ms", rating: "needs-improvement", p75: 220, target: 200, description: "Responsiveness to user interactions" },
  { name: "Cumulative Layout Shift", abbrev: "CLS", value: 0.08, unit: "", rating: "good", p75: 0.12, target: 0.1, description: "Visual stability — unexpected layout movement" },
  { name: "First Contentful Paint", abbrev: "FCP", value: 1.2, unit: "s", rating: "good", p75: 1.6, target: 1.8, description: "Time to first text or image paint" },
  { name: "Time to First Byte", abbrev: "TTFB", value: 380, unit: "ms", rating: "needs-improvement", p75: 480, target: 800, description: "Server response time for the initial request" },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "txn-1", name: "POST /api/v1/events", operation: "http.server", project: "hyperpush-api", tpm: 84, p50: 45, p75: 89, p95: 312, p99: 890, failureRate: 1.2, apdex: 0.94, users: 0, status: "healthy", trend: -2, samples: 121440 },
  { id: "txn-2", name: "GET /api/v1/issues", operation: "http.server", project: "hyperpush-api", tpm: 62, p50: 78, p75: 145, p95: 520, p99: 1240, failureRate: 0.8, apdex: 0.89, users: 0, status: "healthy", trend: 5, samples: 89280 },
  { id: "txn-3", name: "/dashboard", operation: "pageload", project: "hyperpush-web", tpm: 48, p50: 1240, p75: 1890, p95: 3200, p99: 5100, failureRate: 0.3, apdex: 0.72, users: 891, status: "degraded", trend: 18, samples: 69120 },
  { id: "txn-4", name: "GET /api/v1/events/:id", operation: "http.server", project: "hyperpush-api", tpm: 41, p50: 32, p75: 56, p95: 180, p99: 420, failureRate: 2.1, apdex: 0.96, users: 0, status: "healthy", trend: -1, samples: 59040 },
  { id: "txn-5", name: "/feed", operation: "pageload", project: "hyperpush-web", tpm: 38, p50: 1560, p75: 2340, p95: 4100, p99: 6800, failureRate: 4.8, apdex: 0.61, users: 312, status: "critical", trend: 32, samples: 54720 },
  { id: "txn-6", name: "POST /api/v1/auth/refresh", operation: "http.server", project: "hyperpush-api", tpm: 34, p50: 28, p75: 42, p95: 95, p99: 210, failureRate: 0.4, apdex: 0.98, users: 0, status: "healthy", trend: 0, samples: 48960 },
  { id: "txn-7", name: "GET /api/v1/projects/:id/stats", operation: "http.server", project: "hyperpush-api", tpm: 29, p50: 156, p75: 310, p95: 890, p99: 1800, failureRate: 1.5, apdex: 0.82, users: 0, status: "degraded", trend: 12, samples: 41760 },
  { id: "txn-8", name: "/issues/:id", operation: "pageload", project: "hyperpush-web", tpm: 24, p50: 980, p75: 1450, p95: 2800, p99: 4200, failureRate: 0.6, apdex: 0.78, users: 234, status: "healthy", trend: 3, samples: 34560 },
  { id: "txn-9", name: "POST /api/v1/webhooks", operation: "http.server", project: "hyperpush-api", tpm: 18, p50: 210, p75: 420, p95: 1100, p99: 2400, failureRate: 3.2, apdex: 0.74, users: 0, status: "degraded", trend: 8, samples: 25920 },
  { id: "txn-10", name: "solana.signTransaction", operation: "task", project: "hyperpush-solana", tpm: 12, p50: 890, p75: 1340, p95: 3400, p99: 8200, failureRate: 6.1, apdex: 0.58, users: 178, status: "critical", trend: 24, samples: 17280 },
  { id: "txn-11", name: "GET /api/v1/alerts", operation: "http.server", project: "hyperpush-api", tpm: 15, p50: 64, p75: 112, p95: 340, p99: 780, failureRate: 0.2, apdex: 0.93, users: 0, status: "healthy", trend: -4, samples: 21600 },
  { id: "txn-12", name: "/settings", operation: "pageload", project: "hyperpush-web", tpm: 8, p50: 760, p75: 1100, p95: 2100, p99: 3400, failureRate: 0.1, apdex: 0.85, users: 67, status: "healthy", trend: 1, samples: 11520 },
]

// Latency over time — 30 data points for sparklines/charts
export const MOCK_LATENCY_SERIES = Array.from({ length: 30 }, (_, i) => {
  const base = 120 + Math.sin(i * 0.3) * 30
  return {
    time: `${(29 - i) * 2}m`,
    p50: Math.floor(base + Math.random() * 20),
    p75: Math.floor(base * 1.8 + Math.random() * 40),
    p95: Math.floor(base * 3.5 + Math.random() * 100),
    p99: Math.floor(base * 6 + Math.random() * 200),
  }
})

// Throughput over time
export const MOCK_THROUGHPUT_SERIES = Array.from({ length: 30 }, (_, i) => {
  const hour = i % 24
  const base = hour >= 8 && hour <= 20 ? 340 : 120
  return {
    time: `${(29 - i) * 2}m`,
    tpm: Math.floor(base + Math.random() * 60 - 30),
    errors: Math.floor((base * 0.023) + Math.random() * 4),
  }
})

// Apdex over time
export const MOCK_APDEX_SERIES = Array.from({ length: 30 }, (_, i) => ({
  time: `${(29 - i) * 2}m`,
  apdex: Math.min(1, Math.max(0.5, 0.87 + Math.sin(i * 0.2) * 0.06 + (Math.random() - 0.5) * 0.04)),
}))
