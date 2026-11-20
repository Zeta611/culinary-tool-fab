<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    kind,
    children
  }: {
    kind?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="flow-node">
  {#if kind}
    <span class="flow-node__kind">{kind}</span>
  {/if}
  {@render children?.()}
</div>
