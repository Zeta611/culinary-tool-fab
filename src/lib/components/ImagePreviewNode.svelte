<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';
  import type { ClassValue } from 'svelte/elements';

  import {
    canGenerateImagePreview,
    generateImagePreview,
    isGeneratingImagePreview,
    store
  } from '#lib/core.svelte.ts';

  // eslint-disable-next-line no-empty-pattern
  let {}: NodeProps = $props();

  let generatePromise: Promise<void> | null = $state(null);

  const imageURL = $derived(store.imagePreview?.objectURL);

  let dialog: HTMLDialogElement;

  // fix the exit animation playing inside the node
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }
</script>

{#snippet placeholder(cls: ClassValue)}
  <div class={['grid place-items-center rounded-box bg-base-300 text-base-content/30', cls]}>
    <span class="icon-[hugeicons--ai-image-01] text-4xl" aria-hidden="true"></span>
  </div>
{/snippet}

{#snippet previewImage(imageURL: string, cls: ClassValue)}
  <img src={imageURL} alt="Generated preview" class={['rounded-box object-cover', cls]} />
{/snippet}

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm transition-[translate] duration-200 ease-out card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20 motion-safe:hover:-translate-y-0.5"
>
  <button
    class="relative block cursor-pointer"
    title="Open image preview"
    aria-label="Open image preview"
    onclick={() => dialog.showModal()}
  >
    {#if imageURL}
      {@render previewImage(imageURL, 'size-40')}
    {:else}
      {@render placeholder('size-40')}
    {/if}
    {#if isGeneratingImagePreview()}
      <span class="absolute inset-0 grid place-items-center bg-base-100/60 backdrop-blur-sm">
        <span class="loading loading-md loading-spinner"></span>
      </span>
    {/if}
  </button>

  <dialog bind:this={dialog} class="modal" {@attach portal}>
    <div class="modal-box flex max-w-lg flex-col gap-4">
      <h3 class="pr-8 text-lg font-semibold">Generated image</h3>
      <div class="flex flex-col items-center gap-4">
        {#if imageURL && generatePromise === null}
          {@render previewImage(imageURL, 'aspect-square w-full')}
        {:else if generatePromise}
          {#await generatePromise}
            <div class="aspect-square w-full skeleton rounded-box bg-base-300"></div>
          {:then}
            {@render previewImage(imageURL!, 'aspect-square w-full')}
          {:catch}
            <div role="alert" class="alert w-full alert-soft alert-error">
              <span class="icon-[hugeicons--alert-circle] text-lg" aria-hidden="true"></span>
              Image generation failed. Try again.
            </div>
          {/await}
        {:else}
          {@render placeholder('aspect-square w-full')}
        {/if}

        <button
          class="btn w-full btn-primary"
          disabled={!canGenerateImagePreview()}
          onclick={() => {
            generatePromise = generateImagePreview();
          }}
        >
          {#if isGeneratingImagePreview()}
            <span class="loading loading-sm loading-spinner" aria-hidden="true"></span>
            Generating…
          {:else}
            <span class="icon-[hugeicons--ai-auto-rotate] text-lg" aria-hidden="true"></span>
            {imageURL ? 'Regenerate' : 'Generate'}
          {/if}
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
