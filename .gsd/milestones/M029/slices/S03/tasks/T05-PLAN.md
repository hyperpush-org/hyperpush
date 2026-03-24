---
estimated_steps: 4
estimated_files: 8
skills_used:
  - lint
  - debug-like-expert
---

# T05: Canonicalize Mesher service modules with the fixed formatter

**Slice:** S03 — Multiline imports and final formatter compliance
**Milestone:** M029

## Description

Run the third bounded formatter wave across `mesher/services/`. This task accepts the known mechanical canonicalization in the eight service modules while proving that the multiline imports added in `project.mpl` and `user.mpl` survive the real formatter unchanged.

## Steps

1. Read the eight `mesher/services/*.mpl` files so the formatter wave is reviewed against the real service-layer source rather than treated as anonymous churn.
2. Run `cargo run -q -p meshc -- fmt mesher/services` to move the service layer onto canonical formatter output.
3. Inspect the diffs, with special attention to `mesher/services/project.mpl`, `mesher/services/user.mpl`, and any dotted module paths emitted by the formatter.
4. Verify the service group is formatter-clean and that no long single-line or spaced dotted imports reappeared.

## Must-Haves

- [ ] All eight `mesher/services/*.mpl` files are on canonical formatter output.
- [ ] `mesher/services/project.mpl` and `mesher/services/user.mpl` retain parenthesized multiline imports after formatting.
- [ ] This task stays a source canonicalization pass inside `mesher/services/`; it does not drift into compiler edits or unrelated refactors.

## Verification

- `cargo run -q -p meshc -- fmt mesher/services && cargo run -q -p meshc -- fmt --check mesher/services`
- `! rg -n '^from .{121,}' mesher/services/project.mpl mesher/services/user.mpl && ! rg -n '^from .*\. ' mesher/services -g '*.mpl'`

## Inputs

- `mesher/services/event_processor.mpl` — formatter-red service file
- `mesher/services/org.mpl` — formatter-red service file
- `mesher/services/project.mpl` — T02 multiline import plus formatter-red service file
- `mesher/services/rate_limiter.mpl` — formatter-red service file
- `mesher/services/retention.mpl` — formatter-red service file
- `mesher/services/stream_manager.mpl` — formatter-red service file
- `mesher/services/user.mpl` — T02 multiline import plus formatter-red service file
- `mesher/services/writer.mpl` — formatter-red service file

## Expected Output

- `mesher/services/event_processor.mpl` — canonical formatter output for the service module
- `mesher/services/org.mpl` — canonical formatter output for the service module
- `mesher/services/project.mpl` — canonical formatter output with multiline import preserved
- `mesher/services/rate_limiter.mpl` — canonical formatter output for the service module
- `mesher/services/retention.mpl` — canonical formatter output for the service module
- `mesher/services/stream_manager.mpl` — canonical formatter output for the service module
- `mesher/services/user.mpl` — canonical formatter output with multiline import preserved
- `mesher/services/writer.mpl` — canonical formatter output for the service module

## Observability Impact

- Runtime signals changed: none. This task is limited to Mesher service-layer source-shape canonicalization.
- How to inspect later: rerun the scoped formatter round-trip on `mesher/services`, then use the targeted greps on `mesher/services/project.mpl`, `mesher/services/user.mpl`, and the full services directory to confirm the multiline imports and dotted module paths stayed clean.
- Failure state made visible: `cargo run -q -p meshc -- fmt --check mesher/services`, `! rg -n '^from .{121,}' mesher/services/project.mpl mesher/services/user.mpl`, and `! rg -n '^from .*\. ' mesher/services -g '*.mpl'` distinguish a task-local formatter regression from the remaining slice backlog outside this wave.
