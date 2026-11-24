/// <reference lib="webworker" />
// One worker per job: load Manifold, run the model-written script, build tools,
// post the result and let the main thread terminate us (frees all WASM memory).
import Module from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';

import { buildTools, runPartsScript } from './kernel.ts';
import type { FabMode, MeshData, PartsRun, ToolSpec, ToolsRun } from './types.ts';

export type GeometryJob =
  | { type: 'parts'; code: string; mode: FabMode }
  | { type: 'tools'; code: string; mode: FabMode; specs: ToolSpec[]; only?: string };

function transferables(meshes: MeshData[]): Transferable[] {
  return meshes.flatMap((m) => [m.positions.buffer, m.indices.buffer]);
}

self.onmessage = async (e: MessageEvent<GeometryJob>) => {
  const job = e.data;
  try {
    const wasm = await Module({ locateFile: () => wasmUrl });
    wasm.setup();
    // The script is model-written: take away the network before running it.
    const g = self as unknown as Record<string, unknown>;
    for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts']) {
      g[k] = undefined;
    }
    const { run, defs } = runPartsScript(wasm, job.code, job.mode);
    if (job.type === 'parts') {
      self.postMessage(
        { ok: true, result: run },
        { transfer: transferables(run.parts.map((p) => p.mesh)) }
      );
      return;
    }
    if (!run.ok) {
      const result: ToolsRun = {
        ok: false,
        error: `parts script failed: ${run.error}`,
        tools: [],
        issues: []
      };
      self.postMessage({ ok: true, result });
      return;
    }
    const tools = buildTools(wasm, defs, job.specs, job.mode, job.only);
    self.postMessage(
      { ok: true, result: tools },
      { transfer: transferables(tools.tools.map((t) => t.mesh)) }
    );
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};

export type { PartsRun, ToolsRun };
