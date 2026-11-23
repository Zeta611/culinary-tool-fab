<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';
  import hyphen from 'hyphen/en';

  import { store } from '#lib/core.svelte.ts';

  let { id }: NodeProps = $props();

  const savedInput = $derived(store.inputTexts.get(id) ?? '');
  let currentInput = $derived(store.inputTexts.get(id) ?? '');

  function saveInput() {
    store.inputTexts.set(id, currentInput);
  }

  // perhaps use pretext in the future and use the KP line breaking algorithm
  const preview = $derived(hyphen.hyphenateSync(savedInput));

  let dialog: HTMLDialogElement;

  // fix the exit animation playing inside the node
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }
</script>

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <button class="cursor-pointer" title="inspiration image input" onclick={() => dialog.showModal()}>
    <div class="size-40 p-1">
      <div class="line-clamp-6 text-justify">{preview}</div>
    </div>
  </button>

  <!-- nest the dialog to fix HMR -->
  <dialog bind:this={dialog} class="modal" {@attach portal}>
    <div class="modal-box">
      <h3 class="text-lg font-bold">Input a text prompt</h3>
      <div class="flex flex-col items-center gap-3">
        <textarea
          bind:value={currentInput}
          class="textarea textarea-lg"
          placeholder="Type your inspiration"></textarea>
      </div>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-primary" onclick={saveInput}>Save</button>
          <!-- if there is a button, it will close the modal -->
          <button class="btn">Close</button>
        </form>
      </div>
    </div>
  </dialog>
</div>
<Handle type="source" position={Position.Right} />
