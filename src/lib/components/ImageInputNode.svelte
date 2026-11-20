<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  let { data: _data }: NodeProps = $props();
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
    <div class="h-48 w-64 skeleton"></div>
  </button>
  <Handle type="source" position={Position.Right} />
</div>

<dialog bind:this={dialog} class="modal" {@attach portal}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">Upload an image</h3>
    <div class="flex flex-col items-center gap-3">
      <div class="h-48 w-64 skeleton"></div>
      <input type="file" class="file-input file-input-sm" />
    </div>
    <div class="modal-action">
      <form method="dialog">
        <!-- if there is a button, it will close the modal -->
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
