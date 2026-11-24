import type { GeometryJob } from './geometry.worker.ts';
import type { FabMode, PartsRun, ToolSpec, ToolsRun } from './types.ts';

const TIMEOUT_MS = 60_000;

function run<T>(job: GeometryJob): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./geometry.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`geometry script timed out after ${TIMEOUT_MS / 1000} s`));
    }, TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: T; error?: string }>) => {
      clearTimeout(timer);
      worker.terminate();
      if (e.data.ok) resolve(e.data.result as T);
      else reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(e.message || 'geometry worker crashed'));
    };
    worker.postMessage(job);
  });
}

export const runParts = (code: string, mode: FabMode) =>
  run<PartsRun>({ type: 'parts', code, mode });

/** `only`: the part this tool set is for (coverage is checked for that part alone). */
export const runTools = (code: string, mode: FabMode, specs: ToolSpec[], only?: string) =>
  run<ToolsRun>({ type: 'tools', code, mode, specs, only });
