<script>
  export let node
  import { Button, Callout, Collapsible, Group, Row, Select, TypedInput, Input } from 'svelte-integration-red/components'
    
  import { _ } from 'svelte-i18n'
  import { dictionary, locale, locales } from 'svelte-i18n';
  
  dictionary.set({
      "en-US" : {
        label: { 
          clientId: "CAPUTO"
        },
        tooltip: {
            settings: "This is a group. It has 2 input fields grouped.\n\nThose fields like it very much to be grouped as they feel really close to each other."
        }
      }
  });
  locale.set('en-US');

  /* 
	 * Reactivity declarations / statements are a great way to create a dynamic editor. You'll find more on this here:
	 * https://svelte.dev/tutorial/reactive-declarations
	 * https://svelte.dev/tutorial/reactive-statements
	 */
	$: grantOpts = [
    { value: "oauth2Request", 
      label: "grant type",
      icon: "red/images/typedInput/bool.svg",
      options: [
        { value: "oauth2Request", label: "Set by msg.oauth2Request" },
        { value: "clientCredentials", label: "Client Credentials" },
        { value: "password", label: "Password" },
        { value: "authorizationCode", label: "Authorization Code" },
    ]}
  ]

  let show_password = false
  let show_client_secret = false

</script>

<style></style>


<!-- <select bind:value={$locale}>
  {#each $locales as locale}
    <option value={locale}>{locale}</option>
  {/each}
</select> -->

<Group clazz="paddingBottom">
  <TypedInput bind:node inline prop="grantType" typeProp="grantOpts" bind:types={grantOpts} disabled={node.disableInput}  bind:tooltip={node.grantType}/>
    {#if node.grantType === 'clientCredentials'} 
      <Group clazz="paddingBottom" {node} label="label.settings" icon="minus" tooltip="{$_('tooltip.settings')}">
        <Input bind:node prop="accessTokenUrl" maximize icon="link" label="label.accessTokenUrl" disabled={node.disableInput}/>
        <Input bind:node prop="clientId" maximize icon="id-card" label = "label.clientId" disabled={node.disableInput}/>
        <Row>
          <Input bind:node prop="clientSecret" maximize icon="key" inline label = "label.clientSecret" type={show_client_secret ? "text" : "password"} disabled={node.disableInput}/>
          <Button inline icon={show_client_secret ? "eye" : "eye-slash"}  type="button" on:click="{ () => show_client_secret = !show_client_secret }">{show_client_secret ? 'Hide' : 'Show'}</Button>
        </Row>        
        <Input bind:node prop="scope" maximize icon="code" label = "label.scope" disabled={node.disableInput}/>
      </Group>
    {:else if node.grantType === 'password'} 
      <Group clazz="paddingBottom" {node} label="label.settings" icon="minus" tooltip="{$_('tooltip.settings')}">
        <Input bind:node prop="accessTokenUrl" maximize icon="link" label="label.accessTokenUrl" disabled={node.disableInput}/>
        <Input bind:node prop="userName" maximize icon="user" label = "label.userName" disabled={node.disableInput}/>
        <Row>
          <Input bind:node prop="password" maximize inline icon="key"  label = "label.password" type={show_password ? "text" : "password"}  disabled={node.disableInput}/>
          <Button inline icon={show_password ? "eye" : "eye-slash"}  type="button" on:click="{ () => show_password = !show_password }">{show_password ? 'Hide' : 'Show'}</Button>
        </Row>
        <Input bind:node prop="clientId" maximize icon="id-card" label  = "label.clientId" disabled={node.disableInput}/>
        <Row>
          <Input bind:node prop="clientSecret" maximize icon="key" inline label = "label.clientSecret" type={show_client_secret ? "text" : "password"} disabled={node.disableInput}/>
          <Button inline icon={show_client_secret ? "eye" : "eye-slash"}  type="button" on:click="{ () => show_client_secret = !show_client_secret }">{show_client_secret ? 'Hide' : 'Show'}</Button>
        </Row>
        <Input bind:node prop="scope" maximize icon="code" label = "label.scope" disabled={node.disableInput}/>
      </Group>
    {:else if node.grantType === 'authorizationCode'} 
      <Group clazz="paddingBottom" {node} label="label.settings" icon="minus" tooltip="{$_('tooltip.settings')}">
        <Input bind:node prop="accessTokenUrl" maximize icon="link" label="label.accessTokenUrl" disabled={node.disableInput}/>
        <Input bind:node prop="authorizationEndpoint" maximize icon="link" label = "label.authorizationEndpoint" disabled={node.disableInput}/>
        <Input bind:node prop="clientId" maximize icon="id-card" disabled={node.disableInput}/>
        <Row>
          <Input bind:node prop="clientSecret" maximize icon="key" inline label = "label.clientSecret" type={show_client_secret ? "text" : "password"} disabled={node.disableInput}/>
          <Button inline icon={show_client_secret ? "eye" : "eye-slash"}  type="button" on:click="{ () => show_client_secret = !show_client_secret }">{show_client_secret ? 'Hide' : 'Show'}</Button>
        </Row>
        <Input bind:node prop="scope" maximize icon="code" label = "label.scope" disabled={node.disableInput}/>
        <Row>
          <Input bind:node prop="code" maximize icon="sign-in" label="label.code" inline disabled={node.disableInput}/>
          <Button inline  icon="key" on:click={() => alert("You selected: " + node.selection)} disabled={node.disableInput}/>
        </Row>
      </Group>
    {/if}
</Group>
