<script>
  export let node;
  import { Collapsible, Group, Input, Row, EditableList, TypedInput } from 'svelte-integration-red/components';
  import { _ } from '../libs/i18n';

  const addHeaders = () => {
    node.headers.push({ key: '', value: '', type: 'str' });
    node.headers = node.headers;
  };
</script>

{#if node.headers}
  <Collapsible indented={false} label={$_('credentials.Headers')} icon="list">
    <Group clazz="paddingBottom">
      <EditableList id="headersList" sortable removable addButton label={$_('credentials.Headers.Parameters')} icon="database" bind:elements={node.headers} let:index on:add={addHeaders} disabled={node.disableInput}>
        <Row>
          <Input inline bind:value={node.headers[index].key} placeholder="key" disabled={node.disableInput} />
          <TypedInput
            inline
            value={node.headers[index].value}
            type={node.headers[index].type}
            disabled={node.disableInput}
            types={['str', 'num', 'bool', 'json']}
            placeholder="value"
            on:change={(e) => {
              node.headers[index].type = e.detail.type;
              node.headers[index].value = e.detail.value;
            }}
          />
        </Row>
      </EditableList>
    </Group>
  </Collapsible>
{/if}
