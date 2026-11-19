<script lang="ts">
  import { counter } from './shared.svelte.ts';

  let name = 'Svelte';

  function increment() {
    ++counter.count;
  }
</script>

<h1>Food Fab Kit</h1>
<p>Hello, {name}!</p>
<button onclick={increment}>
  Count: {counter.count}
</button>
