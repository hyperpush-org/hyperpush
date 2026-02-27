# Phase 121: Mesh Agent Skill - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a native skill spec (SKILL.md format) for the Mesh programming language that lives inside the snow repo. The skill provides a full language overview at the root level and routes agents to per-concept sub-skills for deep-dives. Creating a GSD slash command or any other tooling format is explicitly out of scope.

</domain>

<decisions>
## Implementation Decisions

### Skill format & location
- Native skill spec format: SKILL.md with YAML frontmatter (`name`, `description`) + numbered rules/guidance for AI agents
- Sub-skills live in `skills/` subdirectory, each with their own SKILL.md (same pattern as the cadence skill at `/Users/sn0w/.codex/skills/cadence/`)
- Skill lives inside the snow repo (not in the global codex skills directory)
- NOT a GSD slash command — purely a skill spec file

### Content depth & format
- Primary audience: AI agents consuming the skill to answer Mesh questions
- Content style: Full tutorial-style per topic — what it is, why it exists, code examples, gotchas
- Length: Per-topic depth varies as needed — complex topics (actors, distributed actors) get more space than simpler ones (basic types)
- Code examples: Must use real, runnable Mesh code sourced from the codebase's test files — not illustrative examples written from scratch

### Topic coverage & granularity
- The researcher should discover and enumerate all Mesh concepts from test files, then define sub-skills from that inventory
- Authoritative source of truth: test files (if it's tested, it's real; untested = undocumented)
- Related concepts are grouped into a single sub-skill (e.g., one sub-skill for all type-related concepts, not one sub-skill per primitive)
- Goal: comprehensive coverage — a sub-skill for every meaningful concept group

### Entry point (root SKILL.md)
- When invoked without a specific sub-topic, the root skill delivers a full language overview covering:
  1. What Mesh is and its design philosophy
  2. Key syntax at a glance (flavor of the language)
  3. Type system overview
  4. Ecosystem context (actors, ORM, HTTP/WS — what makes Mesh full-stack)
- No quick-start code snippet in the overview — code examples belong in per-topic sub-skills
- After the overview, presents a flat list of available sub-skill commands

### Auto-load trigger design
- Trigger: Broad — auto-loads for any question about the Mesh programming language
- Routing: Root skill immediately routes to the relevant sub-skill(s) rather than attempting to answer from the overview
- Cross-concept questions (e.g., "how do actors use the ORM"): loads both relevant sub-skills and synthesizes an answer from both
- Unimplemented features: Silent — skill only documents what exists in the test files. No mention of planned or roadmap features.

### Claude's Discretion
- Exact directory structure within the repo (e.g., `skill/mesh/` vs top-level `SKILL.md`)
- How to organize the flat sub-skill command list in the overview
- Whether to add a brief one-line description alongside each sub-skill in the command list

</decisions>

<specifics>
## Specific Ideas

- Reference implementation for the skill format: `/Users/sn0w/.codex/skills/cadence/` — use this as the structural model (root SKILL.md + `skills/` subdirectory with per-skill SKILL.md files)
- The researcher should audit test files to enumerate every distinct, implemented Mesh concept before defining sub-skill boundaries

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 121-mesh-agent-skill*
*Context gathered: 2026-02-25*
