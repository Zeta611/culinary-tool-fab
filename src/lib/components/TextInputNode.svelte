<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';
  import hyphen from 'hyphen/en';

  import { store } from '#lib/core.svelte.ts';

  import InputNodeDialog from './InputNodeDialog.svelte';

  let { id }: NodeProps = $props();

  const savedInput = $derived(store.textInputs.get(id) ?? '');

  // perhaps use pretext in the future and use the KP line breaking algorithm
  const preview = $derived(hyphen.hyphenateSync(savedInput));

  let dialog: InputNodeDialog;
</script>

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm transition-[translate] duration-200 ease-out card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20 motion-safe:hover:-translate-y-0.5"
>
  <button
    class="group relative cursor-pointer"
    title="Edit text inspiration"
    aria-label="Edit text inspiration"
    onclick={() => dialog.showModal()}
  >
    <div class="size-40 p-2 text-left text-xs">
      <p class="line-clamp-9 hyphens-manual">{preview}</p>
    </div>
    <span
      class="absolute right-1.5 bottom-1.5 grid size-6 place-items-center rounded-full bg-base-100 text-base-content/70 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      aria-hidden="true"
    >
      <span class="icon-[hugeicons--pencil-edit-02] text-sm"></span>
    </span>
  </button>

  <InputNodeDialog
    bind:this={dialog}
    type="text"
    {savedInput}
    onSave={(text) => store.setTextInput(id, text)}
  />
</div>
<Handle type="source" position={Position.Right} />
