<script lang="ts">
  import {
    Background,
    BackgroundVariant,
    Controls,
    Panel,
    Position,
    SvelteFlow
  } from '@xyflow/svelte';
  import '@xyflow/svelte/xy-theme.css';
  import ImageInputNode from '#lib/components/ImageInputNode.svelte';
  import PlaceholderNode from '#lib/components/PlaceholderNode.svelte';

  const nodeTypes = {
    imageInputNode: ImageInputNode,
    placeholderNode: PlaceholderNode
  };

  let nodes = $state.raw([
    {
      id: 'input1',
      type: 'imageInputNode',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'input2',
      type: 'imageInputNode',
      position: { x: 0, y: 300 },
      data: {}
    },
    {
      id: 'preview',
      type: 'placeholderNode',
      position: { x: 400, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'part1',
      type: 'placeholderNode',
      position: { x: 800, y: -150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'part2',
      type: 'placeholderNode',
      position: { x: 800, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'part3',
      type: 'placeholderNode',
      position: { x: 800, y: 450 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'tool1',
      type: 'placeholderNode',
      position: { x: 1200, y: -150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'tool2',
      type: 'placeholderNode',
      position: { x: 1200, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'tool3',
      type: 'placeholderNode',
      position: { x: 1200, y: 450 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'prototype',
      type: 'placeholderNode',
      position: { x: 1600, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    }
  ]);

  let edges = $state.raw([
    {
      id: 'input1-preview',
      source: 'input1',
      target: 'preview',
      animated: true,
      label: 'photo'
    },
    {
      id: 'input2-preview',
      source: 'input2',
      target: 'preview',
      animated: true,
      label: 'sketch'
    },
    {
      id: 'preview-part1',
      source: 'preview',
      target: 'part1',
      animated: true
    },
    {
      id: 'preview-part2',
      source: 'preview',
      target: 'part2',
      animated: true
    },
    {
      id: 'preview-part3',
      source: 'preview',
      target: 'part3',
      animated: true
    },
    {
      id: 'part1-tool1',
      source: 'part1',
      target: 'tool1',
      animated: true
    },
    {
      id: 'part2-tool2',
      source: 'part2',
      target: 'tool2',
      animated: true
    },
    {
      id: 'part3-tool3',
      source: 'part3',
      target: 'tool3',
      animated: true
    },
    {
      id: 'tool1-prototype',
      source: 'tool1',
      target: 'prototype',
      animated: true
    },
    {
      id: 'tool2-prototype',
      source: 'tool2',
      target: 'prototype',
      animated: true
    },
    {
      id: 'tool3-prototype',
      source: 'tool3',
      target: 'prototype',
      animated: true
    }
  ]);
</script>

<div class="h-screen w-screen">
  <SvelteFlow
    bind:nodes
    bind:edges
    {nodeTypes}
    nodeOrigin={[0.5, 0.5]}
    fitView
    proOptions={{ hideAttribution: true }}
  >
    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    <Panel position="bottom-center">
      <ul class="steps">
        <li class="step step-primary">Inspirations</li>
        <li class="step step-primary">Image Preview</li>
        <li class="step">Tangible Parts</li>
        <li class="step">Tool Design</li>
        <li class="step">Culinary Prototype</li>
      </ul>
    </Panel>
    <Controls />
  </SvelteFlow>
</div>
