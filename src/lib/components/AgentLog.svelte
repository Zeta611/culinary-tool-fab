<script lang="ts">
  import type { AgentState } from '#lib/fab/fab.svelte.ts';

  let {
    agent,
    runLabel,
    codeLabel,
    note = ''
  }: { agent: AgentState; runLabel: string; codeLabel: string; note?: string } = $props();

  let log: HTMLElement | undefined = $state();

  $effect(() => {
    void agent.steps.length;
    log?.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  });
</script>

{#if agent.status === 'running' || agent.status === 'queued'}
  <div class="flex items-center gap-2 text-xs text-base-content/60">
    <span class="loading loading-xs loading-dots" aria-hidden="true"></span>
    {agent.status === 'queued' ? 'Queued…' : agent.phase}
  </div>
{/if}

{#if agent.cost > 0 || note}
  <div class="text-xs text-base-content/50">
    {note}{note && agent.cost > 0 ? ' · ' : ''}{agent.cost > 0 ? `$${agent.cost.toFixed(3)}` : ''}
  </div>
{/if}

{#if agent.error}
  <div role="alert" class="alert alert-soft text-sm alert-error">
    <span class="icon-[hugeicons--alert-circle] text-lg" aria-hidden="true"></span>
    {agent.error}
  </div>
{/if}

{#if agent.summary}
  <div class="rounded-box bg-base-200 p-3 text-sm whitespace-pre-wrap">{agent.summary}</div>
{/if}

<ol bind:this={log} class="flex min-h-40 flex-1 flex-col gap-3 overflow-y-auto pr-1">
  {#each agent.steps as step, i (i)}
    <li class="text-sm">
      {#if step.kind === 'model'}
        {#if step.reasoning}
          <details class="collapse-arrow collapse bg-base-200 text-xs">
            <summary class="collapse-title min-h-0 py-2 text-base-content/60">Reasoning</summary>
            <div class="collapse-content whitespace-pre-wrap">{step.reasoning}</div>
          </details>
        {/if}
        {#if step.text}<p class="mt-1 whitespace-pre-wrap">{step.text}</p>{/if}
      {:else}
        <div class="rounded-box border border-base-content/10 p-2">
          <div class="flex items-center gap-2 text-xs font-medium">
            <span
              class={[
                step.kind === 'error'
                  ? 'icon-[hugeicons--alert-circle] text-error'
                  : 'icon-[hugeicons--checkmark-circle-02] text-success',
                'text-base'
              ]}
              aria-hidden="true"
            ></span>
            {runLabel}
          </div>
          {#if step.notes}<p class="mt-1 text-xs text-base-content/70">{step.notes}</p>{/if}
          {#if step.kind === 'error'}
            <p class="mt-1 font-mono text-xs whitespace-pre-wrap text-error">{step.text}</p>
          {/if}
          {#each [...(step.issues ?? []), ...(step.warnings ?? [])] as w (w)}
            <p class="mt-1 text-xs text-warning">{w}</p>
          {/each}
          {#if step.images?.length}
            <div class="mt-2 grid grid-cols-5 gap-1">
              {#each step.images as im (im.label)}
                <img
                  src={im.url}
                  alt={im.label}
                  title={im.label}
                  class="aspect-square w-full rounded object-cover"
                />
              {/each}
            </div>
          {/if}
          {#if step.code}
            <details class="collapse-arrow collapse mt-2 bg-base-200 text-xs">
              <summary class="collapse-title min-h-0 py-2 text-base-content/60">
                {codeLabel}
              </summary>
              <pre class="collapse-content overflow-x-auto font-mono text-[11px]">{step.code}</pre>
            </details>
          {/if}
        </div>
      {/if}
    </li>
  {/each}
</ol>
