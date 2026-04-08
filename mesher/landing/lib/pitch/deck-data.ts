/* ------------------------------------------------------------------
 *  Pitch Deck Data — investor-grade slide content
 *  10 slides following the Sequoia / YC structure
 * ----------------------------------------------------------------- */

export type SlideLayout =
  | 'title'
  | 'problem'
  | 'solution'
  | 'product'
  | 'technology'
  | 'market'
  | 'business-model'
  | 'traction'
  | 'team'
  | 'ask'

export interface SlideMetric {
  label: string
  value: string
}

export interface SlideData {
  id: string
  layout: SlideLayout
  eyebrow: string
  title: string
  subtitle?: string
  body?: string
  bullets?: readonly string[]
  metrics?: readonly SlideMetric[]
  /** Extra structured payload per layout — type-narrowed by layout */
  extra?: Record<string, unknown>
}

export interface DeckData {
  routeTitle: string
  routeDescription: string
  slides: readonly SlideData[]
}

export const deckData: DeckData = {
  routeTitle: 'hyperpush — Investor Pitch Deck',
  routeDescription:
    'Open-source error tracking backed by a compiled runtime moat and token-funded bug resolution.',
  slides: [
    /* 1 — Title */
    {
      id: 'title',
      layout: 'title',
      eyebrow: 'hyperpush',
      title: 'The incident workflow\nteams can trust.',
      subtitle:
        'Open-source error tracking with actor isolation, cluster failover, and token-funded bug fixes.',
      metrics: [
        { label: 'Category', value: 'Error Tracking' },
        { label: 'Moat', value: 'Mesh Runtime' },
        { label: 'Model', value: 'Open-core + Tokens' },
      ],
    },

    /* 2 — Problem */
    {
      id: 'problem',
      layout: 'problem',
      eyebrow: 'The problem',
      title: 'Error tracking is expensive, brittle, and disconnected from fixes.',
      bullets: [
        'Teams pay $29–89/seat/mo for dashboards that show problems but never resolve them.',
        'One malformed event can stall the entire ingestion pipeline — no isolation.',
        'Bug backlogs grow indefinitely because triage is unpriced labor.',
      ],
      metrics: [
        { label: 'Avg spend', value: '$50k+/yr' },
        { label: 'Mean backlog', value: '3,200 issues' },
        { label: 'Fix rate', value: '<12%' },
      ],
    },

    /* 3 — Solution */
    {
      id: 'solution',
      layout: 'solution',
      eyebrow: 'The solution',
      title: 'hyperpush: ingest, isolate, assign, and fund the fix.',
      subtitle:
        'An open-source error tracking pipeline where every surfaced bug becomes funded work — not dead backlog.',
      bullets: [
        'Self-hosted ingestion with per-event actor isolation — no cascading failures.',
        'Automatic grouping, severity ranking, and ownership assignment.',
        'Token flywheel turns error visibility into contributor-funded resolution.',
      ],
    },

    /* 4 — Product */
    {
      id: 'product',
      layout: 'product',
      eyebrow: 'The product',
      title: 'Ship, capture, resolve — in one workflow.',
      body: 'A deployable error-tracking pipeline that replaces fragile SaaS with an inspectable, self-hosted system. Events in, accountable incident work out.',
      extra: {
        panels: [
          {
            icon: 'capture',
            label: 'Capture',
            text: 'SDK + HTTP ingestion for every environment.',
          },
          {
            icon: 'group',
            label: 'Group',
            text: 'Fingerprint-based dedup and severity scoring.',
          },
          {
            icon: 'assign',
            label: 'Assign',
            text: 'Automatic ownership routing to the right team.',
          },
          {
            icon: 'resolve',
            label: 'Resolve',
            text: 'Token-funded bounties close the loop.',
          },
        ],
        image: '/promo-performance.png',
      },
    },

    /* 5 — Technology Moat */
    {
      id: 'technology',
      layout: 'technology',
      eyebrow: 'Technology moat',
      title: "Mesh: the runtime advantage you can\u2019t bolt on.",
      subtitle:
        'A compiled language with actor isolation, cluster-native failover, and operator-visible recovery — baked into every process.',
      extra: {
        pillars: [
          {
            icon: 'shield',
            label: 'Actor Isolation',
            title: 'One bad event never stalls the queue.',
            detail:
              'Each event runs in its own lightweight actor. Crashes are contained, not cascaded.',
          },
          {
            icon: 'refresh',
            label: 'Cluster Failover',
            title: 'Nodes recover without operator intervention.',
            detail:
              'Continuity state replicates across the cluster. Promotion and recovery happen at the runtime level.',
          },
          {
            icon: 'zap',
            label: 'Compiled Performance',
            title: 'Native throughput, not interpreter overhead.',
            detail:
              'Mesh compiles to native code via LLVM. No JIT warmup, no GC pauses, no cold-start tax.',
          },
        ],
      },
    },

    /* 6 — Market */
    {
      id: 'market',
      layout: 'market',
      eyebrow: 'Market size',
      title: 'A $4.2B market with consolidation pressure.',
      metrics: [
        { label: 'TAM', value: '$4.2B' },
        { label: 'SAM', value: '$1.1B' },
        { label: 'SOM', value: '$120M' },
      ],
      extra: {
        segments: [
          {
            label: 'TAM',
            value: '$4.2B',
            detail: 'Global application performance monitoring and error tracking.',
          },
          {
            label: 'SAM',
            value: '$1.1B',
            detail: 'Teams actively evaluating self-hosted or open-source alternatives.',
          },
          {
            label: 'SOM',
            value: '$120M',
            detail: 'Developer teams willing to adopt a runtime-native error platform.',
          },
        ],
      },
    },

    /* 7 — Business Model */
    {
      id: 'business-model',
      layout: 'business-model',
      eyebrow: 'Business model',
      title: 'Open core + token economics.',
      extra: {
        tiers: [
          {
            name: 'Community',
            price: 'Free',
            detail: 'Self-hosted, full pipeline, unlimited events.',
          },
          {
            name: 'Pro',
            price: '$29/mo',
            detail: 'Team dashboards, SLA alerting, priority support.',
          },
          {
            name: 'Pro+',
            price: '$100/mo',
            detail: 'Multi-cluster, SSO, audit logs, dedicated onboarding.',
          },
        ],
        flywheel: [
          { step: 'Detect', text: 'Errors surface through the product.' },
          { step: 'Fund', text: 'Token treasury accrues per-project.' },
          { step: 'Fix', text: 'Contributors claim funded bounties.' },
          { step: 'Retain', text: 'Healthier software compounds adoption.' },
        ],
        image: '/promo-flywheel.png',
      },
    },

    /* 8 — Traction */
    {
      id: 'traction',
      layout: 'traction',
      eyebrow: 'Traction',
      title: 'Early but legible — built in public.',
      bullets: [
        'Public repo with deployable examples and clustered proof surfaces.',
        'Working compiler, runtime, package manager, and LSP.',
        'Documentation site, installer, and editor integrations shipped.',
      ],
      metrics: [
        { label: 'Compiler', value: 'Shipped' },
        { label: 'Clustering', value: 'Proven' },
        { label: 'Package mgr', value: 'Live' },
        { label: 'Distribution', value: 'Public' },
      ],
    },

    /* 9 — Team */
    {
      id: 'team',
      layout: 'team',
      eyebrow: 'The team',
      title: 'Runtime + product in one execution loop.',
      extra: {
        members: [
          {
            role: 'Founder & Runtime Engineer',
            focus:
              'Compiler, clustering, and continuity surfaces ship alongside the product story.',
          },
        ],
        strengths: [
          'Compiler through frontend in one team.',
          'Shipping public proof surfaces, not slide decks.',
          'Open source by default — every claim is inspectable.',
        ],
      },
    },

    /* 10 — The Ask */
    {
      id: 'ask',
      layout: 'ask',
      eyebrow: 'The ask',
      title: 'Back the wedge that proves Mesh in-market.',
      subtitle:
        'hyperpush wins now on product. Mesh widens the moat over time.',
      extra: {
        asks: [
          {
            label: 'Back the product',
            detail:
              'Fund the fastest path to adoption: a better open-source incident workflow with a visible runtime edge.',
          },
          {
            label: 'Back the moat',
            detail:
              'Use hyperpush to prove that Mesh-native behavior matters commercially, not just technically.',
          },
          {
            label: 'Back the loop',
            detail:
              'Turn bug resolution into a compounding motion instead of a backlog sink.',
          },
        ],
        close:
          'hyperpush is the product that wins now. Mesh is the reason the upside keeps widening.',
      },
    },
  ],
}
