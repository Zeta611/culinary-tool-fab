<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  import { download } from '#lib/fab/export.ts';
  import { canRunPrototype, fab, fabResults, runPrototypeRender } from '#lib/fab/fab.svelte.ts';

  // eslint-disable-next-line no-empty-pattern
  let {}: NodeProps = $props();

  const agent = $derived(fab.prototype);
  const image = $derived(fabResults.prototype);
  const busy = $derived(agent.status === 'running' || agent.status === 'queued');

  let dialog: HTMLDialogElement;

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }
</script>

{#snippet placeholder(cls: string)}
  <div class={['grid place-items-center bg-base-300 text-base-content/30', cls]}>
    <span class="icon-[hugeicons--square-lock-02] text-4xl" aria-hidden="true"></span>
  </div>
{/snippet}

<div
  class={[
    'card overflow-hidden bg-base-100 shadow-sm transition-[translate] duration-200 ease-out card-border in-[.selected]:border-primary in-[.selected]:ring-3 in-[.selected]:ring-primary/20 motion-safe:hover:-translate-y-0.5',
    agent.status === 'error' ? 'border-error/60' : 'border-base-content/20'
  ]}
>
  <button
    class="relative block cursor-pointer"
    title="Open culinary prototype"
    aria-label="Open culinary prototype"
    onclick={() => dialog.showModal()}
  >
    {#if image}
      <img src={image.url} alt="Prototype render" class="size-40 object-cover" />
    {:else}
      {@render placeholder('size-40')}
    {/if}
    {#if busy}
      <span class="absolute inset-0 grid place-items-center bg-base-100/60 backdrop-blur-sm">
        <span class={['loading', agent.status === 'queued' ? 'loading-dots' : 'loading-spinner']}
        ></span>
      </span>
    {/if}
  </button>

  <dialog bind:this={dialog} class="modal" {@attach portal}>
    <div class="modal-box flex max-h-[90vh] w-11/12 max-w-3xl flex-col gap-4">
      <h3 class="pr-8 text-lg font-semibold">Culinary prototype</h3>

      {#if image}
        <img src={image.url} alt="Prototype render" class="w-full rounded-box object-contain" />
        <div class="flex items-center gap-3 text-xs text-base-content/60">
          <img src={image.cad} alt="CAD render of the parts" class="size-16 rounded object-cover" />
          Rendered from the parts' CAD geometry, with your text brief guiding the presentation.
        </div>
      {:else}
        {@render placeholder('aspect-square w-full rounded-box')}
      {/if}

      {#if busy}
        <div class="flex items-center gap-2 text-xs text-base-content/60">
          <span class="loading loading-xs loading-dots" aria-hidden="true"></span>
          {agent.status === 'queued' ? 'Queued…' : agent.phase}
        </div>
      {/if}

      {#if agent.error}
        <div role="alert" class="alert alert-soft text-sm alert-error">
          <span class="icon-[hugeicons--alert-circle] text-lg" aria-hidden="true"></span>
          {agent.error}
        </div>
      {/if}

      <div class="flex gap-2">
        {#if image}
          <button
            class="btn btn-ghost btn-sm"
            onclick={() =>
              download(image.file, `prototype.${image.file.type.split('/')[1] ?? 'png'}`)}
          >
            Download
          </button>
        {/if}
        <button
          class="btn flex-1 btn-primary btn-sm"
          disabled={!canRunPrototype()}
          onclick={() => runPrototypeRender()}
        >
          {#if agent.status === 'running'}
            <span class="loading loading-xs loading-spinner" aria-hidden="true"></span>
            Rendering…
          {:else}
            <span class="icon-[hugeicons--ai-auto-rotate] text-base" aria-hidden="true"></span>
            {image ? 'Regenerate' : 'Generate'}
          {/if}
        </button>
      </div>

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
