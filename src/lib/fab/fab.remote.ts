import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, jsonSchema, type JSONSchema7, type ModelMessage, tool } from 'ai';
import * as v from 'valibot';

import { OPENROUTER_API_KEY } from '$app/env/private';
import { command } from '$app/server';

import { partsSystemPrompt, toolsSystemPrompt } from './prompts.server.ts';

const FAB_MODEL = 'moonshotai/kimi-k3.1-pro';

const openrouter = createOpenRouter({ apiKey: OPENROUTER_API_KEY });

// Tools have no `execute`: the browser runs them (Manifold in a worker) and
// sends the results back with the next step.
const partsTools = {
  run_parts_code: tool({
    description:
      'Run a complete parts script (JavaScript using M, CS and K). Returns per-part stats, warnings, assembly issues and renders.',
    inputSchema: jsonSchema<{ code: string; notes?: string }>({
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'What changed in this run and why (1-3 sentences).' },
        code: { type: 'string', description: 'The full script.' }
      },
      required: ['code']
    })
  }),
  finish_parts: tool({
    description:
      'Accept the current parts. Call once the renders match the concept and nothing is left in warnings or issues.',
    inputSchema: jsonSchema<{ summary: string }>({
      type: 'object',
      properties: { summary: { type: 'string', description: 'Parts, materials and scale.' } },
      required: ['summary']
    })
  })
};

const toolSpecSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    kind: { type: 'string', enum: ['cutter', 'stencil', 'open_mold', 'silicone_box'] },
    layer: { type: 'integer' },
    source: { type: 'string', enum: ['outline', 'top', 'polygons'] },
    polygons: {
      type: 'array',
      items: { type: 'array', items: { type: 'array', items: { type: 'number' } } }
    },
    opening: { type: 'string', enum: ['base', 'top'] },
    params: { type: 'object', additionalProperties: { type: 'number' } },
    purpose: { type: 'string', description: 'What the tool does in the process.' }
  },
  required: ['id', 'kind', 'purpose']
};

const toolsTools = {
  build_tools: tool({
    description: "Build this part's full tool list. Returns stats, warnings and renders.",
    inputSchema: jsonSchema<{ tools: unknown[]; notes?: string }>({
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'What changed in this run and why.' },
        tools: { type: 'array', items: toolSpecSchema }
      },
      required: ['tools']
    })
  }),
  finish_tools: tool({
    description: "Accept this part's tools and give its fabrication steps.",
    inputSchema: jsonSchema<{ plan: string }>({
      type: 'object',
      properties: {
        plan: { type: 'string', description: 'Ordered steps from parts to assembly.' }
      },
      required: ['plan']
    })
  })
};

const stepSchema = v.object({
  stage: v.picklist(['parts', 'tools']),
  mode: v.picklist(['full', '2.5d']),
  messages: v.array(v.any())
});

/** Client sends images as data URLs in `image` parts; hand them to the SDK as file parts. */
function toFileParts(messages: unknown[]): ModelMessage[] {
  return messages.map((m) => {
    const msg = m as { role: string; content: unknown };
    if (msg.role !== 'user' || !Array.isArray(msg.content)) return msg as ModelMessage;
    const content = msg.content.map((c: { type: string; image?: string }) => {
      const match = c.type === 'image' && c.image?.match(/^data:(image\/[a-z+]+);base64,(.*)$/);
      return match ? { type: 'file', mediaType: match[1], data: match[2] } : c;
    });
    return { ...msg, content } as ModelMessage;
  });
}

export const fabAgentStep = command(stepSchema, async ({ stage, mode, messages }) => {
  const started = Date.now();
  const result = await generateText({
    model: openrouter(FAB_MODEL, { usage: { include: true } }),
    system: stage === 'parts' ? partsSystemPrompt(mode) : toolsSystemPrompt(mode),
    messages: toFileParts(messages),
    tools: stage === 'parts' ? partsTools : toolsTools
  });

  const { usage } = (result.finalStep.providerMetadata?.openrouter ?? {}) as {
    usage?: { cost?: number };
  };
  console.log(
    `[${FAB_MODEL}] ${stage} step: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out, ` +
      `${usage?.cost != null ? `$${usage.cost.toFixed(4)}` : 'cost n/a'}, ${((Date.now() - started) / 1000).toFixed(1)} s`
  );

  return {
    responseMessages: result.responseMessages,
    text: result.text,
    reasoning: result.reasoningText ?? '',
    toolCalls: result.toolCalls.map((c) => ({
      toolCallId: c.toolCallId,
      toolName: c.toolName,
      input: c.input as Record<string, unknown>
    })),
    finishReason: result.finishReason,
    cost: usage?.cost ?? null
  };
});

// ------------------------------------------------------------------ prototype render
/** Same image model as the concept preview (ai.remote.ts). */
const RENDER_MODEL = 'google/gemini-3.1-flash-lite-image';

const dataImage = v.pipe(v.string(), v.regex(/^data:image\/(png|jpeg|webp);base64,/));
const renderSchema = v.object({
  /** CAD renders of the assembled parts; the first sets the camera angle */
  cad: v.pipe(v.array(dataImage), v.minLength(1), v.maxLength(3)),
  /** one line per part: name and material */
  parts: v.string(),
  /** the designer's text inspirations; used for presentation only */
  brief: v.optional(v.string())
});

// The concept image is deliberately not sent: with it, the image model redraws
// the concept instead of the parts. The text brief carries the presentation.
function renderPrompt(parts: string, brief?: string) {
  return [
    'Create a photorealistic studio photograph of a finished culinary piece.',
    '',
    'The first image(s) are CAD renders of the actual parts that will be fabricated. They are the ground truth: keep every part, its shape, proportions, count, position and colour exactly as rendered. Do not add, remove, move or reshape anything. A translucent, edge-outlined envelope in the CAD render is a clear edible body (for example agar or jelly) that encloses the other parts.',
    '',
    'Render each part in its real food material:',
    parts,
    ...(brief
      ? [
          '',
          `Designer's brief, for presentation only (plate or dish, lighting, mood). Never add, remove or reshape parts because of it: ${brief}`
        ]
      : []),
    '',
    'Show the dish from the same viewing angle as the first CAD render, with soft natural light. Output one image.'
  ].join('\n');
}

export const renderPrototype = command(renderSchema, async ({ cad, parts, brief }) => {
  const started = Date.now();
  const images = cad.map((url) => {
    const [, mediaType, data] = url.match(/^data:(image\/[a-z+]+);base64,(.*)$/)!;
    return { type: 'file' as const, mediaType, data };
  });
  const result = await generateText({
    model: openrouter(RENDER_MODEL, { usage: { include: true } }),
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: renderPrompt(parts, brief) }, ...images]
      }
    ]
  });
  const { usage } = (result.finalStep.providerMetadata?.openrouter ?? {}) as {
    usage?: { cost?: number };
  };
  console.log(
    `[${RENDER_MODEL}] prototype render: ${usage?.cost != null ? `$${usage.cost.toFixed(4)}` : 'cost n/a'}, ` +
      `${((Date.now() - started) / 1000).toFixed(1)} s`
  );
  const file = result.files.find((f) => f.mediaType.startsWith('image/'));
  if (!file) throw new Error('No image returned');
  return {
    bytes: file.uint8Array as Uint8Array<ArrayBuffer>,
    mediaType: file.mediaType,
    cost: usage?.cost ?? null
  };
});
