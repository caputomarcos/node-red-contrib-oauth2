<script>
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { Callout } from "svelte-integration-red/components";

  const dispatch = createEventDispatcher();

  export let yell;

  function deleteYell(id) {
    dispatch("change", {
      id,
    });
  }

  setTimeout(function () {
    deleteYell(yell.id);
  }, 5000);
</script>

<div out:fade>
  <Callout type="error">
    <span slot="header">Error</span>
    {yell.yell}
  </Callout>
</div>
