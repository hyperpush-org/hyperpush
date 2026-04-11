import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test'

const devPort = 3000
const prodPort = 3001

type NamedProject = NonNullable<PlaywrightTestConfig['projects']>[number] & {
  name: string
}

type NamedWebServer = NonNullable<PlaywrightTestConfig['webServer']>[number] & {
  name: string
}

function parseBaseUrl(name: string, value: string, expectedPort: number) {
  const parsedBaseUrl = new URL(value)

  if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
    throw new Error(`Invalid ${name} protocol: ${parsedBaseUrl.protocol}`)
  }

  if (!['', '/'].includes(parsedBaseUrl.pathname)) {
    throw new Error(`${name} must point at the app origin, received path ${parsedBaseUrl.pathname}`)
  }

  if (parsedBaseUrl.hostname !== '127.0.0.1' && parsedBaseUrl.hostname !== 'localhost') {
    throw new Error(`${name} must target localhost or 127.0.0.1, received host ${parsedBaseUrl.hostname}`)
  }

  if (parsedBaseUrl.port !== String(expectedPort)) {
    throw new Error(`${name} must target port ${expectedPort}, received ${parsedBaseUrl.port || '(default)'}`)
  }

  return parsedBaseUrl
}

function selectNamedItems<T extends { name: string }>(
  kind: string,
  items: T[],
  requestedProjectName: string | null,
) {
  if (!requestedProjectName) {
    return items
  }

  const selectedItem = items.find((item) => item.name === requestedProjectName)

  if (!selectedItem) {
    throw new Error(
      `Unknown ${kind} project "${requestedProjectName}". Expected one of: ${items
        .map((item) => item.name)
        .join(', ')}`,
    )
  }

  return [selectedItem]
}

// `npm exec playwright test ... --project=dev` leaks the selection through npm_config_project
// instead of forwarding the flag to Playwright unless the caller inserts `--`. Honor that env
// here so the exact repo verification commands still start only the requested environment.
const requestedProjectName =
  process.env.PLAYWRIGHT_PROJECT?.trim() || process.env.npm_config_project?.trim() || null

const devBaseUrl = parseBaseUrl(
  'PLAYWRIGHT_BASE_URL',
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${devPort}`,
  devPort,
)
const prodBaseUrl = parseBaseUrl(
  'PLAYWRIGHT_PROD_BASE_URL',
  process.env.PLAYWRIGHT_PROD_BASE_URL ?? `http://127.0.0.1:${prodPort}`,
  prodPort,
)

const projects: NamedProject[] = [
  {
    name: 'dev',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: devBaseUrl.toString(),
    },
  },
  {
    name: 'prod',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: prodBaseUrl.toString(),
    },
  },
]

const webServers: NamedWebServer[] = [
  {
    name: 'dev',
    command: `env -u npm_config_project npm run dev -- --host 127.0.0.1 --port ${devPort}`,
    port: devPort,
    timeout: 30_000,
    reuseExistingServer: false,
  },
  {
    name: 'prod',
    command: `env -u npm_config_project npm run build && env -u npm_config_project PORT=${prodPort} npm run start`,
    port: prodPort,
    timeout: 60_000,
    reuseExistingServer: false,
  },
]

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: selectNamedItems('Playwright', projects, requestedProjectName),
  webServer: selectNamedItems('web server', webServers, requestedProjectName).map(
    ({ name: _name, ...server }) => server,
  ),
})
