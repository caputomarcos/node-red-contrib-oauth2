<script>
  export let node;
  import { Callout, Collapsible, Group, Input } from 'svelte-integration-red/components';
  import { _ } from '../libs/i18n';
</script>

<Collapsible indented={false} label={$_('credentials.proxy')} icon="list">
  <Group clazz="paddingBottom">
    <Input type="config" {node} prop="proxy" disabled={node.disableInput} />
  </Group>
</Collapsible>
