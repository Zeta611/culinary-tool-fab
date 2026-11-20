<script lang="ts">
  let {
    accept,
    class: className = '',
    onchange
  }: {
    accept?: string;
    class?: string;
    onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  } = $props();
</script>

<input type="file" class={['nodrag', 'flow-file', className]} {accept} {onchange} />
