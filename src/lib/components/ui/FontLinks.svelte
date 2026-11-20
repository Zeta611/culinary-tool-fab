<script lang="ts">
  import { fontStylesheets } from '#lib/design/fonts.js';
</script>

<svelte:head>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  {#each fontStylesheets as href (href)}
    <link rel="stylesheet" {href} />
  {/each}
</svelte:head>
