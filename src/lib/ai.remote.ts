import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import * as v from 'valibot';

import { OPENROUTER_API_KEY } from '$app/env/private';
import { command, query } from '$app/server';

const TEXT_MODEL = 'nvidia/nemotron-3.5-super-vl:free';
const MULTI_MODEL = 'google/gemini-3.1-flash-lite-image';
// const DECISION_MODEL = "perplexity/pplx-decider-v1.3:free";

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY
});

export const test = query(v.string(), async (prompt) => {
  const { text } = await generateText({
    model: openrouter.chat(TEXT_MODEL),
    prompt
  });
  return text;
});

const MAX_IMAGES = 4;
const imagePreviewInputSchema = v.object({
  images: v.pipe(
    v.array(
      v.pipe(
        v.string(),
        v.regex(/^data:image\/(png|jpeg|webp);base64,/, 'Must be a PNG, JPEG or WebP data URL')
      )
    ),
    v.maxLength(MAX_IMAGES, 'Too many images')
  ),
  texts: v.array(v.pipe(v.string(), v.trim()))
});

export const generateImagePreview = command(imagePreviewInputSchema, async ({ images, texts }) => {
  if (images.length === 0 && texts.length === 0) throw new Error('Provide an input');
  if (images.length > MAX_IMAGES) throw new Error('Too many images');

  const result = await generateText({
    model: openrouter(MULTI_MODEL, { usage: { include: true } }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: texts.join('\n') },
          ...images.map((image) => ({ type: 'image' as const, image })) // data URLs
        ]
      }
    ]
  });

  const { usage } = (result.finalStep.providerMetadata?.openrouter ?? {}) as {
    usage?: { promptTokens?: number; completionTokens?: number; cost?: number };
  };
  console.log(
    `[${MULTI_MODEL}] input ${usage?.promptTokens ?? result.usage.inputTokens} tok, ` +
      `output ${usage?.completionTokens ?? result.usage.outputTokens} tok, ` +
      `cost ${usage?.cost != null ? `$${usage.cost.toFixed(5)}` : 'n/a'} ` +
      `(${images.length} image${images.length === 1 ? '' : 's'} in)`
  );

  const file = result.files.find((f) => f.mediaType.startsWith('image/'));
  if (!file) throw new Error('No image returned');
  return { bytes: file.uint8Array as Uint8Array<ArrayBuffer>, mediaType: file.mediaType };
});
