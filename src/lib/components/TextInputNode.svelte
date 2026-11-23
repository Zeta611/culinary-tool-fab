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
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <button
    class="cursor-pointer"
    title="Edit text inspiration"
    aria-label="Edit text inspiration"
    onclick={() => dialog.showModal()}
  >
    <div class="size-40 p-2 text-left text-xs">
      <p class="line-clamp-9 hyphens-manual">{preview}</p>
    </div>
  </button>

  <InputNodeDialog
    bind:this={dialog}
    type="text"
    {savedInput}
    onSave={(text) => store.setTextInput(id, text)}
  />
</div>
<Handle type="source" position={Position.Right} />
