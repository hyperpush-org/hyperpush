# Support

## Start here

Before opening an issue, check the nearest maintainer surface first:

- Mesher maintainer runbook: [`mesher/README.md`](mesher/README.md)
- product-root Mesher verifier: `bash scripts/verify-m051-s01.sh`
- landing/root-surface verifier: `bash scripts/verify-landing-surface.sh`
- Mesh language/tooling docs: https://meshlang.dev/docs/getting-started/ and https://meshlang.dev/docs/tooling/

## When to open an issue

Use issues for:

- reproducible Mesher defects
- landing/frontend-exp bugs
- product repo CI/deploy problems
- product docs/runbook drift

Include:

- commit SHA
- the smallest truthful reproduction
- logs, screenshots, or verifier output when relevant
- whether the failure happened in `mesher/`, `mesher/landing/`, or `mesher/frontend-exp/`

## Security issues

Do not report security vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).
