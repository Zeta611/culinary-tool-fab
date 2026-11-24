<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';

  /** Re-fit the viewport whenever `key` changes (after new nodes have been measured). */
  let { key }: { key: unknown } = $props();

  const { fitView } = useSvelteFlow();

  $effect(() => {
    void key;
    // once after the new nodes mount, again after their thumbnails have laid out
    const timers = [200, 700].map((ms) =>
      setTimeout(() => fitView({ duration: 400, padding: 0.12 }), ms)
    );
    return () => timers.forEach(clearTimeout);
  });
</script>
