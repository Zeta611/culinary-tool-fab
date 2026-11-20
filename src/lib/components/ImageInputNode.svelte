<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { store } from '#lib/store.svelte.ts';

  let { id, data: _data }: NodeProps = $props();

  const previewUrl = $derived(store.inputImages.get(id) ?? null);

  function handleFileChange(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    store.setInputImage(id, file);
  }

  let dialog: HTMLDialogElement;

  // fix the exit animation playing inside the node
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }
</script>

<div class="flex flex-col items-center gap-2">
  <button
    title="inspiration image input"
    type="button"
    class="nodrag cursor-pointer"
    onclick={() => dialog.showModal()}
  >
    {#if previewUrl === null}
      <div class="h-48 w-64 skeleton"></div>
    {:else}
      <img src={previewUrl} alt="Inspiration preview" class="h-48 w-64 rounded object-cover" />
    {/if}
  </button>
  <Handle type="source" position={Position.Right} />
</div>

<dialog bind:this={dialog} class="modal" {@attach portal}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">Upload an image</h3>
    <div class="flex flex-col items-center gap-3">
      {#if previewUrl === null}
        <div class="h-48 w-64 skeleton"></div>
      {:else}
        <img src={previewUrl} alt="Selected inspiration" />
      {/if}

      <input
        type="file"
        accept="image/*"
        class="file-input file-input-sm"
        onchange={handleFileChange}
      />
    </div>
    <div class="modal-action">
      <form method="dialog">
        <!-- if there is a button, it will close the modal -->
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
