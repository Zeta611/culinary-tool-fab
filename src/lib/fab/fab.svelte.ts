/**
 * Client-side agent loops. The model runs on the server (fab.remote.ts); its
 * tool calls run here: Manifold in a worker, renders with three.js. Results go
 * back to the model with the next step.
 *
 * Flow: one parts agent decomposes the dish; once it finishes, every accepted
 * part gets its own tool agent (a few run at a time).
 */
import { store } from '#lib/core.svelte.ts';

import { fabAgentStep, renderPrototype } from './fab.remote.ts';
import { runParts, runTools } from './geometry.ts';
import {
  partsToObjects,
  partThumbnail,
  renderFocus,
  renderParts,
  renderTools,
  snapshot,
  toolsThumbnail
} from './render.ts';
import {
  type FabMode,
  type FabStage,
  MAX_RUNS,
  type PartResult,
  type PartsRun,
  type RenderImage,
  type ToolSpec,
  type ToolsRun
} from './types.ts';

const MAX_MODEL_STEPS = { parts: 14, tools: 8 };
const TOOL_AGENT_CONCURRENCY = 3;

export interface StepLog {
  kind: 'model' | 'run' | 'error';
  text?: string;
  reasoning?: string;
  notes?: string;
  code?: string;
  issues?: string[];
  warnings?: string[];
  images?: RenderImage[];
}

export interface AgentState {
  status: 'idle' | 'queued' | 'running' | 'done' | 'error';
  /** what the loop is waiting on right now */
  phase: string;
  steps: StepLog[];
  error: string | null;
  cost: number;
  summary: string;
}

const blank = (status: AgentState['status'] = 'idle'): AgentState => ({
  status,
  phase: '',
  steps: [],
  error: null,
  cost: 0,
  summary: ''
});

export const fab = $state({
  mode: 'full' as FabMode,
  parts: blank(),
  /** one tool agent per accepted part, keyed by part id */
  tools: {} as Record<string, AgentState>,
  /** final photoreal render of the dish as modelled; queued until every tool agent settles */
  prototype: blank()
});

/** Bumped on every parts run; tool agents from an older run stop quietly. */
let generation = 0;

// Heavy results are kept raw (typed arrays), outside deep reactivity.
let partsCode: string | null = $state.raw(null);
/** mode the accepted parts were built in; their tool agents follow it */
let partsMode: FabMode = 'full';
let partsRun: PartsRun | null = $state.raw(null);
let partsRenders: RenderImage[] = $state.raw([]);
let accepted: PartResult[] | null = $state.raw(null);
let partThumbs: Record<string, string> = $state.raw({});
let toolResults: Record<string, { run: ToolsRun; renders: RenderImage[]; thumb: string }> =
  $state.raw({});
/** generated prototype image, and the CAD render it was conditioned on */
let prototype: { url: string; file: File; cad: string } | null = $state.raw(null);

export const fabResults = {
  get partsCode() {
    return partsCode;
  },
  get partsMode() {
    return partsMode;
  },
  /** latest valid parts run (updates while the agent iterates) */
  get parts() {
    return partsRun;
  },
  get partsRenders() {
    return partsRenders;
  },
  /** the parts the agent finished with; each gets a part node and a tool agent */
  get accepted() {
    return accepted;
  },
  partThumb(id: string) {
    return partThumbs[id];
  },
  tools(id: string) {
    return toolResults[id];
  },
  get prototype() {
    return prototype;
  }
};

const hasInputs = () =>
  store.imagePreview !== null ||
  store.imageInputs.size > 0 ||
  store.textInputs.values().some((t) => t.trim() !== '');

export const canRunParts = () => fab.parts.status !== 'running' && hasInputs();

export const canRunTools = (id: string) =>
  accepted?.some((p) => p.id === id) === true &&
  fab.parts.status !== 'running' &&
  fab.tools[id]?.status !== 'running';

export const anyToolAgentBusy = () =>
  Object.values(fab.tools).some((s) => s.status === 'running' || s.status === 'queued');

// ------------------------------------------------------------------ messages
type Part = { type: 'text'; text: string } | { type: 'image'; image: string };
type Message = { role: string; content: unknown };

async function imageToDataURL(file: Blob, max = 1024): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL('image/jpeg', 0.88);
}

interface Inputs {
  text: string;
  concept: Part[];
  images: Part[];
}

/** Inspirations and concept image, encoded once per parts run. */
let inputsCache: { gen: number; inputs: Promise<Inputs> } | null = null;

function inputs(): Promise<Inputs> {
  if (inputsCache?.gen === generation) return inputsCache.inputs;
  const load = async (): Promise<Inputs> => {
    const texts = store.textInputs
      .values()
      .map((t) => t.trim())
      .filter(Boolean)
      .toArray();
    const images: Part[] = [];
    for (const { image } of store.imageInputs.values()) {
      images.push({ type: 'image', image: await imageToDataURL(image) });
    }
    const concept: Part[] = store.imagePreview
      ? [{ type: 'image', image: await imageToDataURL(store.imagePreview.image) }]
      : [];
    const text = texts.length
      ? `Designer's text inspirations:\n${texts.map((t) => `- ${t}`).join('\n')}`
      : 'No text inspirations.';
    return { text, concept, images };
  };
  inputsCache = { gen: generation, inputs: load() };
  return inputsCache.inputs;
}

function partSummary(p: PartResult) {
  return {
    id: p.id,
    name: p.name,
    material: p.material,
    kind: p.kind,
    envelope: p.envelope || undefined,
    easy: p.easy || undefined,
    size_mm: p.stats.size,
    volume_mm3: p.stats.volume,
    undercut: p.stats.undercut,
    layers: p.layers.length ? p.layers : undefined,
    instances: p.instances.length,
    notes: p.notes || undefined,
    warnings: p.warnings.length ? p.warnings : undefined
  };
}

async function partsMessage(): Promise<Message> {
  const { text, concept, images } = await inputs();
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          `Design the edible parts for this dish.\n\n${text}\n\n` +
          (concept.length
            ? `The first image is the generated concept image (primary reference). ${images.length ? 'The remaining images are inspirations.' : ''}`
            : 'There is no concept image: work from the inspirations.')
      },
      ...concept,
      ...images
    ]
  };
}

async function toolsMessage(part: PartResult, all: PartResult[]): Promise<Message> {
  const { text, concept, images } = await inputs();
  const focus = renderFocus(all, part.id);
  const others = all
    .filter((p) => p.id !== part.id)
    .map((p) => `- ${p.id}: ${p.name} (${p.material}, ${p.kind}${p.envelope ? ', envelope' : ''})`)
    .join('\n');
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          `Design the fabrication tools for this part only: ${part.id} (${part.name}).\n\n` +
          `Part (local frame, base on z = 0):\n${JSON.stringify(partSummary(part), null, 1)}\n\n` +
          `Other parts of the dish (they have their own tool designers):\n${others || '(none)'}\n\n` +
          `Dish summary from the CAD step: ${fab.parts.summary || '(none)'}\n\n` +
          `Images: first the 3D model renders of this part (primary): ${focus.map((r) => r.label).join(', ')}. ` +
          `Then${concept.length ? ' the concept image and' : ''} the inspiration images (secondary).\n\n${text}`
      },
      ...focus.map((r) => ({ type: 'image', image: r.url })),
      ...concept,
      ...images
    ]
  };
}

/** Keep images in the first message and the latest render message only. */
function prune(messages: Message[]): Message[] {
  let last = -1;
  messages.forEach((m, i) => {
    if (
      i > 0 &&
      m.role === 'user' &&
      Array.isArray(m.content) &&
      m.content.some((c) => c.type === 'image')
    )
      last = i;
  });
  return messages.map((m, i) => {
    if (i === 0 || i === last || m.role !== 'user' || !Array.isArray(m.content)) return m;
    const content = (m.content as Part[]).map((c) =>
      c.type === 'image' ? { type: 'text', text: '[earlier render omitted]' } : c
    );
    return { ...m, content };
  });
}

// ------------------------------------------------------------------ tool execution
type ToolOutput = { type: 'json'; value: unknown } | { type: 'error-text'; value: string };
type Exec = (
  input: Record<string, unknown>,
  log: StepLog
) => Promise<{ output: ToolOutput; images: RenderImage[] }>;

const execParts: Exec = async (input, log) => {
  const code = String(input.code ?? '');
  log.code = code;
  log.notes = input.notes as string | undefined;
  let run: PartsRun;
  try {
    run = await runParts(code, fab.mode);
  } catch (e) {
    run = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      logs: [],
      parts: [],
      issues: []
    };
  }
  if (!run.ok) {
    log.kind = 'error';
    log.text = run.error;
    const consoleOut = run.logs.length ? `\nconsole:\n${run.logs.join('\n')}` : '';
    return {
      output: { type: 'error-text', value: `Script failed: ${run.error}${consoleOut}` },
      images: []
    };
  }
  const images = renderParts(run.parts);
  partsCode = code;
  partsMode = fab.mode;
  partsRun = run;
  partsRenders = images;
  log.images = images;
  log.issues = run.issues;
  log.warnings = run.parts.flatMap((p) => p.warnings.map((w) => `${p.id}: ${w}`));
  return {
    output: {
      type: 'json',
      value: {
        parts: run.parts.map(partSummary),
        issues: run.issues,
        console: run.logs.length ? run.logs.slice(0, 50) : undefined
      }
    },
    images
  };
};

function execToolsFor(part: PartResult, code: string, mode: FabMode): Exec {
  const partId = part.id;
  return async (input, log) => {
    const raw = Array.isArray(input.tools) ? (input.tools as ToolSpec[]) : [];
    const specs = raw.map((t) => ({ ...t, partId }));
    log.notes = input.notes as string | undefined;
    log.code = JSON.stringify(raw, null, 1);
    let run: ToolsRun;
    try {
      run = await runTools(code, mode, specs, partId);
    } catch (e) {
      run = { ok: false, error: e instanceof Error ? e.message : String(e), tools: [], issues: [] };
    }
    if (run.error) {
      log.kind = 'error';
      log.text = run.error;
      return { output: { type: 'error-text', value: run.error }, images: [] };
    }
    const images = renderTools(run.tools, part);
    const thumb = run.tools.length ? toolsThumbnail(run.tools, part) : '';
    toolResults = { ...toolResults, [partId]: { run, renders: images, thumb } };
    log.images = images;
    log.issues = run.issues;
    log.warnings = run.tools.flatMap((t) => t.warnings.map((w) => `${t.id}: ${w}`));
    return {
      output: {
        type: 'json',
        value: {
          tools: run.tools.map((t) => ({
            id: t.id,
            name: t.name,
            kind: t.kind,
            size_mm: t.stats.size,
            warnings: t.warnings.length ? t.warnings : undefined
          })),
          issues: run.issues
        }
      },
      images
    };
  };
}

// ------------------------------------------------------------------ loop
interface Loop {
  stage: FabStage;
  mode: FabMode;
  state: AgentState;
  initial: () => Promise<Message>;
  exec: Exec;
  /** true once a newer parts run has superseded this loop */
  stale: () => boolean;
}

/** Returns true when the agent called its finish tool (or ran out of steps) without error. */
async function agentLoop({ stage, mode, state: s, initial, exec, stale }: Loop): Promise<boolean> {
  const finishName = stage === 'parts' ? 'finish_parts' : 'finish_tools';
  const runName = stage === 'parts' ? 'run_parts_code' : 'build_tools';
  let runs = 0;
  let nudged = false;
  try {
    const messages: Message[] = [await initial()];
    for (let step = 0; step < MAX_MODEL_STEPS[stage]; step++) {
      s.phase = `Model is thinking (step ${step + 1})…`;
      const res = await fabAgentStep({ stage, mode, messages: prune(messages) });
      if (stale()) return false;
      s.cost += res.cost ?? 0;
      messages.push(...(res.responseMessages as Message[]));
      if (res.text.trim() || res.reasoning.trim()) {
        s.steps.push({ kind: 'model', text: res.text.trim(), reasoning: res.reasoning.trim() });
      }

      if (!res.toolCalls.length) {
        if (nudged) break;
        nudged = true;
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: `Continue: call ${runName}, or ${finishName} if you are done.` }
          ]
        });
        continue;
      }

      const results: unknown[] = [];
      let images: RenderImage[] = [];
      let finished = false;
      for (const call of res.toolCalls) {
        let output: ToolOutput;
        if (call.toolName === finishName) {
          finished = true;
          s.summary = String(call.input.summary ?? call.input.plan ?? '');
          output = { type: 'json', value: { accepted: true } };
        } else if (call.toolName === runName) {
          runs++;
          s.phase = `Building ${stage === 'parts' ? 'parts' : 'tools'} (run ${runs})…`;
          const log: StepLog = { kind: 'run' };
          const r = await exec(call.input, log);
          if (stale()) return false;
          s.steps.push(log);
          output = r.output;
          images = r.images;
        } else {
          output = { type: 'error-text', value: `Unknown tool ${call.toolName}` };
        }
        results.push({
          type: 'tool-result',
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          output
        });
      }
      messages.push({ role: 'tool', content: results });
      if (finished) break;

      const content: Part[] = [];
      if (images.length) {
        content.push({
          type: 'text',
          text: `Renders of run ${runs}: ${images.map((i) => i.label).join(', ')}.`
        });
        content.push(...images.map((i) => ({ type: 'image' as const, image: i.url })));
      }
      if (runs >= MAX_RUNS[stage]) {
        content.push({ type: 'text', text: `Run budget reached. Call ${finishName} now.` });
      }
      if (content.length) messages.push({ role: 'user', content });
    }
    s.status = 'done';
    return true;
  } catch (e) {
    if (stale()) return false;
    s.error = e instanceof Error ? e.message : String(e);
    s.status = 'error';
    return false;
  } finally {
    s.phase = '';
  }
}

export async function runPartsAgent() {
  if (!canRunParts()) return;
  const gen = ++generation;
  fab.parts = blank('running');
  fab.tools = {};
  resetPrototype();
  partsCode = null;
  partsRun = null;
  partsRenders = [];
  accepted = null;
  partThumbs = {};
  toolResults = {};

  const ok = await agentLoop({
    stage: 'parts',
    mode: fab.mode,
    state: fab.parts,
    initial: partsMessage,
    exec: execParts,
    stale: () => gen !== generation
  });
  if (gen !== generation) return;
  // set by execParts during the loop (TS narrowed it to null above)
  const final = partsRun as PartsRun | null;
  if (ok && !final) {
    fab.parts.status = 'error';
    fab.parts.error = 'The agent produced no valid parts.';
    return;
  }
  if (!ok || !final) return;
  const parts = final.parts;
  accepted = parts;
  partThumbs = Object.fromEntries(parts.map((p) => [p.id, partThumbnail(p)]));
  void afterAccept();
}

/** Skip the parts agent: run a saved parts script, accept it, and dispatch the tool agents. */
export async function acceptPartsScript(code: string) {
  if (fab.parts.status === 'running') return;
  const gen = ++generation;
  fab.parts = blank('running');
  fab.parts.phase = 'Building parts from the script…';
  fab.tools = {};
  resetPrototype();
  accepted = null;
  partThumbs = {};
  toolResults = {};
  const log: StepLog = { kind: 'run', notes: 'Loaded from a saved script.' };
  const r = await execParts({ code }, log);
  if (gen !== generation) return;
  fab.parts.steps.push(log);
  fab.parts.phase = '';
  if (r.output.type === 'error-text') {
    fab.parts.status = 'error';
    fab.parts.error = r.output.value;
    return;
  }
  fab.parts.status = 'done';
  fab.parts.summary = 'Parts loaded from a saved script.';
  const parts = (partsRun as PartsRun | null)!.parts;
  accepted = parts;
  partThumbs = Object.fromEntries(parts.map((p) => [p.id, partThumbnail(p)]));
  void afterAccept();
}

/** Design tools for one accepted part. */
export async function runToolAgent(partId: string) {
  if (!canRunTools(partId) || !accepted || !partsCode) return;
  const gen = generation;
  const all = accepted;
  const part = all.find((p) => p.id === partId)!;
  fab.tools[partId] = blank('running');
  const { [partId]: _old, ...rest } = toolResults;
  void _old;
  toolResults = rest;
  await agentLoop({
    stage: 'tools',
    mode: partsMode,
    state: fab.tools[partId],
    initial: () => toolsMessage(part, all),
    exec: execToolsFor(part, partsCode, partsMode),
    stale: () => gen !== generation
  });
  if (gen === generation && fab.tools[partId].status === 'done' && !toolResults[partId]) {
    fab.tools[partId].status = 'error';
    fab.tools[partId].error = 'The agent produced no tools.';
  }
}

function resetPrototype() {
  fab.prototype = blank();
  if (prototype) URL.revokeObjectURL(prototype.url);
  prototype = null;
}

/** Accepted parts: render the prototype and design every part's tools, side by side. */
async function afterAccept() {
  await Promise.all([runPrototypeRender(), runAllToolAgents()]);
}

export const canRunPrototype = () =>
  accepted !== null && fab.parts.status !== 'running' && fab.prototype.status !== 'running';

/** Photoreal render of the dish as modelled: CAD renders of the parts are the ground truth. */
export async function runPrototypeRender() {
  if (!canRunPrototype() || !accepted) return;
  const gen = generation;
  const parts = accepted;
  fab.prototype = blank('running');
  fab.prototype.phase = 'Rendering the prototype…';
  try {
    const cad = snapshot(
      partsToObjects(parts),
      [
        { label: 'front-right', azimuth: -55, elevation: 22 },
        { label: 'front', azimuth: -90, elevation: 10 }
      ],
      1024
    ).map((r) => r.url);
    const brief = store.textInputs
      .values()
      .map((t) => t.trim())
      .filter(Boolean)
      .toArray()
      .join('\n');
    const res = await renderPrototype({
      cad,
      parts: parts
        .map(
          (p) =>
            `- ${p.name}${p.instances.length > 1 ? ` (x${p.instances.length})` : ''}: ${p.material}, colour ${p.color}`
        )
        .join('\n'),
      brief: brief || undefined
    });
    if (gen !== generation) return;
    const file = new File([res.bytes], 'prototype', { type: res.mediaType });
    if (prototype) URL.revokeObjectURL(prototype.url);
    prototype = { url: URL.createObjectURL(file), file, cad: cad[0] };
    fab.prototype.cost = res.cost ?? 0;
    fab.prototype.status = 'done';
  } catch (e) {
    if (gen !== generation) return;
    fab.prototype.status = 'error';
    fab.prototype.error = e instanceof Error ? e.message : String(e);
  } finally {
    fab.prototype.phase = '';
  }
}

/** Dispatch a tool agent for every accepted part, a few at a time. */
export async function runAllToolAgents() {
  if (!accepted) return;
  const ids = accepted.map((p) => p.id).filter((id) => fab.tools[id]?.status !== 'running');
  for (const id of ids) fab.tools[id] = blank('queued');
  const queue = [...ids];
  const gen = generation;
  await Promise.all(
    Array.from({ length: Math.min(TOOL_AGENT_CONCURRENCY, queue.length) }, async () => {
      while (queue.length && gen === generation) await runToolAgent(queue.shift()!);
    })
  );
}
