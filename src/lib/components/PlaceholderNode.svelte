<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const props: NodeProps = $props();
</script>

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <div class="grid size-40 place-items-center bg-base-300 text-base-content/30">
    <span class="icon-[hugeicons--square-lock-02] text-4xl" aria-hidden="true"></span>
  </div>
</div>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
