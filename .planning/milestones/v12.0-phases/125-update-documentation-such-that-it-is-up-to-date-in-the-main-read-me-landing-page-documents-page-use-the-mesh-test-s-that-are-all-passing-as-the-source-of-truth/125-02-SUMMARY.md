---
phase: 125-update-docs
plan: 02
subsystem: website/landing
tags: [documentation, landing-page, v12.0, vitepress]
dependency_graph:
  requires: []
  provides: [DOC-01]
  affects: [website/docs/.vitepress/config.mts, website/docs/.vitepress/theme/components/landing/HeroSection.vue, website/docs/.vitepress/theme/components/landing/FeatureShowcase.vue]
tech_stack:
  added: []
  patterns: [VitePress themeConfig, Vue SFC code strings, escaped JS template literals]
key_files:
  modified:
    - website/docs/.vitepress/config.mts
    - website/docs/.vitepress/theme/components/landing/HeroSection.vue
    - website/docs/.vitepress/theme/components/landing/FeatureShowcase.vue
decisions:
  - Slot pipe example uses |2> insert_at("[", "]") to show second-position routing, matching syntax from tests/e2e/slot_pipe_basic.mpl
  - Pipe feature renamed to "Pipe Operators" (plural) to encompass both standard pipe and slot pipe
metrics:
  duration: 1min
  completed: 2026-02-27
  tasks_completed: 2
  files_modified: 3
---

# Phase 125 Plan 02: Landing Page v12.0 Update Summary

**One-liner:** Updated landing page version badge to v12.0, replaced all `${}` interpolation with `#{}` in code examples, and added slot pipe (`|2>`) as a named feature in the feature showcase.

## What Was Done

### Task 1: Update config.mts version number (commit: 3b05f0d4)

Changed `meshVersion: '7.0'` to `meshVersion: '12.0'` in `website/docs/.vitepress/config.mts`.

This single-line change controls the version text displayed in the hero section badge ("Now in development — v12.0"). The badge reads `v{{ theme.meshVersion }}` dynamically from the VitePress themeConfig.

### Task 2: Update HeroSection.vue and FeatureShowcase.vue code examples (commit: 44d06aa1)

**HeroSection.vue:**
- Changed `HTTP.response(200, "Count: \${count}")` to `HTTP.response(200, "Count: \#{count}")` in the `heroCode` JS template literal string. The backslash escape pattern prevents JS from interpolating the sequence, displaying it as raw Mesh source code.

**FeatureShowcase.vue — Feature index 1 (Pattern Matching):**
- Changed `println("Got: \${value}")` to `println("Got: \#{value}")`
- Changed `println("Error: \${msg}")` to `println("Error: \#{msg}")`
- Removes all stale v7.0 `${}` interpolation from user-visible code samples.

**FeatureShowcase.vue — Feature index 3 (Pipe Operator → Pipe Operators):**
- Updated `title` from `'Pipe Operator'` to `'Pipe Operators'`
- Updated `description` to mention the slot pipe `|N>` syntax
- Extended the `code` string to include a slot pipe example using `"mesh" |2> insert_at("[", "]")`, derived from the pattern in `tests/e2e/slot_pipe_basic.mpl`

## Verification Results

All four verification criteria from the plan passed:

1. `grep "meshVersion" website/docs/.vitepress/config.mts` → `meshVersion: '12.0'`
2. `grep "\\\\#{" HeroSection.vue` → `HTTP.response(200, "Count: \#{count}")`
3. `grep "Slot pipe\||2>" FeatureShowcase.vue` → slot pipe comment and `|2>` call found
4. `grep '\${' FeatureShowcase.vue` → empty (no old-style interpolation remaining)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All files exist on disk. Both task commits (3b05f0d4, 44d06aa1) confirmed in git log.
