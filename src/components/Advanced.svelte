<script>
	export let node
	import {
		Callout,
		Collapsible,
		Group,
		Input,
		Row,
		Button
	} from 'svelte-integration-red/components'
	import { _, locale, locales } from '../libs/i18n'
	import { onMount } from 'svelte'

	onMount(() => {
		locale.set(node.language)
	})
</script>
<Group slot="header" clazz="paddingBottom" style="justify-content: space-between; margin-right: 6px;">
	<Row>
		<label class="block">
			<!-- <label for="locale-select">{$_("general.locale")}</label> -->
			<span class="block">{$_("general.language")}</span>
			<select class="block select" bind:value={$locale} icon="warning" disabled={node.disableInput} on:change="{event => node.language = event.target.value}">
				{#each locales as l}
					<option value={l}>{l}</option>
				{/each}
			</select>
		</label>
	</Row>		
</Group>
<Group clazz="paddingAdvanced">
	<Collapsible label="Request" indented={false}>
		<Input bind:node prop="clientCredentialsInBody" labelBeforeCheckbox={true} />
		{#if node.clientCredentialsInBody}
			<Callout type="info" small>
				Ensure that the client credentials are included in the token request body for authentication
				purposes.
			</Callout>
		{/if}
		<Input bind:node prop="rejectUnauthorized" labelBeforeCheckbox={true} />
		{#if node.rejectUnauthorized}
			<Callout type="info" small>
				The <b>rejectUnauthorized</b> parameter controls SSL/TLS certificate validation for the server,
				with true enforcing validation and false disabling it.
			</Callout>
		{/if}
		<Input bind:node prop="keepAuth" labelBeforeCheckbox={true} />
		{#if node.keepAuth}
			<Callout type="info" small>
				msg.openApiToken and msg.headers will not be deleted and can be seen by other nodes in the
				flow.
			</Callout>
		{/if}
	</Collapsible>
</Group>

<Collapsible label="Options" indented={false}>
	<Input bind:node prop="devMode" labelBeforeCheckbox={true} />
	{#if node.devMode}
		<Callout type="warning">
			<span slot="header">Warning!</span>
			<p>Dev mode is experimental!</p>
			<p>
				Allows to make otherwise rejected calls like when using self signed or expired certificates.
			</p>
		</Callout>
	{/if}
	<Input bind:node prop="showBanner" labelBeforeCheckbox={true} />
	{#if node.showBanner}
		<Callout type="info" small>
			Display the <b>Getnet Digital Platform API</b> banner on the general tab.
		</Callout>
	{/if}
	<Input bind:node prop="disableInput" labelBeforeCheckbox={true} />
	{#if node.disableInput}
		<Callout type="info" small>Disable Input.</Callout>
	{/if}
</Collapsible>

<style>
	.select {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 6px 10px 6px 4px;
	}

	.block {
		display: block;
		justify-content: space-between;
		margin-right: 6px;
	}
</style>
