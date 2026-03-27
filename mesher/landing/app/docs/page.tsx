"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronRight, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/* ------------------------------------------------------------------ */
/*  Sidebar navigation data                                           */
/* ------------------------------------------------------------------ */

const sidebarSections = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", slug: "introduction", active: true },
      { title: "Quick Start", slug: "quick-start" },
      { title: "Installation", slug: "installation" },
      { title: "Configuration", slug: "configuration" },
    ],
  },
  {
    title: "SDKs",
    items: [
      { title: "JavaScript / TypeScript", slug: "sdk-javascript" },
      { title: "Rust", slug: "sdk-rust" },
      { title: "Python", slug: "sdk-python" },
      { title: "Node.js", slug: "sdk-node" },
      { title: "Mesh", slug: "sdk-mesh" },
    ],
  },
  {
    title: "Solana",
    items: [
      { title: "Program Monitoring", slug: "solana-program-monitoring" },
      { title: "Transaction Errors", slug: "solana-transaction-errors" },
      { title: "CPI Failures", slug: "solana-cpi-failures" },
    ],
  },
  {
    title: "Token Economics",
    items: [
      { title: "Project Tokens", slug: "project-tokens" },
      { title: "Treasury & Revenue", slug: "treasury-revenue" },
      { title: "Bounty System", slug: "bounty-system" },
    ],
  },
  {
    title: "Bug Board",
    items: [
      { title: "Public Board Setup", slug: "public-board-setup" },
      { title: "Bounty Lifecycle", slug: "bounty-lifecycle" },
      { title: "PR Verification", slug: "pr-verification" },
    ],
  },
  {
    title: "Platform",
    items: [
      { title: "Alerts & Notifications", slug: "alerts" },
      { title: "Integrations", slug: "integrations" },
      { title: "Self-Hosting", slug: "self-hosting" },
      { title: "API Reference", slug: "api-reference" },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                 */
/* ------------------------------------------------------------------ */

function Sidebar({ className = "", onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <nav className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground">
          <Search className="w-4 h-4 shrink-0" />
          <span>Search docs…</span>
          <kbd className="ml-auto text-xs font-mono bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </div>
      </div>
      {sidebarSections.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="text-xs font-mono text-accent uppercase tracking-wider mb-2 px-3">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.slug}>
                <a
                  href={`#${item.slug}`}
                  onClick={onNavigate}
                  className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                    item.active
                      ? "text-foreground bg-muted font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Code block component                                              */
/* ------------------------------------------------------------------ */

function CodeBlock({
  title,
  language,
  children,
}: {
  title?: string
  language: string
  children: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden my-6">
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-chart-4/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/80" />
          </div>
          <span className="text-xs text-muted-foreground ml-1 font-mono">{title}</span>
          <span className="ml-auto text-xs text-muted-foreground/60 font-mono">{language}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Callout                                                           */
/* ------------------------------------------------------------------ */

function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "tip"
  title: string
  children: React.ReactNode
}) {
  const styles = {
    info: "border-accent/30 bg-accent/5",
    warning: "border-chart-4/30 bg-chart-4/5",
    tip: "border-chart-2/30 bg-chart-2/5",
  }
  const icons = {
    info: "💡",
    warning: "⚠️",
    tip: "✦",
  }
  return (
    <div className={`rounded-xl border p-5 my-6 ${styles[type]}`}>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2">
        <span>{icons[type]}</span>
        {title}
      </p>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step component                                                    */
/* ------------------------------------------------------------------ */

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative flex gap-6 mb-8 last:mb-0">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-mono text-accent font-bold shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="pb-8 last:pb-0 flex-1 min-w-0">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Feature card for SDK section                                      */
/* ------------------------------------------------------------------ */

function SDKCard({ name, status, description }: { name: string; status: string; description: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-background hover:bg-card transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{name}</h4>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
          status === "Stable"
            ? "text-accent bg-accent/10"
            : status === "Beta"
            ? "text-chart-4 bg-chart-4/10"
            : "text-muted-foreground bg-muted"
        }`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Table of contents                                                 */
/* ------------------------------------------------------------------ */

const tocItems = [
  { title: "Overview", slug: "overview" },
  { title: "Quick Start", slug: "quick-start-section" },
  { title: "SDKs", slug: "sdks" },
  { title: "Solana Integration", slug: "solana-integration" },
  { title: "Token Economics", slug: "token-economics" },
  { title: "Bug Board", slug: "bug-board-section" },
  { title: "Self-Hosting", slug: "self-hosting-section" },
  { title: "API Reference", slug: "api-reference-section" },
]

function TableOfContents() {
  return (
    <div className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-28">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">On this page</p>
        <ul className="space-y-1.5">
          {tocItems.map((item) => (
            <li key={item.slug}>
              <a
                href={`#${item.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main docs page                                                    */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---- Top header ---- */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-[1440px] px-6 py-4">
          <div className="flex items-center justify-between rounded-full border border-border bg-background/80 backdrop-blur-md px-6 py-3">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo-light.svg" alt="hyperpush" className="h-7" />
              <span className="text-sm text-muted-foreground font-mono">/docs</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/docs" className="text-sm text-foreground font-medium">Docs</Link>
              <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs font-mono">
                <Search className="w-3.5 h-3.5" />
                Search
                <kbd className="ml-1 text-[10px] bg-muted px-1 py-0.5 rounded border border-border">⌘K</kbd>
              </Button>
              <Button size="sm">Join Waitlist</Button>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* ---- Mobile sidebar overlay ---- */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-background border-r border-border p-6 pt-20 overflow-y-auto md:hidden"
            >
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---- Main layout ---- */}
      <div className="max-w-[1440px] mx-auto px-6 pt-28 flex gap-0">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-12">
            <Sidebar />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-24 md:pl-8 xl:pr-8">
          <div className="flex gap-12">
            <article className="flex-1 min-w-0 max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
                <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground">Introduction</span>
              </div>

              {/* Page title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" id="overview">
                  hyperpush Documentation
                </h1>
                <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-2xl">
                  Open-source error tracking for web apps and Solana programs. Token economics fund projects
                  and pay developers who fix bugs.
                </p>
              </motion.div>

              <div className="h-px bg-border mb-12" />

              {/* ---- Quick Start ---- */}
              <section className="mb-16" id="quick-start-section">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">Quick Start</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Up and running in 3 minutes
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  Install the SDK, configure your DSN, and start capturing errors. That's it — no
                  complex setup, no separate infrastructure.
                </p>

                <Step number="1" title="Install the SDK">
                  <p className="text-muted-foreground mb-3">
                    Add the hyperpush SDK to your project using your preferred package manager.
                  </p>
                  <CodeBlock title="Terminal" language="bash">{`npm install @hyperpush/sdk`}</CodeBlock>
                </Step>

                <Step number="2" title="Initialize in your app">
                  <p className="text-muted-foreground mb-3">
                    Import and initialize hyperpush as early as possible in your application's entry point.
                  </p>
                  <CodeBlock title="app.ts" language="typescript">{`import { hyperpush } from "@hyperpush/sdk"

hyperpush.init({
  dsn: "https://your-project-id@ingest.hyperpush.dev",
  
  // Optional: environment tagging
  environment: "production",
  
  // Optional: performance monitoring
  tracesSampleRate: 0.1,
  
  // Optional: Solana program monitoring
  solana: {
    programIds: ["YourProgram111..."],
    rpcEndpoint: "https://api.mainnet-beta.solana.com",
  },
})`}</CodeBlock>
                </Step>

                <Step number="3" title="Verify it works">
                  <p className="text-muted-foreground mb-3">
                    Trigger a test error to confirm events are flowing to your dashboard.
                  </p>
                  <CodeBlock title="test.ts" language="typescript">{`// Fire a test event
hyperpush.captureMessage("Hello from hyperpush!")

// Or capture an actual error
try {
  throw new Error("Test error for hyperpush")
} catch (err) {
  hyperpush.captureException(err)
}`}</CodeBlock>
                  <Callout type="tip" title="Check your dashboard">
                    After running this, head to your hyperpush dashboard. You should see the test event within a few seconds.
                  </Callout>
                </Step>
              </section>

              {/* ---- SDKs ---- */}
              <section className="mb-16" id="sdks">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">SDKs</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Platform SDKs
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  Official SDKs for every major runtime. Each provides error capture, breadcrumbs, context
                  enrichment, and performance tracing out of the box.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  <SDKCard
                    name="JavaScript / TypeScript"
                    status="Stable"
                    description="Browser and edge runtimes. Automatic error boundary detection, session replays, and performance monitoring."
                  />
                  <SDKCard
                    name="Node.js"
                    status="Stable"
                    description="Server-side capture with Express/Fastify middleware, unhandled rejection tracking, and async context."
                  />
                  <SDKCard
                    name="Rust"
                    status="Beta"
                    description="Panic hooks, Result error capture, and Solana program integration with instruction-level tracing."
                  />
                  <SDKCard
                    name="Python"
                    status="Beta"
                    description="Django / Flask / FastAPI middleware, exception hooks, and structured logging integration."
                  />
                  <SDKCard
                    name="Mesh"
                    status="Beta"
                    description="Native Mesh SDK with actor-level error isolation, process crash reporting, and supervision tree visibility."
                  />
                </div>

                <Callout type="info" title="Community SDKs">
                  We welcome community-maintained SDKs for other languages. Check the GitHub repo for the
                  SDK spec and contribution guide.
                </Callout>
              </section>

              {/* ---- Solana Integration ---- */}
              <section className="mb-16" id="solana-integration">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">Solana</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Solana Program Monitoring
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  First-class error tracking for Solana programs. Surface transaction failures, CPI call
                  errors, and RPC timeouts with full program log context.
                </p>

                <CodeBlock title="hyperpush.config.ts" language="typescript">{`export default {
  solana: {
    // Programs to monitor
    programIds: [
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      "YourCustomProgram111111111111111111111111",
    ],
    
    // RPC endpoints (primary + fallback)
    rpcEndpoints: [
      "https://api.mainnet-beta.solana.com",
      "https://your-rpc-provider.com",
    ],
    
    // Error classification
    classify: {
      // Group by instruction type
      groupByInstruction: true,
      // Track CPI depth
      trackCPIChain: true,
      // Capture program logs
      captureLogs: true,
    },
    
    // Alerting thresholds
    alerts: {
      failureRateThreshold: 0.05,  // 5% failure rate
      windowSeconds: 300,           // 5 minute window
    },
  },
}`}</CodeBlock>

                <div className="grid sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden my-8">
                  {[
                    { label: "Transaction Failures", desc: "Automatic capture of failed transactions with decoded instruction data" },
                    { label: "CPI Call Chains", desc: "Full cross-program invocation tracing with depth tracking" },
                    { label: "RPC Diagnostics", desc: "Timeout detection, rate limit monitoring, and endpoint health" },
                  ].map((item) => (
                    <div key={item.label} className="bg-background p-6">
                      <h4 className="font-semibold text-sm mb-2">{item.label}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- Token Economics ---- */}
              <section className="mb-16" id="token-economics">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">Economics</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Token Economics
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  Each hyperpush project can launch a token at no cost. A portion of trading activity flows back into
                  the project treasury — funding bounties, development, and maintenance automatically.
                </p>

                <div className="rounded-xl border border-border overflow-hidden mb-8">
                  <div className="overflow-x-auto">
                  <div className="grid grid-cols-3 gap-px bg-border min-w-[420px]">
                    <div className="bg-muted/50 p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">Flow</div>
                    <div className="bg-muted/50 p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">Source</div>
                    <div className="bg-muted/50 p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">Destination</div>
                  </div>
                  {[
                    { flow: "Trading Fee", source: "Token trades", dest: "Project Treasury" },
                    { flow: "Bounty Payout", source: "Project Treasury", dest: "Developer Wallet" },
                    { flow: "Protocol Fee", source: "Token trades", dest: "hyperpush Protocol" },
                  ].map((row) => (
                    <div key={row.flow} className="grid grid-cols-3 gap-px bg-border min-w-[420px]">
                      <div className="bg-background p-4 text-sm font-medium">{row.flow}</div>
                      <div className="bg-background p-4 text-sm text-muted-foreground">{row.source}</div>
                      <div className="bg-background p-4 text-sm text-muted-foreground">{row.dest}</div>
                    </div>
                  ))}
                  </div> {/* end overflow-x-auto */}
                </div>

                <Callout type="info" title="No upfront cost">
                  Token launches are free. Revenue flows start automatically from trading activity — you don't
                  need to fund anything manually.
                </Callout>
              </section>

              {/* ---- Bug Board ---- */}
              <section className="mb-16" id="bug-board-section">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">Bug Board</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Public Bug Board
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  Opt in to surface errors publicly with bounties attached. Community developers can browse
                  live bugs, claim a bounty, submit a fix, and get paid when verified.
                </p>

                <CodeBlock title="hyperpush.config.ts" language="typescript">{`export default {
  bugBoard: {
    // Enable public bug board
    enabled: true,
    
    // Auto-assign bounties based on severity
    bounties: {
      critical: 100,  // $100 in project tokens
      high: 50,
      medium: 25,
      low: 10,
    },
    
    // Require approval before publishing
    requireApproval: true,
    
    // GitHub integration for PR verification
    github: {
      repo: "your-org/your-repo",
      autoVerify: true,
    },
  },
}`}</CodeBlock>

                <h3 className="text-xl font-semibold mb-4 mt-10">Bounty Lifecycle</h3>
                <div className="space-y-3">
                  {[
                    { step: "Error Detected", desc: "hyperpush captures and classifies the error from your application." },
                    { step: "Bounty Assigned", desc: "Based on severity rules, a token bounty is automatically attached." },
                    { step: "Published to Board", desc: "After optional approval, the bug appears on your public board." },
                    { step: "Developer Claims", desc: "A community developer claims the bounty and begins working." },
                    { step: "PR Submitted", desc: "The developer submits a pull request referencing the error ID." },
                    { step: "Verified & Paid", desc: "Your team merges the PR, hyperpush confirms the fix, and the bounty is distributed." },
                  ].map((item, i) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-mono text-accent shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.step}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- Self-Hosting ---- */}
              <section className="mb-16" id="self-hosting-section">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">Deploy</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Self-Hosting
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  hyperpush is fully open-source and self-hostable. Run it on your own infrastructure with
                  Docker Compose or deploy to Kubernetes.
                </p>

                <CodeBlock title="Terminal" language="bash">{`# Clone the repository
git clone https://github.com/hyperpush-dev/hyperpush.git
cd hyperpush

# Start with Docker Compose
docker compose up -d

# hyperpush is now running at http://localhost:8080
# Default admin: admin@hyperpush.local / changeme`}</CodeBlock>

                <Callout type="warning" title="Production deployment">
                  For production, configure external PostgreSQL, Redis, and a reverse proxy with TLS.
                  See the full deployment guide for recommended settings.
                </Callout>

                <h3 className="text-xl font-semibold mb-4 mt-10">System Requirements</h3>
                <div className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
                  {[
                    { label: "CPU", value: "2+ cores" },
                    { label: "Memory", value: "4 GB minimum" },
                    { label: "Storage", value: "20 GB + event volume" },
                    { label: "Runtime", value: "Docker 24+ / K8s 1.28+" },
                  ].map((item) => (
                    <div key={item.label} className="bg-background p-5">
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- API Reference ---- */}
              <section className="mb-16" id="api-reference-section">
                <p className="text-sm font-mono text-accent mb-4 uppercase tracking-wider">API</p>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  API Reference
                </h2>
                <p className="text-muted-foreground mb-8 text-pretty">
                  The hyperpush REST API provides programmatic access to errors, projects, bounties, and
                  token operations. All endpoints require an API key.
                </p>

                <div className="rounded-xl border border-border overflow-hidden">
                  {[
                    { method: "GET", path: "/api/v1/projects", desc: "List all projects" },
                    { method: "GET", path: "/api/v1/errors", desc: "List errors with filtering" },
                    { method: "POST", path: "/api/v1/errors/{id}/resolve", desc: "Mark an error as resolved" },
                    { method: "GET", path: "/api/v1/bounties", desc: "List active bounties" },
                    { method: "POST", path: "/api/v1/bounties/{id}/claim", desc: "Claim a bounty" },
                    { method: "GET", path: "/api/v1/treasury/balance", desc: "Get treasury balance" },
                  ].map((endpoint, i) => (
                    <div
                      key={endpoint.path}
                      className={`flex items-center gap-4 p-4 ${
                        i < 5 ? "border-b border-border" : ""
                      } hover:bg-card/50 transition-colors`}
                    >
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        endpoint.method === "GET"
                          ? "text-accent bg-accent/10"
                          : "text-chart-4 bg-chart-4/10"
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground ml-auto hidden sm:block">{endpoint.desc}</span>
                    </div>
                  ))}
                </div>

                <CodeBlock title="Example: List errors" language="bash">{`curl -H "Authorization: Bearer msh_your_api_key" \\
  https://api.hyperpush.dev/v1/errors?status=unresolved&limit=10`}</CodeBlock>
              </section>

              {/* ---- Bottom nav ---- */}
              <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
                <div />
                <Link
                  href="#quick-start-section"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  Quick Start
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </article>

            {/* Table of contents */}
            <TableOfContents />
          </div>
        </div>
      </div>
    </div>
  )
}
