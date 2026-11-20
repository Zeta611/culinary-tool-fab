<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import { FontLinks } from '#lib/components/ui/index.js';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<FontLinks />

{@render children()}
