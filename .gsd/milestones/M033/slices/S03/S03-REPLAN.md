# S03 Replan

**Milestone:** M033
**Slice:** S03
**Blocker Task:** T02
**Created:** 2026-03-25T19:32:32.494Z

## Blocker Description

T02 proved the copied storage-only Mesh probe is not a valid proof surface for the remaining read families: imported struct-list results hit LLVM verifier/runtime failures, and some aggregate/map rows stringify selected values as raw pointer addresses when staged through helper bindings. The Mesher query rewrites can still build, but the original T03/T04 plan cannot keep extending that probe pattern honestly.

## What Changed

Replanned the remaining slice around a verification-first pivot. T03 now replaces the failing storage-probe proof path with a Mesher-backed/read-caller-backed harness that can honestly cover the composed-read families while preserving caller-visible row shapes. T04 then uses that new proof surface to retire the hard whole-query raw families and re-evaluate the leftover raw keep-list instead of assuming the old probe can prove them. Added T05 to close the slice with one stable live Postgres verifier and keep-list gate tuned to the new proof surface.
