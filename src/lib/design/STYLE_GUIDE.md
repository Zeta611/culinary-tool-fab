# Culinary Tool Fab — Visual Style Guide

For humans and agents. Reproduce the Dish Graph–inspired canvas look **without** copying Dish Graph product behavior.

Canonical agent pointer: [`.hai/Agents/design.md`](../../../.hai/Agents/design.md) → this file.

## Intent

Calm, precise tool canvas: light neutrals, blue accent, card nodes on a 20px dot grid. System light/dark via `prefers-color-scheme`.

## File map

| Path | Role |
| --- | --- |
| `src/lib/design/colors.ts` | Color system (roles, light/dark hex, usage) |
| `src/lib/design/fonts.ts` | Font system (Geist stacks, scale, CDN URLs) |
| `src/lib/design/tokens.css` | CSS custom properties (`--ctf-*`) |
| `src/lib/design/flow-theme.css` | Base + Svelte Flow + component class styles |
| `src/lib/design/STYLE_GUIDE.md` | This guide |
| `src/lib/components/ui/*` | Reusable visual components |
| `src/lib/index.ts` | Barrel: tokens modules + UI components |

Import tokens/components:

```ts
import { colorsLight, fontSans, colorVar } from '#lib';
import { FlowNodeCard, WalkStrip, FontLinks } from '#lib';
```

Load styles once from the app shell (`src/routes/layout.css` already does):

```css
@import '../lib/design/tokens.css';
@import '../lib/design/flow-theme.css';
```

Load fonts via `<FontLinks />` in `+layout.svelte` (or any root shell).

## Color system

Use CSS vars in styles: `var(--ctf-bg)`. Read/write hex from `colors.ts`.

| Role | CSS var | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| bg | `--ctf-bg` | `#ffffff` | `#0a0a0a` | Page / canvas |
| surface | `--ctf-surface` | `#fafafa` | `#111111` | Panels, walk strip |
| surface-2 | `--ctf-surface-2` | `#f2f2f2` | `#1a1a1a` | Media placeholders |
| border | `--ctf-border` | `#eaeaea` | `#2e2e2e` | Hairlines, grid dots |
| border-strong | `--ctf-border-strong` | `#c9c9c9` | `#454545` | Node / control outlines |
| text | `--ctf-text` | `#171717` | `#ededed` | Primary text |
| secondary | `--ctf-secondary` | `#4d4d4d` | `#a0a0a0` | Body |
| faint | `--ctf-faint` | `#8f8f8f` | `#8f8f8f` | Kind labels, idle pills |
| accent | `--ctf-accent` | `#006bff` | `#47a8ff` | Selection, handles, focus |
| accent-soft | `--ctf-accent-soft` | `#e9f2ff` | `#0f2340` | Selection halo |
| warm | `--ctf-warm` | `#b45309` | `#f0a35a` | Warm emphasis |
| warm-soft | `--ctf-warm-soft` | `#fdf3e7` | `#2a1d10` | Warm fill |
| edge | `--ctf-edge` | `#c9c9c9` | `#454545` | Graph edges |

Legacy aliases (`--bg`, `--accent`, …) mirror `--ctf-*` for older chrome.

**Do not** invent one-off hex for canvas chrome. Add a role in `colors.ts` + `tokens.css` if needed.

## Font system

| Token | Family | CSS var | Stack |
| --- | --- | --- | --- |
| sans | Geist | `--ctf-font` | Geist, ui-sans-serif, system-ui, … |
| mono | Geist Mono | `--ctf-font-mono` | Geist Mono, ui-monospace, … |

Scale (`fontScale` in `fonts.ts`):

| Role | Size / line / weight | Use |
| --- | --- | --- |
| body | 14 / 20 / 400 | App body |
| kind | 10 / 14 / 400, 0.06em, uppercase | Node kind |
| nodeBody | 12 / 16 / 400 | Node body |
| file | 11 / 16 / 400 | File input |
| walk | 12 / 16 / 400 | Walk pills |
| walkCurrent | 12 / 16 / 500 | Current step |
| edgeLabel | 11 / 14 / 400 | Edge labels |

CDN stylesheets: `fontStylesheets` in `fonts.ts` (jsDelivr Geist 1.3.1).

## Shape, space, motion

| Token | Value |
| --- | --- |
| `--ctf-radius-node` / panel | 10px |
| `--ctf-radius-pill` | 9999px |
| `--ctf-radius-control` | 6px |
| `--ctf-shadow-soft` | soft dual shadow |
| `--ctf-shadow-selected` | `0 0 0 3px accent-soft` |
| `--ctf-grid-gap` | 20px (Svelte Flow `Background` gap) |
| `--ctf-media-w/h` | 132×92 |
| `--ctf-media-lg` | 160×160 |
| `--ctf-duration` | 160ms |

Honor `prefers-reduced-motion: reduce` (already in `flow-theme.css`).

## Components

Build new canvas UI from these before inventing markup.

| Component | Import | Purpose |
| --- | --- | --- |
| `FlowNodeCard` | `#lib` | Card shell + optional `kind` label; selection ring via parent `.svelte-flow__node.selected` |
| `FlowNodeMedia` | `#lib` | Placeholder or `<img>`; `size="md" \| "lg"` |
| `FlowNodeBody` | `#lib` | Secondary body text slot |
| `FlowFileInput` | `#lib` | Styled file input (`nodrag` for Svelte Flow) |
| `WalkStrip` | `#lib` | Bottom stage pills; `steps: { label, state? }[]` |
| `FontLinks` | `#lib` | Geist stylesheet tags for `<svelte:head>` |

Recipe — image node:

```svelte
<FlowNodeCard kind="Image">
  <FlowNodeMedia />
  <FlowFileInput />
  <Handle type="source" position={Position.Right} />
</FlowNodeCard>
```

Recipe — stage node:

```svelte
<FlowNodeCard kind="Stage">
  <FlowNodeMedia size="lg" />
  <FlowNodeBody>Label</FlowNodeBody>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
</FlowNodeCard>
```

Recipe — canvas chrome:

```svelte
<SvelteFlow …>
  <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
  <Panel position="bottom-center">
    <WalkStrip steps={[{ label: 'A', state: 'done' }, { label: 'B', state: 'current' }]} />
  </Panel>
  <Controls />
</SvelteFlow>
```

## Agent checklist (match this look)

1. Import `tokens.css` + `flow-theme.css` (or keep using `layout.css`).
2. Render `<FontLinks />` in the document head.
3. Use `--ctf-*` / `colors.ts` — no random purple/cream themes.
4. Compose nodes with `FlowNodeCard` + media/body/file — do not restyle with daisyUI skeletons.
5. Dot grid gap **20**, edge stroke from `--ctf-edge`, handles from `--ctf-accent`.
6. Walk stages use `WalkStrip`, not daisyUI `.steps`.
7. Visual-only changes: do not port Dish Graph walkthrough, pro mode, link tools, or 3D viewer unless explicitly requested.

## Out of scope for this visual system

Dish Graph product features (guided walkthrough, pro mode, connect tool, Three.js viewer). This package is **style + chrome components** for Culinary Tool Fab’s Svelte Flow app.
