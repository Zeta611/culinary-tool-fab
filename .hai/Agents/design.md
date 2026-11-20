# Design Guide

Concrete visual language for Culinary Tool Fab. **Full agent-facing style guide:** [`src/lib/design/STYLE_GUIDE.md`](../../src/lib/design/STYLE_GUIDE.md).

Adopted from Dish Graph’s canvas look (visual style only). Product behavior stays Culinary Tool Fab / Svelte Flow.

## Overview

- Surface: full-viewport Svelte Flow canvas
- Intent: calm, precise tool canvas — neutrals, blue accent, card nodes, 20px dot grid
- Theme: system light/dark via `prefers-color-scheme`
- Implementation: `src/lib/design/*` tokens + `src/lib/components/ui/*`

## Color system

Source: `src/lib/design/colors.ts` → CSS `src/lib/design/tokens.css` (`--ctf-*`).

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#ffffff` | `#0a0a0a` | Canvas |
| `surface` | `#fafafa` | `#111111` | Panels |
| `surface-2` | `#f2f2f2` | `#1a1a1a` | Media fill |
| `border` | `#eaeaea` | `#2e2e2e` | Hairlines / grid |
| `border-strong` | `#c9c9c9` | `#454545` | Outlines |
| `text` | `#171717` | `#ededed` | Primary |
| `secondary` | `#4d4d4d` | `#a0a0a0` | Body |
| `faint` | `#8f8f8f` | `#8f8f8f` | Labels |
| `accent` | `#006bff` | `#47a8ff` | Selection / handles |
| `accent-soft` | `#e9f2ff` | `#0f2340` | Selection halo |
| `edge` | `#c9c9c9` | `#454545` | Edges |

## Font system

Source: `src/lib/design/fonts.ts`. Load with `<FontLinks />`.

- UI: Geist → `--ctf-font`
- Mono: Geist Mono → `--ctf-font-mono`
- Body 14/20; kind 10px uppercase; node body 12/16; walk pills 12/16

## Components

Import from `#lib` / `#lib/components/ui`:

| Component | Use |
| --- | --- |
| `FlowNodeCard` | Node card + kind |
| `FlowNodeMedia` | Media / placeholder |
| `FlowNodeBody` | Body copy |
| `FlowFileInput` | File picker chrome |
| `WalkStrip` | Stage pills |
| `FontLinks` | Geist CDN links |

## Do's and Don'ts

- **Do:** Extend `colors.ts` / `fonts.ts` / UI components; follow `STYLE_GUIDE.md`.
- **Don't:** One-off hex, daisyUI skeleton chrome, or Dish Graph feature ports for a visual pass.
