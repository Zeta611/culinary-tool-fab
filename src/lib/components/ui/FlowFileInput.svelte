<script lang="ts">
	let {
		accept,
		class: className = ''
	}: {
		accept?: string;
		class?: string;
	} = $props();
</script>

<input type="file" class={['nodrag', 'flow-file', className]} {accept} />
