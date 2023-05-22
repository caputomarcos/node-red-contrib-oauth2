<script>
  export let node;
  import { Callout, Collapsible, Group, Input, Row } from 'svelte-integration-red/components';
  import { _ } from 'node-red/node_modules/node-red-contrib-oauth2/src/libs/i18n';
</script>

<Collapsible indented={false} label={$_('credentials.proxy')} icon="list">
  <Group clazz="paddingBottom">
    <Input bind:node prop="clientCredentialsInBody" labelBeforeCheckbox={true} />
    <Row>
      {#if node.clientCredentialsInBody}
        <Callout type="info" small><b>Embedded Credentials</b> include client credentials in the token request body for authentication.</Callout>
      {/if}
    </Row>
    <Input bind:node prop="rejectUnauthorized" labelBeforeCheckbox={true} />
    <Row>
      {#if node.rejectUnauthorized}
        <Callout type="info" small>
          The <b>rejectUnauthorized</b> parameter enforces or disables <b>SSL/TLS</b> certificate validation for the server.
        </Callout>
      {/if}
    </Row>
    <Input bind:node prop="keepAuth" labelBeforeCheckbox={true} />
    <Row>
      {#if node.keepAuth}
        <Callout type="info" small>Enabling <b>'Keep authentication'</b> preserves <b>msg.oauth2Request</b> payload for other flow nodes.</Callout>
      {/if}
    </Row>
  </Group>
</Collapsible>
