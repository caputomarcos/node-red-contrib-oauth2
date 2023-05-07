<script context="module">
  RED.nodes.registerType("oauth2", {
    paletteLabel: "oauth2",
    category: "payment methods",
    color: "#fff",

    defaults: {
      name: {
        value: "",
        label: "label.name",
        placeholder: "placeholder.name",
        icon: "tag",
      },

      container: {
        value: "",
        label: "label.container",
        icon: "cube",
        placeholder: "placeholder.container",
        validate: RED.validators.typedInput("containerOpts"),
      },
      containerOpts: { value: "oauth2Response" },

      errorHandling: { value: "Standard", label: "label.errorHandling" },

      grantType: {
        value: "",
        label: "label.grantType",
        icon: "lock",
        validate: RED.validators.typedInput("grantOpts"),
      },
      grantOpts: { value: "oauth2Request" },

      accessTokenUrl: { value: "", label: "label.accessTokenUrl", placeholder: "placeholder.accessTokenUrl" },
      clientId: { value: "", placeholder: "placeholder.clientId" },
      clientSecret: { value: "", placeholder: "placeholder.clientSecret" },
      scope: { value: "", placeholder: "placeholder.scope" },
      userName: { value: "", placeholder: "placeholder.userName" },
      password: { value: "", placeholder: "placeholder.password" },
      authorizationEndpoint: {
        value: "",
        placeholder: "placeholder.authorizationEndpoint",
      },
      code: { value: "", placeholder: "placeholder.code" },

      internalErrors: { value: {} },
      rejectUnauthorized: {
        value: false,
        label: "label.rejectUnauthorized",
        icon: "lock",
      },

      clientCredentialsInBody: {
        value: false,
        label: "label.clientCredentialsInBody",
        icon: "lock",
      },

      disableInput: {
        value: false,
        label: "label.disableInput",
        icon: "lock",
      },

      keepAuth: { value: false, label: "Keep authentification", icon: "lock" },
      devMode: { value: false, label: "Development Mode", icon: "at" },
      showBanner: { value: true, label: "Show Banner", icon: "eye" },

      outputs: { value: 1 },
    },

    inputs: 1,
    outputs: 1,
    icon: "icons/oauth2/logo-x16.svg",

    i18nOptions: {
      // If there should be translation, each DOM needs the object 'node' (mostly it's already bound) or a 'i18n' property with the path to the folder e.g.: node.name + ':'.
      // if the node is not in the main folder, set here the folder name (which is in this case the same name as the node)
      folder: "oauth2/",
    },

    label: function () {
      if (this.name) return this.name;
      //  else if (this.operation) return this.operation
      else return "OAuth2 Svelte";
    },

    oneditprepare: function () {
      render(this, { minWidth: "600px" });
    },

    oneditsave: function () {
      update(this);
      this.outputs = "other output" === this.errorHandling ? 2 : 1;
    },

    oneditcancel: function () {
      revert(this);
    },
  });
</script>

<script>
  export let node;

  import {
    Callout,
    Input,
    TabbedPane,
    TabContent,
    Collapsible,
    Group,
  } from "svelte-integration-red/components";
  import Advanced from "./components/Advanced.svelte";
  import General from "./components/General.svelte";
  import Credentials from "./components/Credentials.svelte";
  import { createBackwardCompatible } from "./libs/utils.js";

  createBackwardCompatible(node);

  node.internalErrors.readUrl = true;

  let tabs = { general: "General", advanced: "Advanced" };

  export let data = { error: "Error" };
</script>

{#if data.error}
  <Callout type="error">
    <span slot="header">Error</span>
    {data.error}
  </Callout>
{/if}

<TabbedPane bind:tabs>
  <TabContent tab="general">
    <General bind:node bind:data />
    <Collapsible {node} indented={false} icon="key" label="Credentials">
      <Credentials bind:node bind:data />
    </Collapsible>
  </TabContent>
  <TabContent tab="advanced">
    <Advanced bind:node />
  </TabContent>
</TabbedPane>

<style>
  :global(#oauth2-svelte-container :is(.required, .required label)) {
    font-weight: bold !important;
  }
  :global(#oauth2-svelte-container .sir-Row label) {
    min-width: 150px;
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
