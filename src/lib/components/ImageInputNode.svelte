<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  let { data: _data }: NodeProps = $props();
</script>

<div class="flex flex-col items-center gap-2">
  <div class="h-48 w-64 skeleton"></div>
  <input type="file" class="nodrag file-input file-input-xs" />
  <Handle type="source" position={Position.Right} />
</div>
