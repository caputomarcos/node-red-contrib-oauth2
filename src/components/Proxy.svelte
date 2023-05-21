<script>
	export let node
	import { Callout, Collapsible, Group, Input } from 'svelte-integration-red/components'
	import { _ } from "../libs/i18n";

</script>

<Group clazz="paddingAdvanced">
	<Group clazz="paddingBottom" {node} label="{$_("credentials.proxy")}" icon="minus" tooltip="{$_('tooltip.proxy')}">
		<Input type="config" {node} prop="proxy" disabled={node.disableInput} />
	</Group>
</Group>

