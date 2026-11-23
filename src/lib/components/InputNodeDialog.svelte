<script lang="ts">
  import type { Snippet } from 'svelte';

  interface ImageProps {
    type: 'image';
    handleFileChange(e: Event & { currentTarget: HTMLInputElement }): void;
    imageURL: string | null;
    imageInput: Snippet<[string]>;
    placeholder: Snippet;
  }

  interface TextProps {
    type: 'text';
    savedInput: string;
    onSave(text: string): void;
  }

  const props: ImageProps | TextProps = $props();

  let dialog: HTMLDialogElement;
  let fileInput: HTMLInputElement | undefined = $state();
  let dragging = $state(false);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const files = e.dataTransfer?.files;
    if (!fileInput || !files?.length) return;
    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  let draft = $state('');
  const canSave = $derived(draft.trim() !== '');

  // fix the exit animation playing inside the node
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return () => node.remove();
  }

  export const showModal = () => {
    if (props.type === 'text') draft = props.savedInput;
    dialog.showModal();
  };
  export const close = () => dialog.close();

  function save() {
    if (props.type !== 'text' || !canSave) return;
    props.onSave(draft.trim());
    dialog.close();
  }
</script>

<dialog bind:this={dialog} class="modal" {@attach portal}>
  <div class="modal-box flex flex-col gap-4">
    <h3 class="pr-8 text-lg font-semibold">
      {props.type === 'image' ? 'Upload an image' : 'Describe your inspiration'}
    </h3>

    {#if props.type === 'image'}
      <label
        class={[
          'flex cursor-pointer flex-col items-center gap-3 rounded-box border-2 border-dashed p-5 transition-colors has-focus-visible:border-primary',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-base-content/15 hover:border-primary/50 hover:bg-base-200'
        ]}
        ondragenter={(e) => {
          e.preventDefault();
          dragging = true;
        }}
        ondragover={(e) => e.preventDefault()}
        ondragleave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) dragging = false;
        }}
        ondrop={handleDrop}
      >
        {#if props.imageURL}
          {@render props.imageInput(props.imageURL)}
        {:else}
          {@render props.placeholder()}
        {/if}
        <input
          bind:this={fileInput}
          type="file"
          accept="image/*"
          class="sr-only"
          onchange={props.handleFileChange}
        />
      </label>
    {:else}
      <form
        class="flex flex-col gap-4"
        onsubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label class="flex flex-col gap-1.5">
          <textarea
            bind:value={draft}
            class="textarea field-sizing-content max-h-[60vh] min-h-40 w-full resize-y"
            placeholder="e.g. A wagashi inspired by Mirror Lake…"
            onkeydown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              }
            }}></textarea>
          <span class="self-end text-xs text-base-content/50">
            <kbd class="kbd kbd-xs">⌘</kbd> <kbd class="kbd kbd-xs">Enter</kbd> to save
          </span>
        </label>
        <div class="modal-action mt-0">
          <button type="button" class="btn btn-ghost" onclick={() => dialog.close()}>Cancel</button>
          <button type="submit" class="btn btn-primary" disabled={!canSave}>Save</button>
        </div>
      </form>
    {/if}

    <form method="dialog">
      <button
        class="btn absolute top-3 right-3 btn-circle btn-ghost btn-sm"
        aria-label="Close"
        title="Close"
      >
        <span class="icon-[hugeicons--cancel-01] text-lg" aria-hidden="true"></span>
      </button>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
