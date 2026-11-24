<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import ModelViewer from '#lib/components/ModelViewer.svelte';
  import { download, toSTL } from '#lib/fab/export.ts';
  import { canRunTools, fab, fabResults, runToolAgent } from '#lib/fab/fab.svelte.ts';
  import { partAlone, partsToObjects } from '#lib/fab/render.ts';

  let { data }: NodeProps = $props();
  const partId = $derived(data.partId as string);
  const part = $derived(fabResults.accepted?.find((p) => p.id === partId));
  const thumb = $derived(fabResults.partThumb(partId));
  const agent = $derived(fab.tools[partId]);

  let inScene = $state(false);
  const objects = $derived.by(() => {
    if (!part) return null;
    if (!inScene) return [partAlone(part)];
    return partsToObjects(fabResults.accepted!).map((o, i) =>
      fabResults.accepted![i].id === partId ? o : { ...o, opacity: Math.min(o.opacity ?? 1, 0.22) }
    );
  });

  let dialog: HTMLDialogElement;
  /** viewers (one WebGL context each) only live while the dialog is open */
  let open = $state(false);

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }

  const fmt = (s: number[]) => s.map((v) => v.toFixed(1)).join(' × ');
</script>

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm transition-[translate] duration-200 ease-out card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20 motion-safe:hover:-translate-y-0.5"
>
  <button
    class="relative block cursor-pointer"
    title={part?.name}
    aria-label={`Open part ${part?.name ?? partId}`}
    onclick={() => {
      open = true;
      dialog.showModal();
    }}
  >
    {#if thumb}
      <img src={thumb} alt="" class="size-40 object-cover" />
    {:else}
      <div class="size-40 bg-base-300"></div>
    {/if}
    <span
      class="absolute inset-x-0 bottom-0 truncate bg-base-100/80 px-2 py-1 text-left text-xs backdrop-blur-sm"
    >
      {part?.name}{part && part.instances.length > 1 ? ` ×${part.instances.length}` : ''}
    </span>
  </button>

  <dialog bind:this={dialog} class="modal" onclose={() => (open = false)} {@attach portal}>
    <div class="modal-box flex max-h-[90vh] w-11/12 max-w-4xl flex-col gap-4">
      <h3 class="pr-8 text-lg font-semibold">{part?.name}</h3>

      {#if part && objects}
        <div class="grid min-h-0 gap-4 md:grid-cols-[3fr_2fr]">
          <div class="flex flex-col gap-2">
            {#if open}
              <ModelViewer {objects} class="aspect-[4/3] w-full" />
            {:else}
              <div class="aspect-[4/3] w-full rounded-box bg-base-200"></div>
            {/if}
            <label class="label text-xs">
              <input type="checkbox" class="toggle toggle-xs" bind:checked={inScene} />
              Show in scene
            </label>
          </div>

          <div class="flex flex-col gap-3 text-sm">
            <div class="flex items-center gap-2">
              <span
                class="size-4 rounded-full border border-base-content/20"
                style:background={part.color}
              ></span>
              {part.material}
            </div>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt class="text-base-content/60">Size</dt>
              <dd>{fmt(part.stats.size)} mm</dd>
              <dt class="text-base-content/60">Volume</dt>
              <dd>{part.stats.volume.toFixed(0)} mm³</dd>
              <dt class="text-base-content/60">Pieces</dt>
              <dd>{part.instances.length}</dd>
              <dt class="text-base-content/60">Build</dt>
              <dd>
                {part.envelope
                  ? 'envelope'
                  : part.kind === 'layers'
                    ? `${part.layers.length} layer${part.layers.length > 1 ? 's' : ''} (${part.layers.map((l) => l.height).join(' + ')} mm)`
                    : 'free-form solid'}
              </dd>
            </dl>
            {#if part.notes}<p class="text-xs text-base-content/70">{part.notes}</p>{/if}
            {#each part.warnings as w (w)}<p class="text-xs text-warning">{w}</p>{/each}

            <div class="mt-auto flex gap-2">
              <button
                class="btn btn-ghost btn-sm"
                onclick={() => download(toSTL(part.mesh), `${part.id}.stl`)}
              >
                STL
              </button>
              <button
                class="btn flex-1 btn-primary btn-sm"
                disabled={!canRunTools(partId)}
                onclick={() => runToolAgent(partId)}
              >
                {#if agent?.status === 'running' || agent?.status === 'queued'}
                  <span class="loading loading-xs loading-spinner" aria-hidden="true"></span>
                  Designing tools…
                {:else}
                  <span class="icon-[hugeicons--wrench-01] text-base" aria-hidden="true"></span>
                  {agent?.status === 'done' ? 'Redesign tools' : 'Design tools'}
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/if}

      <form method="dialog">
        <button
          class="btn absolute top-3 right-3 btn-circle btn-ghost btn-sm"
          aria-label="Close"
          title="Close"
        >
          <span class="icon-[hugeicons--cancel-01] text-lg" aria-hidden="true"></span>
        </button>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
