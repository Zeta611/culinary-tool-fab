# Decisions
Version: current

<!--
## How To Use This File

- Record only durable human decisions here.
- Keep one version or phase header at the top if your team groups decisions that way.
- Do not use this file for open questions, routine status updates, or loose brainstorming.
-->

Use this as the human decision log for the current project version or working phase.
Archive or reset this file before changing the version header convention.

## Format

- Date:
- Decision:
- Why:
- Tradeoffs:
- Follow-up:

## Decisions

- Date: 2026-11-20
- Decision: Keep the designer's neutral canvas look, but implement it with daisyUI (themes `ctf`/`ctf-dark` in `src/routes/layout.css`). No custom design-token CSS, no class-only wrapper components, no filler text in nodes; stage progress uses daisyUI `steps`.
- Why: Jay maintains the styling in daisyUI; the custom design system added wrapper overhead.
- Tradeoffs: Look values now live only in the daisyUI theme blocks.
- Follow-up: Agent rules are in `.hai/Agents/design.md` and `project_context.md`.
