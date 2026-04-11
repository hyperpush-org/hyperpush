# Mesher client dashboard

This package is the canonical TanStack dashboard app for Mesher.

It runs as a Vite-powered TanStack Start app from `hyperpush-mono/mesher/client/` and stays on the existing mock-data and client-state contract. Do not add backend calls, server functions, or widened URL/search-param semantics here as part of path-migration work.

## Package root

```text
hyperpush-mono/
  mesher/
    client/
```

## Maintainer workflow

From the product repo root:

```bash
npm --prefix mesher/client ci
npm --prefix mesher/client run dev
npm --prefix mesher/client run build
PORT=3001 npm --prefix mesher/client run start
npm --prefix mesher/client run test:e2e:dev
npm --prefix mesher/client run test:e2e:prod
```

From this package directory:

```bash
npm ci
vite dev
vite build
node server.mjs
npm run test:e2e:dev
npm run test:e2e:prod
```

## Runtime contract

- `vite dev` starts the local dashboard dev server on port `3000` by default.
- `vite build` produces the production bundle in `dist/`.
- `node server.mjs` serves the built app and static assets from `dist/client`.
- `test:e2e:dev` verifies the direct-entry route and shell-state parity against the dev server.
- `test:e2e:prod` verifies the same parity contract against the built production server.

## Important files

- `src/routes/` — TanStack route tree for the dashboard shell and direct-entry pages.
- `src/router.tsx` and `src/routeTree.gen.ts` — router assembly.
- `server.mjs` — package-local production bridge for the built app.
- `playwright.config.ts` — package-local dev/prod Playwright harness.
- `tests/e2e/dashboard-route-parity.spec.ts` — route/UI parity proof on mock data.
- `app/globals.css` — shared global styles imported by the TanStack root route.

## Verification notes

The canonical proof surface for this package is package-local:

```bash
npm --prefix mesher/client run build
npm --prefix mesher/client run test:e2e:dev
npm --prefix mesher/client run test:e2e:prod
```

When a move or refactor breaks the package contract, expect the first signal to appear as one of:

- a missing file under `mesher/client/`
- a broken `dev`, `build`, `start`, or `test:e2e:*` script
- a Playwright console/request failure in `tests/e2e/dashboard-route-parity.spec.ts`
- a `node server.mjs` boot failure after build
