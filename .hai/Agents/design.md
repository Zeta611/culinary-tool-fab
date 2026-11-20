# Design Guide

Visual language for Culinary Tool Fab. Read before any UI work.

## Overview

- Surface: full-viewport Svelte Flow canvas.
- Look (designer's choice, keep it): calm neutral canvas, blue accent, bordered card nodes, 20px dot grid, Geist font, system light/dark.
- Implementation: **Tailwind + daisyUI**. The look lives in the daisyUI themes `ctf` / `ctf-dark` in `src/routes/layout.css`.

## Rules

- **Style with daisyUI components and theme colors.** Use `card`, `btn`, `file-input`, `modal`, `steps`, etc., and theme utilities (`bg-base-200`, `text-base-content/50`, `border-primary`). No custom design-token CSS files, no `--ctf-*`-style variables, no one-off hex.
- **Change colors, radii and borders only in the daisyUI theme blocks** in `layout.css`, for both `ctf` and `ctf-dark`.
- **No wrapper components that only add classes** (e.g. a component that just wraps `<input>` or a `<div>` with a class). Write the markup inline. Extract a component only when it carries real behavior or is reused with real logic.
- **No filler text in nodes** (kind headers like "IMAGE"/"STAGE", "Placeholder" captions). Show text only when it carries real data.
- **Stage progress uses daisyUI `steps`**, not custom pills.
- The only custom CSS allowed is the `.svelte-flow { --xy-* }` variable mapping in `layout.css` (Svelte Flow has no daisyUI component). Map to daisyUI theme variables.
- Import Svelte Flow's base `@xyflow/svelte/dist/style.css`, not `xy-theme.css` (that theme adds padding and a border around every custom node).

## Recipes

Node card (selection ring via Svelte Flow's `.selected` parent):

```svelte
<div
  class="card overflow-hidden card-border border-base-content/20 bg-base-100 shadow-sm in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <div class="size-40 bg-base-300"></div>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
</div>
```

Stage progress:

```svelte
<ul class="steps rounded-box border border-base-content/10 bg-base-200 px-4 py-2 text-xs shadow-sm">
  <li class="step step-neutral">Done</li>
  <li class="step step-neutral font-medium">Current</li>
  <li class="step text-base-content/50">Todo</li>
</ul>
```

Canvas: `<Background variant={BackgroundVariant.Dots} gap={20} size={1} />`.

## Out of scope

Dish Graph product features (guided walkthrough, pro mode, connect tool, 3D viewer) unless explicitly requested.
