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

  import AddInputNode from '#lib/components/AddInputNode.svelte';
  import ImageInputNode from '#lib/components/ImageInputNode.svelte';
  import ImagePreviewNode from '#lib/components/ImagePreviewNode.svelte';
  import PlaceholderNode from '#lib/components/PlaceholderNode.svelte';
  import TextInputNode from '#lib/components/TextInputNode.svelte';
  import { store } from '#lib/core.svelte.ts';
  import { setGraphContext } from '#lib/graph-context.ts';

  const nodeTypes = {
    imageInputNode: ImageInputNode,
    textInputNode: TextInputNode,
    addInputNode: AddInputNode,
    imagePreviewNode: ImagePreviewNode,
    placeholderNode: PlaceholderNode
  };

  const GAP_X = 400;
  const GAP_Y = 300;

  let nodes = $state.raw([
    ...store.imageInputs.entries().map(([id], i) => ({
      id,
      type: 'imageInputNode',
      position: { x: 0, y: i * GAP_Y },
      sourcePosition: Position.Right,
      data: {}
    })),
    ...store.textInputs.entries().map(([id], i) => ({
      id,
      type: 'textInputNode',
      position: { x: 0, y: (store.imageInputs.size + i) * GAP_Y },
      sourcePosition: Position.Right,
      data: {}
    })),
    {
      id: 'add-input',
      type: 'addInputNode',
      deletable: false,
      position: { x: 0, y: (store.imageInputs.size + store.textInputs.size) * GAP_Y },
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'preview',
      type: 'imagePreviewNode',
      deletable: false,
      position: { x: GAP_X, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'part1',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 2 * GAP_X, y: -150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'part2',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 2 * GAP_X, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'part3',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 2 * GAP_X, y: 450 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'tool1',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 3 * GAP_X, y: -150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'tool2',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 3 * GAP_X, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'tool3',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 3 * GAP_X, y: 450 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'prototype',
      type: 'placeholderNode',
      deletable: false,
      position: { x: 4 * GAP_X, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    }
  ]);

  let edges = $state.raw([
    {
      id: 'add-input-preview',
      source: 'add-input',
      target: 'preview',
      animated: true
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

  function insertInputNode(id: string, type: 'imageInputNode' | 'textInputNode') {
    const add = nodes.find((n) => n.id === 'add-input')!;
    nodes = [
      ...nodes.map((n) =>
        n === add ? { ...n, position: { ...n.position, y: n.position.y + GAP_Y } } : n
      ),
      {
        id,
        type,
        position: add.position,
        sourcePosition: Position.Right,
        data: {}
      }
    ];
    edges = [...edges, { id: `${id}-preview`, source: id, target: 'preview', animated: true }];
    return id;
  }

  setGraphContext({
    addImageInput: (image) => insertInputNode(store.addImageInput(image), 'imageInputNode'),
    addTextInput: (text) => insertInputNode(store.addTextInput(text), 'textInputNode')
  });
</script>

<div class="h-screen w-screen">
  <SvelteFlow
    bind:nodes
    bind:edges
    ondelete={({ nodes }) => nodes.forEach((n) => store.removeInput(n.id))}
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
