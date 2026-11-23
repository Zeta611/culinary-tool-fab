import { SvelteMap } from 'svelte/reactivity';

import * as ai from '#lib/ai.remote.ts';

type ImageFile = { image: File; objectURL: string };

const imageInputs = new SvelteMap<string, ImageFile>();
const textInputs = new SvelteMap<string, string>();
let imagePreview: ImageFile | null = $state.raw(null);

function hasInputs() {
  return imageInputs.size > 0 || textInputs.values().some((text) => text.trim() !== '');
}

function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

let generatingImagePreview = $state(false);

export function isGeneratingImagePreview() {
  return generatingImagePreview;
}

export function canGenerateImagePreview() {
  return !generatingImagePreview && hasInputs();
}

export async function generateImagePreview() {
  if (!canGenerateImagePreview()) return;
  generatingImagePreview = true;
  try {
    const { bytes, mediaType } = await ai.generateImagePreview({
      images: await Promise.all(
        imageInputs.values().map(async ({ image }) => await fileToDataURL(image))
      ),
      texts: textInputs.values().toArray()
    });
    const image = new File([bytes], 'preview', { type: mediaType });

    if (imagePreview) URL.revokeObjectURL(imagePreview.objectURL);
    imagePreview = { image, objectURL: URL.createObjectURL(image) };
  } finally {
    generatingImagePreview = false;
  }
}

let COUNTER = 0;
export const store = {
  get imageInputs() {
    return imageInputs;
  },

  addImageInput(image: File): string {
    const id = `input${COUNTER++}`;
    imageInputs.set(id, { image, objectURL: URL.createObjectURL(image) });
    return id;
  },

  setImageInput(id: string, image: File) {
    const old = imageInputs.get(id);
    if (old) URL.revokeObjectURL(old.objectURL);
    imageInputs.set(id, { image, objectURL: URL.createObjectURL(image) });
  },

  removeImageInput(id: string) {
    const old = imageInputs.get(id);
    if (old) URL.revokeObjectURL(old.objectURL);
    imageInputs.delete(id);
  },

  get textInputs() {
    return textInputs;
  },

  addTextInput(text: string): string {
    const id = `input${COUNTER++}`;
    textInputs.set(id, text);
    return id;
  },

  setTextInput(id: string, text: string) {
    textInputs.set(id, text);
  },

  removeTextInput(id: string) {
    textInputs.delete(id);
  },

  removeInput(id: string) {
    this.removeImageInput(id);
    this.removeTextInput(id);
  },

  get imagePreview() {
    return imagePreview;
  }
};
