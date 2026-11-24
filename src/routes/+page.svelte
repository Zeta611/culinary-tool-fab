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
  import { untrack } from 'svelte';

  import AddInputNode from '#lib/components/AddInputNode.svelte';
  import FitViewOnChange from '#lib/components/FitViewOnChange.svelte';
  import ImageInputNode from '#lib/components/ImageInputNode.svelte';
  import ImagePreviewNode from '#lib/components/ImagePreviewNode.svelte';
  import PartNode from '#lib/components/PartNode.svelte';
  import PartsNode from '#lib/components/PartsNode.svelte';
  import PartToolsNode from '#lib/components/PartToolsNode.svelte';
  import PlaceholderNode from '#lib/components/PlaceholderNode.svelte';
  import PrototypeNode from '#lib/components/PrototypeNode.svelte';
  import TextInputNode from '#lib/components/TextInputNode.svelte';
  import { store } from '#lib/core.svelte.ts';
  import { fab, fabResults } from '#lib/fab/fab.svelte.ts';
  import { setGraphContext } from '#lib/graph-context.ts';

  const nodeTypes = {
    imageInputNode: ImageInputNode,
    textInputNode: TextInputNode,
    addInputNode: AddInputNode,
    imagePreviewNode: ImagePreviewNode,
    placeholderNode: PlaceholderNode,
    partsNode: PartsNode,
    partNode: PartNode,
    partToolsNode: PartToolsNode,
    prototypeNode: PrototypeNode
  };

  const STEPS = [
    'Inspirations',
    'Image Preview',
    'Tangible Parts',
    'Tool Design',
    'Culinary Prototype'
  ];
  const current = $derived(
    ['running', 'done', 'error'].includes(fab.prototype.status)
      ? 4
      : Object.keys(fab.tools).length
        ? 3
        : fab.parts.status !== 'idle'
          ? 2
          : 1
  );

  const GAP_X = 400;
  const GAP_Y = 300;
  /** vertical spacing of the per-part columns */
  const PART_GAP_Y = 200;

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
      id: 'parts',
      type: 'partsNode',
      deletable: false,
      position: { x: 2 * GAP_X, y: 150 },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {}
    },
    {
      id: 'prototype',
      type: 'prototypeNode',
      deletable: false,
      position: { x: 5 * GAP_X, y: 150 },
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
    { id: 'preview-parts', source: 'preview', target: 'parts', animated: true }
  ]);

  // One part node and one tool node per accepted part; placeholders until then.
  const PLACEHOLDER_ROWS = 3;
  $effect(() => {
    const parts = fabResults.accepted;
    untrack(() => {
      const rows = parts?.map((p) => p.id) ?? [];
      const n = rows.length || PLACEHOLDER_ROWS;
      const y = (i: number) => 150 + (i - (n - 1) / 2) * PART_GAP_Y;
      const column = (i: number, x: number, id: string, type: string, partId?: string) => ({
        id,
        type,
        deletable: false,
        position: { x, y: y(i) },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: partId ? { partId } : {}
      });
      const fabNode = (id: string) => /^(part|tools|part-ph|tools-ph):/.test(id);
      const ids = rows.length ? rows : Array.from({ length: n }, (_, i) => String(i));
      nodes = [
        ...nodes.filter((nd) => !fabNode(nd.id)),
        ...ids.flatMap((id, i) =>
          rows.length
            ? [
                column(i, 3 * GAP_X, `part:${id}`, 'partNode', id),
                column(i, 4 * GAP_X, `tools:${id}`, 'partToolsNode', id)
              ]
            : [
                column(i, 3 * GAP_X, `part-ph:${id}`, 'placeholderNode'),
                column(i, 4 * GAP_X, `tools-ph:${id}`, 'placeholderNode')
              ]
        )
      ];
      const [part, tools] = rows.length ? ['part', 'tools'] : ['part-ph', 'tools-ph'];
      edges = [
        ...edges.filter((e) => !e.id.startsWith('fab:')),
        ...ids.flatMap((id) => [
          { id: `fab:parts-${id}`, source: 'parts', target: `${part}:${id}`, animated: true },
          {
            id: `fab:${id}-tools`,
            source: `${part}:${id}`,
            target: `${tools}:${id}`,
            animated: true
          },
          {
            id: `fab:${id}-prototype`,
            source: `${tools}:${id}`,
            target: 'prototype',
            animated: true
          }
        ])
      ];
    });
  });

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

  // dev-only handle for driving the flow from the console / tests
  if (import.meta.env.DEV) Object.assign(globalThis, { __culinary: { store, fab, fabResults } });

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
        class="steps rounded-full border border-base-content/10 bg-base-100/80 px-6 py-2.5 text-xs shadow-sm backdrop-blur-md"
      >
        {#each STEPS as label, i (label)}
          <li
            class={[
              'step',
              i <= current ? 'step-neutral' : 'text-base-content/50',
              i === current && 'font-medium'
            ]}
            aria-current={i === current ? 'step' : undefined}
          >
            {label}
          </li>
        {/each}
      </ul>
    </Panel>
    <Controls />
    <FitViewOnChange key={fabResults.accepted} />
  </SvelteFlow>
</div>
