<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import AgentLog from '#lib/components/AgentLog.svelte';
  import ModelViewer from '#lib/components/ModelViewer.svelte';
  import { download, toSTL } from '#lib/fab/export.ts';
  import { canRunTools, fab, fabResults, runToolAgent } from '#lib/fab/fab.svelte.ts';
  import { needsMaster, toolsToObjects } from '#lib/fab/render.ts';

  let { data }: NodeProps = $props();
  const partId = $derived(data.partId as string);
  const part = $derived(fabResults.accepted?.find((p) => p.id === partId));
  const agent = $derived(fab.tools[partId]);
  const result = $derived(fabResults.tools(partId));
  const busy = $derived(agent?.status === 'running' || agent?.status === 'queued');
  const fresh = $derived(!result && (!agent || agent.status === 'idle'));
  const master = $derived(part && result && needsMaster(result.run.tools) ? part : null);
  const objects = $derived(
    result?.run.tools.length ? toolsToObjects(result.run.tools, part) : null
  );
  const caption = $derived(
    result?.run.tools.length
      ? [
          ...new Set(result.run.tools.map((t) => t.kind.replace('_', ' '))),
          ...(master ? ['master'] : [])
        ].join(' · ')
      : ''
  );

  let dialog: HTMLDialogElement;
  /** viewers (one WebGL context each) only live while the dialog is open */
  let open = $state(false);

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }

  const fmt = (s: number[]) => s.map((v) => v.toFixed(1)).join(' × ');
</script>

{#snippet placeholder(cls: string)}
  <div class={['grid place-items-center bg-base-300 text-base-content/30', cls]}>
    <span class="icon-[hugeicons--wrench-01] text-4xl" aria-hidden="true"></span>
  </div>
{/snippet}

{#snippet generate()}
  <button
    class="btn w-full btn-primary btn-sm"
    disabled={!canRunTools(partId)}
    onclick={() => runToolAgent(partId)}
  >
    {#if busy}
      <span class="loading loading-xs loading-spinner" aria-hidden="true"></span>
      Working…
    {:else}
      <span class="icon-[hugeicons--ai-auto-rotate] text-base" aria-hidden="true"></span>
      {fresh ? 'Generate' : 'Regenerate'}
    {/if}
  </button>
{/snippet}

<div
  class={[
    'card overflow-hidden bg-base-100 shadow-sm transition-[translate] duration-200 ease-out card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20 motion-safe:hover:-translate-y-0.5',
    agent?.status === 'error' ? 'border-error/60' : 'border-base-content/20'
  ]}
>
  <button
    class="relative block cursor-pointer"
    title={`Tools for ${part?.name ?? partId}`}
    aria-label={`Open tools for ${part?.name ?? partId}`}
    onclick={() => {
      open = true;
      dialog.showModal();
    }}
  >
    {#if result?.thumb}
      <img src={result.thumb} alt="" class="size-40 object-cover" />
    {:else}
      {@render placeholder('size-40')}
    {/if}
    {#if busy}
      <span class="absolute inset-0 grid place-items-center bg-base-100/60 backdrop-blur-sm">
        <span class={['loading', agent?.status === 'queued' ? 'loading-dots' : 'loading-spinner']}
        ></span>
      </span>
    {/if}
    {#if caption}
      <span
        class="absolute inset-x-0 bottom-0 truncate bg-base-100/80 px-2 py-1 text-left text-xs backdrop-blur-sm"
      >
        {caption}
      </span>
    {/if}
  </button>

  <dialog bind:this={dialog} class="modal" onclose={() => (open = false)} {@attach portal}>
    <div
      class={[
        'modal-box flex flex-col gap-4',
        fresh ? 'max-w-lg' : 'max-h-[90vh] w-11/12 max-w-6xl'
      ]}
    >
      <h3 class="pr-8 text-lg font-semibold">Tools · {part?.name}</h3>

      {#if fresh}
        {@render placeholder('aspect-[4/3] w-full rounded-box')}
        {@render generate()}
      {:else}
        <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[3fr_2fr]">
          <div class="flex min-h-0 flex-col gap-3 overflow-y-auto">
            {#if objects && open}
              <ModelViewer {objects} class="aspect-[4/3] w-full" />
            {:else}
              {@render placeholder('aspect-[4/3] w-full rounded-box')}
            {/if}

            {#if result?.run.issues.length}
              <div role="alert" class="alert alert-soft text-xs alert-warning">
                <ul class="list-disc pl-4">
                  {#each result.run.issues as issue (issue)}<li>{issue}</li>{/each}
                </ul>
              </div>
            {/if}

            {#if result}
              <ul class="list rounded-box border border-base-content/10">
                {#each result.run.tools as t (t.id)}
                  <li class="list-row items-center py-2">
                    <span class="badge badge-sm">{t.kind.replace('_', ' ')}</span>
                    <div class="text-sm">
                      <div class="font-medium">{t.name}</div>
                      <div class="text-xs text-base-content/60">
                        {fmt(t.stats.size)} mm{t.purpose ? ` · ${t.purpose}` : ''}
                      </div>
                      {#each t.warnings as w (w)}<div class="text-xs text-warning">{w}</div>{/each}
                    </div>
                    <div class="flex gap-1">
                      {#if t.svg}
                        <button
                          class="btn btn-ghost btn-xs"
                          onclick={() =>
                            download(new Blob([t.svg!], { type: 'image/svg+xml' }), `${t.id}.svg`)}
                        >
                          SVG
                        </button>
                      {/if}
                      <button
                        class="btn btn-ghost btn-xs"
                        onclick={() => download(toSTL(t.mesh), `${t.id}.stl`)}
                      >
                        STL
                      </button>
                    </div>
                  </li>
                {/each}
                {#if master}
                  <li class="list-row items-center py-2">
                    <span class="badge badge-sm">master</span>
                    <div class="text-sm">
                      <div class="font-medium">Master: {master.name}</div>
                      <div class="text-xs text-base-content/60">
                        {fmt(master.stats.size)} mm · Print the part itself, seat it in the silicone box
                        and pour silicone around it. The cured silicone is the mould.
                      </div>
                    </div>
                    <button
                      class="btn btn-ghost btn-xs"
                      onclick={() => download(toSTL(master.mesh), `${master.id}_master.stl`)}
                    >
                      STL
                    </button>
                  </li>
                {/if}
              </ul>
            {/if}
          </div>

          <div class="flex min-h-0 flex-col gap-3">
            {@render generate()}
            {#if agent}
              <AgentLog
                {agent}
                runLabel="Tools run"
                codeLabel="Tool specs"
                note={fabResults.partsMode === '2.5d' ? '2.5D mode' : ''}
              />
            {/if}
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
