<script lang="ts">
  let {
    size = 'md',
    src,
    alt = ''
  }: {
    size?: 'md' | 'lg';
    src?: string;
    alt?: string;
  } = $props();
</script>

{#if src}
  <img class={['flow-node__media', size === 'lg' && 'flow-node__media--lg']} {src} {alt} />
{:else}
  <div
    class={['flow-node__media', size === 'lg' && 'flow-node__media--lg']}
    aria-hidden="true"
  ></div>
{/if}
