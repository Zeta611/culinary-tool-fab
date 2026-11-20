<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { FlowFileInput, FlowNodeCard, FlowNodeMedia } from '#lib/components/ui/index.js';

  let { data: _data }: NodeProps = $props();
</script>

<FlowNodeCard kind="Image">
  <FlowNodeMedia />
  <FlowFileInput />
  <Handle type="source" position={Position.Right} />
</FlowNodeCard>
