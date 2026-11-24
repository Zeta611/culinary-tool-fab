# Fabrication agent (experimental)

The flow after the image preview has two steps:

1. The **Tangible Parts** node runs one agent that breaks the dish down into edible parts as 3D geometry.
2. When it finishes, each part gets its own **part node** and **tool node**. One tool agent per part (three at a time) designs that part's cutters, stencils or moulds.

Everything runs inside SvelteKit: the model call is a remote function, and the geometry runs in the browser.

| File                 | Role                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `fab.remote.ts`      | One model step (`moonshotai/kimi-k3.1-pro` via OpenRouter); tools have no `execute`      |
| `prompts.server.ts`  | System prompts for both stages and both modes; run budgets                               |
| `fab.svelte.ts`      | Client agent loop: calls the model, runs its tool calls, sends results + renders back    |
| `kernel.ts`          | Manifold helper library `K`, makeability checks, deterministic tool generators           |
| `geometry.worker.ts` | Fresh Web Worker per job: loads Manifold WASM, runs the model's script (network removed) |
| `render.ts`          | three.js scene, labelled snapshots the model sees, viewer helpers                        |
| `examples.ts`        | Worked example script shown in the parts prompt                                          |

**Parts stage.** The model writes a JavaScript script against `M`
(Manifold), `CS` (CrossSection) and `K`. The worker runs it and checks each
part: it must be watertight, have a flat base, have no undercut for an
open-face mould, have no features thinner than 1.5 mm, overlap no other part,
and keep a margin to the envelope. The model gets back those results plus four
scene views and a parts sheet, and iterates until `finish_parts`.

**Tools stage (one agent per part).** Each agent sees its part alone and in
the scene with the other parts ghosted (its primary source), plus the other
parts' names and the original inputs (secondary). It picks that part's tools
(`cutter`, `stencil`, `open_mold`, `silicone_box`) and sets their parameters.
`kernel.ts` builds the geometry deterministically from the accepted parts
script. You can redesign one part's tools from its part node or tool node, or
all of them from the parts dialog.

**Load** (in the parts dialog) runs a saved `parts.js` (from **Script**) and
skips straight to the tool agents. This is useful when iterating on the tools
prompt.

**2.5D mode** (toggle in the parts dialog). Every part except the envelope
must be stacked 2D layers; flat pieces can stand upright with `rotX: 90`.
Tools are limited to cutters and stencils, with moulds only for the envelope or
parts marked `easy`.

Dev console: `__culinary.store`, `__culinary.fab`, `__culinary.fabResults`
(for example `__culinary.store.setImagePreview(file)` to skip image generation).
