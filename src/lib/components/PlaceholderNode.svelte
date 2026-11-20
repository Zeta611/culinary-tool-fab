<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { FlowNodeBody, FlowNodeCard, FlowNodeMedia } from '#lib/components/ui/index.js';

  let { data: _data }: NodeProps = $props();
</script>

<FlowNodeCard kind="Stage">
  <FlowNodeMedia size="lg" />
  <FlowNodeBody>Placeholder</FlowNodeBody>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
</FlowNodeCard>
