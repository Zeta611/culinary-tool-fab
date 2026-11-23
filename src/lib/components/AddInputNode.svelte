<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import { store } from '#lib/core.svelte.ts';
  import { getGraphContext } from '#lib/graph-context.ts';

  import InputNodeDialog from './InputNodeDialog.svelte';

  // eslint-disable-next-line no-empty-pattern
  let {}: NodeProps = $props();

  let id: string | null = $state(null);

  const { addImageInput, addTextInput } = getGraphContext();

  function handleFileChange(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    id = addImageInput(file);
    imageInputNodeDialog.close();
  }

  const imageURL = $derived(id === null ? null : (store.imageInputs.get(id)?.objectURL ?? null));

  let imageInputNodeDialog: InputNodeDialog;
  let textInputNodeDialog: InputNodeDialog;
</script>

{#snippet placeholder()}
  <div class="size-40 rounded-box bg-base-300"></div>
{/snippet}

{#snippet imageInput(imageURL: string)}
  <img src={imageURL} alt="Inspiration input" class="size-40 rounded-box object-cover" />
{/snippet}

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <div class="flex size-40 flex-col gap-2 p-2">
    <button
      class="btn h-auto flex-1 border-dashed btn-outline text-sm font-medium text-base-content/70"
      onclick={() => {
        id = null;
        imageInputNodeDialog.showModal();
      }}
    >
      + Image
    </button>
    <button
      class="btn h-auto flex-1 border-dashed btn-outline text-sm font-medium text-base-content/70"
      onclick={() => textInputNodeDialog.showModal()}
    >
      + Text
    </button>

    <InputNodeDialog
      bind:this={imageInputNodeDialog}
      type="image"
      {handleFileChange}
      {imageURL}
      {imageInput}
      {placeholder}
    />
    <InputNodeDialog
      bind:this={textInputNodeDialog}
      type="text"
      savedInput=""
      onSave={(text) => addTextInput(text)}
    />
  </div>
</div>
<Handle type="source" position={Position.Right} />
