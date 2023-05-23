<script>
  export let node;
  import { Callout, Collapsible, Group, Input, Row } from 'svelte-integration-red/components';
  import { _ } from '../libs/i18n';
</script>

<Collapsible indented={false} label={$_('advanced.http.extra')} icon="list">
  <Group clazz="paddingBottom">
    <Input bind:node prop="clientCredentialsInBody" labelBeforeCheckbox={true} disabled={node.disableInput} />
    <Row>
      {#if node.clientCredentialsInBody}
        <Callout type="info" small><b>Embedded Credentials</b> include client credentials in the token request body for authentication.</Callout>
      {/if}
    </Row>
    <Input bind:node prop="rejectUnauthorized" labelBeforeCheckbox={true} disabled={node.disableInput} />
    <Row>
      {#if node.rejectUnauthorized}
        <Callout type="info" small>
          The <b>rejectUnauthorized</b> parameter enforces or disables <b>SSL/TLS</b> certificate validation for the server.
        </Callout>
      {/if}
    </Row>
  </Group>
</Collapsible>
