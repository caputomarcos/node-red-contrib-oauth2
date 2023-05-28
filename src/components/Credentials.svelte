<script>
  export let node, data;

  import { Button, Callout, Collapsible, Group, Row, Select, TypedInput, Input } from 'svelte-integration-red/components';

  import { _ } from '../libs/i18n';
  import { onMount } from 'svelte';

  const encryptURL = (url) => {
    // Chave de criptografia (deve ser compartilhada com o servidor)
    const encryptionKey = 'sua_chave_de_criptografia';

    // Criptografar a URL
    return window.btoa(url + encryptionKey);
  };

  /*
   * Reactivity declarations / statements are a great way to create a dynamic editor. You'll find more on this here:
   * https://svelte.dev/tutorial/reactive-declarations
   * https://svelte.dev/tutorial/reactive-statements
   */
  $: grantOpts = [
    {
      value: 'oauth2Request',
      label: 'grant type',
      icon: 'red/images/typedInput/bool.svg',
      options: [
        { value: 'oauth2Request', label: 'Set by msg.oauth2Request' },
        { value: 'clientCredentials', label: 'Client Credentials' },
        { value: 'password', label: 'Password' },
        { value: 'authorizationCode', label: 'Authorization Code' }
      ]
    }
  ];

  let show_password = false;
  let show_client_secret = false;
  let show_code = false;

  function onClick() {
    const commonParams = `id=${encodeURIComponent(node.id)}&callback=${encodeURIComponent(
      node.callback
    )}&proxy=${encodeURIComponent(node.proxy)}&tsl=${encodeURIComponent(node.tslconfig)}`;

    let url = `oauth2/auth?banana=${encryptURL(`${commonParams}&redirectUri=${encodeURIComponent(node.redirectUri)}`)}`;

    console.log(url)

    Object.assign(document.createElement('a'), {
      target: '_blank',
      rel: 'noopener noreferrer',
      href: url
    }).click();

    const getCode = async function () {
      const res = await fetch(`oauth2/credentials/${node.id}`);
      data = await res.json();
      if (res.ok) {
        data = data;
        node.code = data.code;
      } else {
        throw new Error(data);
      }
    };
    window.configNodeIntervalId = window.setTimeout(getCode, 5000);
  }

  // Função para criptografar os dados
  const encryptData = (data, encryptionKey, iv) => {
    const keyBuffer = hexStringToBuffer(encryptionKey);
    const ivBuffer = hexStringToBuffer(iv);

    // Importar a chave usando o algoritmo AES-CBC
    return crypto.subtle
      .importKey('raw', keyBuffer, 'AES-CBC', false, ['encrypt'])
      .then((key) => {
        // Criptografar os dados usando a chave importada e o IV
        const dataBuffer = new TextEncoder().encode(data);
        return crypto.subtle.encrypt({ name: 'AES-CBC', iv: ivBuffer }, key, dataBuffer);
      })
      .then((encryptedBuffer) => {
        // Converter o resultado criptografado para uma string hexadecimal
        const encryptedData = bufferToHexString(encryptedBuffer);
        return encryptedData;
      });
  };

  // Função para decriptografar os dados
  const decryptData = async (encryptedData, encryptionKey, iv) => {
    const keyBuffer = hexStringToBuffer(encryptionKey);
    const ivBuffer = hexStringToBuffer(iv);

    try {
      // Importar a chave usando o algoritmo AES-CBC
      const key = await crypto.subtle.importKey('raw', keyBuffer, 'AES-CBC', false, ['decrypt']);

      // Descriptografar os dados usando a chave importada e o IV
      const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBuffer }, key, hexStringToBuffer(encryptedData));

      // Converter o resultado descriptografado para uma string UTF-8
      const decryptedData = new TextDecoder().decode(decryptedBuffer);

      // Converter a string para JSON
      const decryptedJSON = JSON.parse(decryptedData);

      return decryptedJSON;
    } catch (error) {
      throw new Error('Erro ao descriptografar: ' + error.message);
    }
  };

  // Função auxiliar para converter uma string hexadecimal em um ArrayBuffer
  const hexStringToBuffer = (hexString) => {
    const hexWithoutSpaces = hexString.replace(/\s/g, '');
    const bytes = new Uint8Array(hexWithoutSpaces.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    return bytes.buffer;
  };

  let accessTokenUrl, clientId, clientSecret, username, password, scope, authorizationEndpoint, code;
  onMount(async () => {
    const res = await fetch(`oauth2/secrets/${node.id}`);
    data = await res.json();
    if (res.ok) {
      console.log(data);
      decryptData(data.encryptedCredentials, data.encryptionKey, data.iv)
        .then((decryptedData) => {
          accessTokenUrl = decryptedData?.accessTokenUrl ? decryptedData.accessTokenUrl : undefined;
          clientId = decryptedData?.clientId ? decryptedData.clientId : undefined;
          clientSecret = decryptedData?.clientSecret ? decryptedData.clientSecret : undefined;
          username = decryptedData?.username ? decryptedData.username : undefined;
          password = decryptedData?.password ? decryptedData.password : undefined;
          scope = decryptedData?.scope ? decryptedData.scope : undefined;
          authorizationEndpoint = decryptedData?.authorizationEndpoint ? decryptedData.authorizationEndpoint : undefined;
          code = decryptedData?.code ? decryptedData.code : undefined;
        })
        .catch((error) => {
          console.error('Erro ao descriptografar:', error);
        });
    } else {
      throw new Error(data);
    }
  });
</script>

<Group clazz="paddingBottom">
  <TypedInput bind:node inline prop="grantType" label={$_('credentials.grantType')} typeProp="grantOpts" bind:types={grantOpts} disabled={node.disableInput} bind:tooltip={node.grantType} />
  {#if node.grantType === 'clientCredentials'}
    <Group clazz="paddingBottom" {node} label="label.settings" icon="minus" tooltip={$_('credentials.tooltip.clientCredentials')}>
      <Input bind:node bind:value={accessTokenUrl} prop="accessTokenUrl" maximize icon="link" label={$_('credentials.accessTokenUrl')} placeholder={$_('credentials.accessTokenUrl')} disabled={node.disableInput} />
      <Input bind:node bind:value={clientId} prop="clientId" maximize icon="id-card" label={$_('credentials.clientId')} placeholder={$_('credentials.clientId')} disabled={node.disableInput} />
      <Row>
        <Input
          bind:node
          bind:value={clientSecret}
          prop="clientSecret"
          maximize
          icon="key"
          inline
          label={$_('credentials.clientSecret')}
          placeholder={$_('credentials.clientSecret')}
          type={show_client_secret ? 'text' : 'password'}
          disabled={node.disableInput}
        />
        <Button inline icon={show_client_secret ? 'eye' : 'eye-slash'} type="button" on:click={() => (show_client_secret = !show_client_secret)}>{show_client_secret ? 'Hide' : 'Show'}</Button>
      </Row>
      <Input bind:node bind:value={scope} prop="scope" maximize icon="code" label={$_('credentials.scope')} placeholder={$_('credentials.scope')} disabled={node.disableInput} />
    </Group>
  {:else if node.grantType === 'password'}
    <Group clazz="paddingBottom" {node} label="label.settings" icon="minus" tooltip={$_('tooltip.settings')}>
      <Input bind:node bind:value={accessTokenUrl} prop="accessTokenUrl" maximize icon="link" label={$_('credentials.accessTokenUrl')} placeholder={$_('credentials.accessTokenUrl')} disabled={node.disableInput} />
      <Input bind:node bind:value={username} prop="username" maximize icon="user" label={$_('credentials.username')} placeholder={$_('credentials.username')} disabled={node.disableInput} />
      <Row>
        <Input bind:node bind:value={password} prop="password" maximize inline icon="key" label={$_('credentials.password')} placeholder={$_('credentials.password')} type={show_password ? 'text' : 'password'} disabled={node.disableInput} />
        <Button inline icon={show_password ? 'eye' : 'eye-slash'} type="button" on:click={() => (show_password = !show_password)}>{show_password ? 'Hide' : 'Show'}</Button>
      </Row>
      <Input bind:node bind:value={clientId} prop="clientId" maximize icon="id-card" label={$_('credentials.clientId')} placeholder={$_('credentials.clientId')} disabled={node.disableInput} />
      <Row>
        <Input
          bind:node
          bind:value={clientSecret}
          prop="clientSecret"
          maximize
          icon="key"
          inline
          label={$_('credentials.clientSecret')}
          placeholder={$_('credentials.clientSecret')}
          type={show_client_secret ? 'text' : 'password'}
          disabled={node.disableInput}
        />
        <Button inline icon={show_client_secret ? 'eye' : 'eye-slash'} type="button" on:click={() => (show_client_secret = !show_client_secret)}>{show_client_secret ? 'Hide' : 'Show'}</Button>
      </Row>
      <Input bind:node bind:value={scope} prop="scope" maximize icon="code" label={$_('credentials.scope')} placeholder={$_('credentials.scope')} disabled={node.disableInput} />
    </Group>
  {:else if node.grantType === 'authorizationCode'}
    <Group clazz="paddingBottom" {node} label="label.settings" icon="minus" tooltip={$_('tooltip.settings')}>
      <Input bind:node bind:value={accessTokenUrl} prop="accessTokenUrl" maximize icon="link" label={$_('credentials.accessTokenUrl')} placeholder={$_('credentials.accessTokenUrl')} disabled={node.disableInput} />
      <Input bind:node bind:value={authorizationEndpoint} prop="authorizationEndpoint" maximize icon="link" label={$_('credentials.authorizationEndpoint')} placeholder={$_('credentials.authorizationEndpoint')} disabled={node.disableInput} />
      <Input bind:node bind:value={clientId} prop="clientId" maximize icon="id-card" label={$_('credentials.clientId')} placeholder={$_('credentials.clientId')} disabled={node.disableInput} />
      <Row>
        <Input
          bind:node
          bind:value={clientSecret}
          prop="clientSecret"
          maximize
          icon="key"
          inline
          label={$_('credentials.clientSecret')}
          placeholder={$_('credentials.clientSecret')}
          type={show_client_secret ? 'text' : 'password'}
          disabled={node.disableInput}
        />
        <Button inline icon={show_client_secret ? 'eye' : 'eye-slash'} type="button" on:click={() => (show_client_secret = !show_client_secret)} disabled={node.disableInput}>{show_client_secret ? 'Hide' : 'Show'}</Button>
      </Row>
      <Input bind:node bind:value={scope} prop="scope" maximize icon="code" label={$_('credentials.scope')} placeholder={$_('credentials.scope')} disabled={node.disableInput} />
      <Row>
        <Input bind:node bind:value={code} prop="code" maximize icon="sign-in" inline label={$_('credentials.code')} placeholder={$_('credentials.code')} type={show_code ? 'text' : 'password'} disabled={node.disableInput} />
        <Button inline icon={show_code ? 'eye' : 'eye-slash'} type="button" on:click={() => (show_code = !show_code)} disabled={node.disableInput}>{show_code ? 'Hide' : 'Show'}</Button>
        <Button inline icon="key" on:click={onClick} disabled={node.disableInput} />
      </Row>
    </Group>
  {/if}
</Group>
