import { SvelteMap } from 'svelte/reactivity';

const inputImages = new SvelteMap<string, string>();

export const store = $state({
  get inputImages() {
    return inputImages;
  },

  setInputImage(nodeId: string, file: File) {
    const old = inputImages.get(nodeId);
    if (old) URL.revokeObjectURL(old);
    inputImages.set(nodeId, URL.createObjectURL(file));
  },

  removeInputImage(nodeId: string) {
    const url = inputImages.get(nodeId);
    if (url) URL.revokeObjectURL(url);
    inputImages.delete(nodeId);
  },
});
