<script>
  export let node, data;

  import { onMount } from 'svelte';
  import { Callout, Collapsible, Group, Input, Row, Button } from 'svelte-integration-red/components';
  import { _, locale, locales } from '../libs/i18n';

  import Proxy from './Proxy.svelte';
  import Headers from './Headers.svelte';
  import Extra from './Extra.svelte';

  onMount(() => {
    locale.set(node.language);
  });
</script>

<Group>
  <Group label="General" icon="plus">
    <svelte:fragment slot="header">
      <label class="block">
        <!-- <label for="locale-select">{$_("general.locale")}</label> -->
        <span class="block">{$_('general.language')}</span>
        <select class="block select" bind:value={$locale} icon="warning" disabled={node.disableInput} on:change={(event) => (node.language = event.target.value)}>
          {#each locales as l}
            <option value={l}>{l}</option>
          {/each}
        </select>
      </label>
    </svelte:fragment>

    <Collapsible label="Options" indented={false}>
      <Input bind:node prop="keepAuth" labelBeforeCheckbox={true} disabled={node.disableInput} />
      {#if node.keepAuth}
        <Callout type="info" small>
          Enabling <b>'Keep authentication'</b> preserves <b>msg.oauth2Request</b> payload for other flow nodes.
        </Callout>
      {/if}
      <Input bind:node prop="devMode" labelBeforeCheckbox={true} disabled={node.disableInput} />
      {#if node.devMode}
        <Callout type="warning">
          <span slot="header">Warning!</span>
          <p>Dev mode is experimental!</p>
          <p>Allows to make otherwise rejected calls like when using self signed or expired certificates.</p>
        </Callout>
      {/if}
      <Input bind:node prop="showBanner" labelBeforeCheckbox={true} disabled={node.disableInput} />
      {#if node.showBanner}
        <Callout type="info" small>
          Display the <b>OAuth2 protocol</b> banner on the general tab.
        </Callout>
      {/if}
      <Input bind:node prop="disableInput" labelBeforeCheckbox={true} />
      {#if node.disableInput}
        <Callout type="info" small>Disable Input.</Callout>
      {/if}
    </Collapsible>
  </Group>

  <Collapsible label="HTTP" icon="plus">
    <Proxy bind:node bind:data />
    <Headers bind:node />
    <Extra bind:node />
  </Collapsible>
</Group>

<style>
  .select {
    width: 40%;
    max-width: 40%;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 6px 10px 6px 4px;
  }

  .block {
    display: block ruby;
    margin-right: 0px;
    position: inherit;
    text-align: right;
  }
</style>
