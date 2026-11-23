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
  let draft = $state('');

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
</script>

<dialog bind:this={dialog} class="modal" {@attach portal}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">
      {props.type === 'image' ? 'Upload an image' : 'Input a text prompt'}
    </h3>
    <div class="flex flex-col items-center gap-3">
      {#if props.type === 'image'}
        {#if props.imageURL}
          {@render props.imageInput(props.imageURL)}
        {:else}
          {@render props.placeholder()}
        {/if}

        <input
          type="file"
          accept="image/*"
          class="file-input file-input-sm"
          onchange={props.handleFileChange}
        />
      {:else}
        <textarea
          bind:value={draft}
          class="textarea textarea-lg"
          placeholder="Type your inspiration"></textarea>
      {/if}
    </div>
    <div class="modal-action">
      <form method="dialog">
        {#if props.type === 'text'}
          <button class="btn btn-primary" onclick={() => props.onSave(draft)}>Save</button>
        {/if}
        <!-- if there is a button, it will close the modal -->
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
