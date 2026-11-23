<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import { canGenerateImagePreview, generateImagePreview, store } from '#lib/core.svelte.ts';

  // eslint-disable-next-line no-empty-pattern
  let {}: NodeProps = $props();

  let generatePromise: Promise<void> | null = $state(null);
  async function onclickGenerate() {
    await generateImagePreview();
  }

  const imageURL = $derived(store.imagePreview?.objectURL);

  let dialog: HTMLDialogElement;

  // fix the exit animation playing inside the node
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }
</script>

{#snippet placeholder()}
  <div class="size-40 rounded-box bg-base-300"></div>
{/snippet}

{#snippet previewImage(imageURL: string)}
  <img src={imageURL} alt="Generated preview" class="size-40 rounded-box object-cover" />
{/snippet}

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <button class="cursor-pointer" title="inspiration image input" onclick={() => dialog.showModal()}>
    {#if imageURL}
      {@render previewImage(imageURL)}
    {:else}
      {@render placeholder()}
    {/if}
  </button>

  <dialog bind:this={dialog} class="modal" {@attach portal}>
    <div class="modal-box">
      <h3 class="text-lg font-bold">Generated image</h3>
      <div class="flex flex-col items-center gap-3">
        {#if imageURL && generatePromise === null}
          {@render previewImage(imageURL)}
        {:else if generatePromise}
          {#await generatePromise}
            <div class="size-40 skeleton rounded-box bg-base-300"></div>
          {:then}
            {@render previewImage(imageURL!)}
          {:catch}
            Image generation error
          {/await}
        {:else}
          {@render placeholder()}
        {/if}

        <button
          class="btn btn-primary"
          disabled={!canGenerateImagePreview}
          onclick={() => {
            generatePromise = onclickGenerate();
          }}
        >
          Generate
        </button>
      </div>
      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button, it will close the modal -->
          <button class="btn">Close</button>
        </form>
      </div>
    </div>
  </dialog>
</div>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
