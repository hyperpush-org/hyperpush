# Hyperpush Mono

This repo is the product-owned extraction root for Hyperpush in the blessed two-repo workspace. It owns Mesher, the landing app, and the repo-root maintainer surfaces that belong with them.

## Blessed sibling workspace

```text
<workspace>/
  mesh-lang/
  hyperpush-mono/
    mesher/
    mesher/landing/
```

The blessed extracted package root is `hyperpush-mono/mesher/...`.
Do not flatten the product package to `<workspace>/mesher`.

## Repo-root maintainer surfaces

- `mesher/README.md` — Mesher maintainer runbook
- `bash mesher/scripts/verify-maintainer-surface.sh` — product-owned Mesher proof replay from the product repo root
- `bash scripts/verify-landing-surface.sh` — product-owned landing/root-surface verifier from the product repo root
- `.github/workflows/deploy-landing.yml` — landing build/deploy workflow contract
- `.github/dependabot.yml` — product-owned dependency update contract

## Product repo identity

Canonical product repo URL: https://github.com/hyperpush-org/hyperpush-mono

The landing app keeps its public GitHub links pointed at that product repo through `mesher/landing/lib/external-links.ts`.
