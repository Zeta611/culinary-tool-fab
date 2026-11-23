import { SvelteMap } from 'svelte/reactivity';

import * as ai from '#lib/ai.remote.ts';

type ImageFile = { image: File; objectURL: string };

const inputImages = new SvelteMap<string, ImageFile>();
const inputTexts = new SvelteMap<string, string>();
let imagePreview: ImageFile | null = $state.raw(null);

function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function generateImagePreview() {
  const { bytes, mediaType } = await ai.generateImagePreview({
    images: await Promise.all(
      inputImages.values().map(async ({ image }) => await fileToDataURL(image))
    ),
    texts: inputTexts.values().toArray()
  });
  const image = new File([bytes], 'preview', { type: mediaType });

  if (imagePreview) URL.revokeObjectURL(imagePreview.objectURL);
  imagePreview = { image, objectURL: URL.createObjectURL(image) };
}

export const store = {
  get inputImages() {
    return inputImages;
  },

  setInputImage(id: string, image: File) {
    const old = inputImages.get(id);
    if (old) URL.revokeObjectURL(old.objectURL);
    inputImages.set(id, { image, objectURL: URL.createObjectURL(image) });
  },

  removeInputImage(id: string) {
    const old = inputImages.get(id);
    if (old) URL.revokeObjectURL(old.objectURL);
    inputImages.delete(id);
  },

  get inputTexts() {
    return inputTexts;
  },

  setInputText(id: string, text: string) {
    inputTexts.set(id, text);
  },

  removeInputText(id: string) {
    inputTexts.delete(id);
  },

  get imagePreview() {
    return imagePreview;
  }
};
