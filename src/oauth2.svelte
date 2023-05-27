<script context="module">
  RED.nodes.registerType('oauth2', {
    paletteLabel: 'oauth2',
    category: 'payment methods',
    color: '#fff',

    defaults: {
      name: {
        value: '',
        label: 'label.name',
        placeholder: 'placeholder.name',
        icon: 'tag'
      },

      container: {
        value: '',
        label: 'label.container',
        icon: 'cube',
        placeholder: 'placeholder.container',
        validate: RED.validators.typedInput('containerOpts')
      },
      containerOpts: { value: 'oauth2Response' },

      errorHandling: {
        value: '',
        icon: 'warning',
        label: 'label.errorHandling',
        validate: RED.validators.typedInput('containerOpts')
      },
      errorHandlingOpts: { value: 'standard' },

      grantType: {
        value: '',
        label: 'label.grantType',
        icon: 'lock',
        validate: RED.validators.typedInput('grantOpts')
      },
      grantOpts: { value: 'oauth2Request' },

      accessTokenUrl: {
        value: '',
        label: 'label.accessTokenUrl',
        placeholder: 'placeholder.accessTokenUrl'
      },
      clientId: { value: '', placeholder: 'placeholder.clientId' },
      clientSecret: { value: '', placeholder: 'placeholder.clientSecret' },
      scope: { value: '', placeholder: 'placeholder.scope' },
      userName: { value: '', placeholder: 'placeholder.userName' },
      password: { value: '', placeholder: 'placeholder.password' },
      authorizationEndpoint: {
        value: '',
        placeholder: 'placeholder.authorizationEndpoint'
      },
      code: { value: '', placeholder: 'placeholder.code' },

      internalErrors: { value: {} },
      rejectUnauthorized: {
        value: false,
        label: 'label.rejectUnauthorized',
        icon: 'lock'
      },

      clientCredentialsInBody: {
        value: false,
        label: 'label.clientCredentialsInBody',
        icon: 'lock'
      },
      headers: { value: [{ key: '', value: '', type: 'str' }], label: 'label.headers' },

      disableInput: {
        value: false,
        label: 'label.disableInput',
        icon: 'lock'
      },
      clientCredentialsInBody: {
        value: false,
        label: 'label.clientCredentialsInBody',
        icon: 'lock'
      },
      language: { value: 'pt-BR' },
      keepAuth: { value: false, label: 'Keep authentification', icon: 'key' },
      devMode: { value: false, label: 'Development Mode', icon: 'cubes' },
      showBanner: { value: true, label: 'Show Banner', icon: 'eye' },
      proxy: { type: 'http proxy', required: false, label: RED._('node-red:httpin.proxy-config') },
      tslconfig: { type: 'tls-config', required: false, label: RED._('node-red:httpin.tls-config') },
      outputs: { value: 1 }
    },

    inputs: 1,
    outputs: 1,
    icon: 'icons/oauth2/logo-x16.svg',

    i18nOptions: {
      // If there should be translation, each DOM needs the object 'node' (mostly it's already bound) or a 'i18n' property with the path to the folder e.g.: node.name + ':'.
      // if the node is not in the main folder, set here the folder name (which is in this case the same name as the node)
      folder: 'oauth2/'
    },

    label: function () {
      if (this.name) return this.name;
      //  else if (this.operation) return this.operation
      else return 'OAuth2 Svelte';
    },

    oneditprepare: function () {
      var pathname = document.location.pathname;
      if (pathname.slice(-1) != '/') {
        pathname += '/';
      }
      this.callback = '';
      var privateIPRegex = /(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;
      if (privateIPRegex.test(location.hostname)) {
        // if private IP has been detected
        var dummyDomain = 'node-red.example.com';
        var actualIP = location.hostname;
        this.callback = `${location.protocol}//${dummyDomain}${location.port ? ':' + location.port : ''}${pathname}oauth2/auth/callback`;
      } else {
        this.callback = `${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}${pathname}oauth2/auth/callback`;
      }
      this.redirectUri = `${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}${pathname}oauth2/redirect`;

      console.log(this.language);
      console.log(this.callback);
      render(this, { minWidth: '600px' });
    },

    oneditsave: function () {
      update(this);
      this.outputs = 'other output' === this.errorHandling ? 2 : 1;
    },

    oneditcancel: function () {
      revert(this);
    },
    onadd: function () {
      addCurrentNodeVersion(this);
    }
  });
</script>

<script>
  export let node, data;

  import { Callout, Input, TabbedPane, TabContent, Collapsible, Group, EditableList, Row, Select, TypedInput } from 'svelte-integration-red/components';
  import Advanced from './components/Advanced.svelte';
  import General from './components/General.svelte';
  import Credentials from './components/Credentials.svelte';
  import Yell from './components/Yell.svelte';

  import { oauth2BackwardCompatible } from './libs/backwardCompatible';
  import Assembly from 'carbon-icons-svelte/lib/Assembly.svelte';

  import { _ } from './libs/i18n';

  oauth2BackwardCompatible(node);

  node.internalErrors.readUrl = false;

  let tabs = { general: 'General', advanced: 'Advanced' };

  let messages = [];
  function deleteMessage(event) {
    // delete first element in arr
    messages = messages.slice(1);
    console.log(messages);
  }

  let Click = () => {
    if (data && data.error) {
      messages = [data.error];
      delete data.error;
    }
  };
</script>

{#each messages as message}
  <Yell {message} on:delete={deleteMessage} />
{/each}

<div class="bottom" on:mouseenter={Click}><Assembly size={32} /></div>
<TabbedPane bind:tabs>
  <TabContent tab="general">
    <General bind:node bind:data />
    <Collapsible {node} indented={false} icon="key" label={$_('credentials.title')}>
      <Credentials bind:node bind:data />
    </Collapsible>
  </TabContent>
  <TabContent tab="advanced">
    <Advanced bind:node bind:data />
  </TabContent>
</TabbedPane>

<style>
  .container {
    position: absolute;
    right: 5%;
    display: inline-block;
    cursor: pointer;
  }
  :global(#oauth2-svelte-container :is(.required, .required label)) {
    font-weight: bold !important;
  }
  :global(#oauth2-svelte-container .sir-Row label) {
    min-width: 180px;
  }
  :global(#oauth2-svelte-container .sir-Row label i) {
    min-width: 14px;
  }
  :global(.sir-Group.paddingBottom > .sir-Group-container) {
    padding-bottom: 12px;
  }
  :global(.success .fa-check-square) {
    color: var(--red-ui-text-color-success);
  }
  :global(.sir-Group.paddingAdvanced > .sir-Group-container) {
    background-color: #ffe;
    padding-bottom: 12px;
  }
</style>
