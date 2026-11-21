<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const props: NodeProps = $props();
</script>

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20"
>
  <div class="size-40 bg-base-300"></div>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
</div>
