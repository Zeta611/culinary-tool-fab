<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import { store } from '#lib/core.svelte.ts';

  import InputNodeDialog from './InputNodeDialog.svelte';

  let { id }: NodeProps = $props();

  const imageURL = $derived(store.imageInputs.get(id)?.objectURL ?? null);

  function handleFileChange(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    store.setImageInput(id, file);
  }

  let dialog: InputNodeDialog;
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
  <button class="cursor-pointer" title="inspiration image input" onclick={() => dialog.showModal()}>
    {#if imageURL}
      {@render imageInput(imageURL)}
    {:else}
      {@render placeholder()}
    {/if}
  </button>

  <InputNodeDialog
    bind:this={dialog}
    type="image"
    {handleFileChange}
    {imageURL}
    {imageInput}
    {placeholder}
  />
</div>
<Handle type="source" position={Position.Right} />
