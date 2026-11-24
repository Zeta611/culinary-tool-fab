<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import AgentLog from '#lib/components/AgentLog.svelte';
  import ModelViewer from '#lib/components/ModelViewer.svelte';
  import { download, toSTL } from '#lib/fab/export.ts';
  import {
    acceptPartsScript,
    anyToolAgentBusy,
    canRunParts,
    fab,
    fabResults,
    runAllToolAgents,
    runPartsAgent
  } from '#lib/fab/fab.svelte.ts';
  import { partsToObjects } from '#lib/fab/render.ts';

  // eslint-disable-next-line no-empty-pattern
  let {}: NodeProps = $props();

  const agent = $derived(fab.parts);
  const running = $derived(agent.status === 'running');
  /** before the first run the dialog is a compact launcher */
  const fresh = $derived(agent.status === 'idle' && !fabResults.parts);
  const thumb = $derived((fabResults.partsRenders[1] ?? fabResults.partsRenders[0])?.url);
  const objects = $derived(fabResults.parts ? partsToObjects(fabResults.parts.parts) : null);

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
  <div class={['grid place-items-center rounded-box bg-base-300 text-base-content/30', cls]}>
    <span class="icon-[hugeicons--package-01] text-4xl" aria-hidden="true"></span>
  </div>
{/snippet}

{#snippet controls()}
  <div class="flex flex-wrap items-center gap-2">
    <div class="join">
      <input
        class="btn join-item btn-sm"
        type="radio"
        name="fab-mode"
        aria-label="Full 3D"
        value="full"
        bind:group={fab.mode}
        disabled={running}
      />
      <input
        class="btn join-item btn-sm"
        type="radio"
        name="fab-mode"
        aria-label="2.5D"
        value="2.5d"
        bind:group={fab.mode}
        disabled={running}
      />
    </div>
    <button
      class="btn flex-1 btn-primary btn-sm"
      disabled={!canRunParts()}
      onclick={() => runPartsAgent()}
    >
      {#if running}
        <span class="loading loading-xs loading-spinner" aria-hidden="true"></span>
        Working…
      {:else}
        <span class="icon-[hugeicons--ai-auto-rotate] text-base" aria-hidden="true"></span>
        {fresh ? 'Generate' : 'Regenerate'}
      {/if}
    </button>
    {#if !running}
      <label
        class="btn btn-ghost btn-sm"
        title="Load a saved parts script and skip the parts agent"
      >
        Load
        <input
          type="file"
          accept=".js,text/javascript"
          class="hidden"
          onchange={async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) await acceptPartsScript(await file.text());
          }}
        />
      </label>
    {/if}
    {#if fabResults.partsCode && !running}
      <button
        class="btn btn-ghost btn-sm"
        title="Download the parts script"
        onclick={() =>
          download(new Blob([fabResults.partsCode!], { type: 'text/javascript' }), 'parts.js')}
      >
        Script
      </button>
    {/if}
  </div>
{/snippet}

<div
  class="card overflow-hidden border-base-content/20 bg-base-100 shadow-sm transition-[translate] duration-200 ease-out card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20 motion-safe:hover:-translate-y-0.5"
>
  <button
    class="relative block cursor-pointer"
    title="Open tangible parts"
    aria-label="Open tangible parts"
    onclick={() => {
      open = true;
      dialog.showModal();
    }}
  >
    {#if thumb}
      <img src={thumb} alt="" class="size-40 object-cover" />
    {:else}
      {@render placeholder('size-40 rounded-none')}
    {/if}
    {#if running}
      <span class="absolute inset-0 grid place-items-center bg-base-100/60 backdrop-blur-sm">
        <span class="loading loading-md loading-spinner"></span>
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
      <h3 class="pr-8 text-lg font-semibold">Tangible parts</h3>

      {#if fresh}
        {@render placeholder('aspect-[4/3] w-full')}
        {@render controls()}
      {:else}
        <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[3fr_2fr]">
          <div class="flex min-h-0 flex-col gap-3 overflow-y-auto">
            {#if objects && open}
              <ModelViewer {objects} class="aspect-[4/3] w-full" />
            {:else}
              {@render placeholder('aspect-[4/3] w-full')}
            {/if}

            {#if fabResults.parts?.issues.length}
              <div role="alert" class="alert alert-soft text-xs alert-warning">
                <ul class="list-disc pl-4">
                  {#each fabResults.parts.issues as issue (issue)}<li>{issue}</li>{/each}
                </ul>
              </div>
            {/if}

            {#if fabResults.parts}
              <ul class="list rounded-box border border-base-content/10">
                {#each fabResults.parts.parts as p (p.id)}
                  <li class="list-row items-center py-2">
                    <span
                      class="size-4 rounded-full border border-base-content/20"
                      style:background={p.color}
                    ></span>
                    <div class="text-sm">
                      <div class="font-medium">
                        {p.name}
                        <span class="text-base-content/50">×{p.instances.length}</span>
                        {#if p.envelope}<span class="badge badge-ghost badge-xs">
                            envelope
                          </span>{/if}
                        {#if p.kind === 'layers'}
                          <span class="badge badge-ghost badge-xs">
                            {p.layers.length} layer{p.layers.length > 1 ? 's' : ''}
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-base-content/60">
                        {p.material} · {fmt(p.stats.size)} mm
                      </div>
                      {#each p.warnings as w (w)}<div class="text-xs text-warning">{w}</div>{/each}
                    </div>
                    <button
                      class="btn btn-ghost btn-xs"
                      onclick={() => download(toSTL(p.mesh), `${p.id}.stl`)}
                    >
                      STL
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>

          <div class="flex min-h-0 flex-col gap-3">
            {@render controls()}
            {#if fabResults.accepted && !running}
              <button
                class="btn btn-outline btn-sm"
                disabled={anyToolAgentBusy()}
                onclick={() => runAllToolAgents()}
              >
                <span class="icon-[hugeicons--wrench-01] text-base" aria-hidden="true"></span>
                Redesign tools for all parts
              </button>
            {/if}
            <AgentLog
              {agent}
              runLabel="Parts run"
              codeLabel="Script"
              note={fab.mode === '2.5d' ? '2.5D mode' : ''}
            />
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
