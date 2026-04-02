# S02: Entrypoint-aware LSP, editors, and package surfaces

**Goal:** Make editor/LSP and package-facing surfaces agree with the new compiler entrypoint contract instead of independently hardcoding root `main.mpl`.
**Demo:** After this: After this: the same non-`main.mpl` project opens cleanly in LSP/editor flows and package/discovery surfaces stop treating root `main.mpl` as the only valid executable contract.

## Tasks
