import { createContext } from 'svelte';

interface Graph {
  addImageInput(image: File): string;
  addTextInput(text: string): string;
}

export const [getGraphContext, setGraphContext] = createContext<Graph>();
