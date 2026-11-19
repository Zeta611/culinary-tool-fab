<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  let { data: _data }: NodeProps = $props();
</script>

<div class="flex flex-col items-center gap-2">
  <div class="h-64 w-64 skeleton"></div>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
</div>
