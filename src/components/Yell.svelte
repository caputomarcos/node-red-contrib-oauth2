<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Callout } from 'svelte-integration-red/components';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let message;

  onMount(() => {
    setTimeout(function () {
      dispatch('delete', {});
    }, 3000);
  });
</script>

<div out:fade>
  <Callout type="error">
    <span slot="header">Error</span>
    {message}
  </Callout>
</div>
