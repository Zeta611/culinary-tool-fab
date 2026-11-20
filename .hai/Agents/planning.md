# Product Planning

Planner-owned single source of truth for the current iteration.

Last updated: 2026-11-19 18:10 PST
Last updated by: Claudia
User check-in after material clarification: not required
High-cost execution approved: no
Outward acts approved: none

Status options: `inbox`, `ready`, `next`, `in progress`, `blocked`, `done`, `dropped`.
Type options: `feature`, `bug`, `chore`, `design`, `experiment`.
Priority options: `P0` (must now), `P1` (soon), `P2` (nice), `P3` (maybe).

## Governing Rule

- The latest confirmed human decision supersedes every older conflicting decision, plan, task, handoff, or historical note.
- Apply clear precedence to keep work moving, but always flag the conflict and update the stale durable source through its owning role.
- Archived material is evidence only. It is never executable unless this plan or the current worker task explicitly restates it.

## Current Product Truth

- Product direction: Culinary Tool Fab canvas workflow (Svelte Flow mockup).
- Current scope boundary: visual style only — match Dish Graph look without replacing functionality or product model.
- Non-negotiable constraint: keep existing node graph, edges, handles, file inputs, and stage labels; no Dish Graph walkthrough/pro-mode/3D viewer port.
- Latest decision that supersedes older material: User (2026-11-19) — replace current visual style with Dish Graph visual style only; do not do a full function replace.

## 1. Inbox (untriaged)

## 2. Backlog

| ID  | Title | Type | Priority | Status | Owner | Notes / Links |
| --- | ----- | ---- | -------- | ------ | ----- | ------------- |

## 3. Active Queue

### T-visual — Dish Graph visual style on canvas

- **Status:** ready for user review (design system extracted)
- **Priority:** P0
- **Owner sequence:** Claudia builds
- **Builder:** Claudia (trigger: none)
- **Current handoff:** none
- **Design contract:** Dish Graph `index.html` visual tokens as reference; `.hai/Agents/design.md` updated to record adopted tokens
- **Dependencies:** independent
- **User-approved execution:** yes (visual-only restyle)
- **High-cost approval:** not required for CSS/component restyle; `pnpm run check` optional
- **Outward-act approval:** none

Required outcome:

1. Canvas, nodes, edges, controls, and bottom stage strip use Dish Graph neutrals, accent, card nodes, and dot grid.
2. Graph topology, node types, file input, and stage labels preserved.
3. Stop when visual match is reviewable in the task-lane preview; no Dish Graph behavior ported.

Completion evidence:

- Files or surfaces changed: `src/lib/design/*`, `src/lib/components/ui/*`, node wrappers, `layout.css`, `design.md`, `STYLE_GUIDE.md`
- Low-cost verification passed: `pnpm run check` — 0 errors (after component extraction)
- High-cost verification run or intentionally not run: not run
- Remaining user-owned verification: visual review at http://localhost:5173/ (task lane)

### 3a. Current Iteration Strategy

- Goal: Restyle Culinary Tool Fab to Dish Graph visual language.
- Why now: User chose Dish Graph canvas look; rejected full functional replace.
- Context gathered:
  - Fact: Dish Graph uses Geist, light/dark neutrals, accent blue, 20px dot grid, 10px card nodes with soft shadow and accent selection ring.
  - Fact: Culinary Tool Fab is Svelte Flow with image-input and placeholder nodes plus a static stage strip.
- Architectural or product decision:
  - Decision: CSS/token and node chrome only; keep Svelte Flow behavior.
  - Constraint: No Dish Graph walkthrough, pro mode, linking tools, or 3D viewer.
  - Out of scope: Functional parity with Dish Graph.
- Delegation: Claudia builds; Parallel Split Gate N/A
- Risks / ambiguity:
  - Risk: daisyUI leftover classes vs custom chrome — neutralize with Dish Graph CSS.

### 3b. Implementation Queues

Assigned queue for Augustus: Not assigned.

Assigned queue for Julius: Not assigned.

### 3c. Decision Needed From User

- Decision: none blocking

## 4. Bugs (optional detail)

| Bug ID | Title | Severity | Status | Repro steps | Notes |
| ------ | ----- | -------- | ------ | ----------- | ----- |

## 5. Feature Ideas / Roadmap

## 6. Archived State

- Retired handoffs: [`_archive/handoffs/`](_archive/handoffs/)
- Delivered or superseded worker queues: [`_archive/tasks/`](_archive/tasks/)
- Older planner snapshots: [`_archive/`](_archive/)
