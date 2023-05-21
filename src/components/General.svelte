<script>
  export let node;
  import { Button, Callout, Collapsible, Group, Input, Row, Select, TypedInput } from 'svelte-integration-red/components';
  import { _ } from '../libs/i18n';

  const errorHandlingOptions = [`${$_('standard.label')}`, 'other output', 'throw exception', 'all in one'];

  let testTypes = [
    {
      value: 'oauth2Response',
      label: 'default',
      icon: 'red/images/typedInput/bool.svg',
      options: [
        { value: 'oauth2Response', label: 'oauth2Response' },
        { value: 'response', label: 'response' },
        { value: 'payload', label: 'payload' }
      ]
    }
  ];

  /*
   * Reactivity declarations / statements are a great way to create a dynamic editor. You'll find more on this here:
   * https://svelte.dev/tutorial/reactive-declarations
   * https://svelte.dev/tutorial/reactive-statements
   */
  $: contentTypes = [...['msg'], ...testTypes];
</script>

{#if node.showBanner}
  <Button inline small icon="close" on:click={() => (node.showBanner = false)} />
  <br />
  <div class="flex">
    <div style="display:flex; flex-direction:column;">
      <p style="float: left">
        <img src="icons/oauth2/logo.svg" alt="oauth2" />
      </p>
      <p style="margin:0;">
        {$_('about.oauth2')}
      </p>
      <p style="float: right;">
        <a href="https://www.ietf.org/rfc/rfc6749.txt" style=" color: #2687E9; float: right;" target="_blank" title="The OAuth 2.0 Authorization Framework">rfc6749</a>
      </p>
    </div>
  </div>
  <br />
{/if}

<Collapsible label={$_('general.title')} indented={false} icon="globe">
  <Group clazz="paddingBottom">
    <Input bind:node prop="name" label={$_('general.name')} />
    <TypedInput {node} prop="container" typeProp="containerOpts" bind:types={contentTypes} label={$_('general.container')} disabled={node.disableInput} bind:tooltip={node.container} />
    <Select bind:node prop="errorHandling" label={$_('general.errorHandling')} icon="warning" disabled={node.disableInput}>
      {#each errorHandlingOptions as eOption}
        <option value={eOption}>{eOption}</option>
      {/each}
    </Select>
  </Group>
</Collapsible>

<style>
  .flex {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ccc;
    background-color: #ffe;
    border-radius: 8px;
    max-width: 500px;
    margin: auto;
  }
</style>
