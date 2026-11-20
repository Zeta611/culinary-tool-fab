<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.min.css"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.min.css"
  />
</svelte:head>

{@render children()}
