<script lang="ts">
	import type { WalkStep } from './walk.js';

	let {
		steps,
		label = 'Pipeline stages'
	}: {
		steps: WalkStep[];
		label?: string;
	} = $props();
</script>

<nav class="walk-panel" aria-label={label}>
	<ol class="walk-steps">
		{#each steps as step (step.label)}
			<li data-state={step.state && step.state !== 'todo' ? step.state : undefined}>
				{step.label}
			</li>
		{/each}
	</ol>
</nav>
