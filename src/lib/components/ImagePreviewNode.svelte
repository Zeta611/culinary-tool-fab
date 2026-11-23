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
  <div class="grid size-40 place-items-center rounded-box bg-base-300 text-base-content/30">
    <span class="icon-[hugeicons--ai-image-01] text-4xl" aria-hidden="true"></span>
  </div>
{/snippet}

{#snippet previewImage(imageURL: string)}
  <img src={imageURL} alt="Generated preview" class="size-40 rounded-box object-cover" />
{/snippet}

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <button
    class="cursor-pointer"
    title="Open image preview"
    aria-label="Open image preview"
    onclick={() => dialog.showModal()}
  >
    {#if imageURL}
      {@render previewImage(imageURL)}
    {:else}
      {@render placeholder()}
    {/if}
  </button>

  <dialog bind:this={dialog} class="modal" {@attach portal}>
    <div class="modal-box flex max-w-lg flex-col gap-4">
      <h3 class="pr-8 text-lg font-semibold">Generated image</h3>
      <div class="flex flex-col items-center gap-4">
        {#if imageURL && generatePromise === null}
          {@render previewImage(imageURL)}
        {:else if generatePromise}
          {#await generatePromise}
            <div class="size-40 skeleton rounded-box bg-base-300"></div>
          {:then}
            {@render previewImage(imageURL!)}
          {:catch}
            <div role="alert" class="alert alert-soft alert-error">
              <span class="icon-[hugeicons--alert-circle] text-lg" aria-hidden="true"></span>
              Image generation failed. Try again.
            </div>
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
          <span class="icon-[hugeicons--ai-auto-rotate] text-lg" aria-hidden="true"></span>
          Generate
        </button>
      </div>

      <form method="dialog">
        <button
          class="btn absolute top-3 right-3 btn-circle btn-ghost btn-sm"
          aria-label="Close"
          title="Close"
        >
          <span class="icon-[hugeicons--cancel-01] text-lg" aria-hidden="true"></span>
        </button>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
