---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T04: Add bounded README/tooling discoverability for the green assembled verifier

Once the assembled verifier is actually green, add minimal discoverability for `bash scripts/verify-m049-s05.sh` in `README.md` and `website/docs/docs/tooling/index.md`.

1. Add one bounded README mention and one tooling-doc mention for the assembled verifier.
2. Keep the public wording narrow: scaffold/examples-first onboarding, SQLite stays local while Postgres is the clustered path, and historical clustered proof rails remain subordinate retained surfaces.
3. Extend the existing Node contract test so missing verifier text or a collapsed SQLite/Postgres split fails closed.
4. Avoid turning historical proof rails into a second public onboarding entrypoint.

## Inputs

- `README.md`
- `website/docs/docs/tooling/index.md`
- `scripts/tests/verify-m048-s05-contract.test.mjs`
- `scripts/tests/verify-m049-s05-contract.test.mjs`

## Expected Output

- `README.md`
- `website/docs/docs/tooling/index.md`
- `scripts/tests/verify-m049-s05-contract.test.mjs`

## Verification

node --test scripts/tests/verify-m049-s05-contract.test.mjs

## Observability Impact

Extends the existing Node contract so public-verifier wording drift names the missing verifier marker or collapsed SQLite/Postgres split directly instead of silently disappearing from docs.
