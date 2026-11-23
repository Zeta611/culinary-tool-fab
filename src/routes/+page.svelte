<script lang="ts">
  import '@xyflow/svelte/dist/style.css';

  import {
    Background,
    BackgroundVariant,
    Controls,
    Panel,
    Position,
    SvelteFlow
  } from '@xyflow/svelte';

  import ImageInputNode from '#lib/components/ImageInputNode.svelte';
  import ImagePreviewNode from '#lib/components/ImagePreviewNode.svelte';
  import PlaceholderNode from '#lib/components/PlaceholderNode.svelte';
  import TextInputNode from '#lib/components/TextInputNode.svelte';
  import { store } from '#lib/core.svelte.ts';

  const nodeTypes = {
    imageInputNode: ImageInputNode,
    textInputNode: TextInputNode,
    imagePreviewNode: ImagePreviewNode,
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
      id: 'input3',
      type: 'textInputNode',
      position: { x: 0, y: 600 },
      data: {}
    },
    {
      id: 'preview',
      type: 'imagePreviewNode',
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
      id: 'input3-preview',
      source: 'input3',
      target: 'preview',
      animated: true,
      label: 'text'
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
    ondelete={({ nodes }) => nodes.forEach((n) => store.removeInputImage(n.id))}
    {nodeTypes}
    nodeOrigin={[0.5, 0.5]}
    fitView
    proOptions={{ hideAttribution: true }}
  >
    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

    <Panel position="bottom-center">
      <ul
        class="steps rounded-box border border-base-content/10 bg-base-200 px-4 py-2 text-xs shadow-sm"
      >
        <li class="step step-neutral">Inspirations</li>
        <li class="step step-neutral font-medium">Image Preview</li>
        <li class="step text-base-content/50">Tangible Parts</li>
        <li class="step text-base-content/50">Tool Design</li>
        <li class="step text-base-content/50">Culinary Prototype</li>
      </ul>
    </Panel>
    <Controls />
  </SvelteFlow>
</div>
