const axios = require('axios');
const url = require('url');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Helper function to replace circular references in objects
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

// Function to generate request options
const generateOptions = (node, msg, RED) => {
  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    rejectUnauthorized: node.rejectUnauthorized,
    form: {}
  };

  if (node.grant_type === 'set_by_credentials') {
    options.url = msg.oauth2Request.access_token_url;
    options.headers.Authorization = 'Basic ' + Buffer.from(`${msg.oauth2Request.credentials.client_id}:${msg.oauth2Request.credentials.client_secret}`).toString('base64');
    options.form.grant_type = msg.oauth2Request.credentials.grant_type;
    options.form.scope = msg.oauth2Request.credentials.scope;
    options.form.resource = msg.oauth2Request.credentials.resource;
    options.form.state = msg.oauth2Request.credentials.state;

    if (msg.oauth2Request.credentials.grant_type === 'password') {
      options.form.username = msg.oauth2Request.credentials.username;
      options.form.password = msg.oauth2Request.credentials.password;
    } else if (msg.oauth2Request.credentials.grant_type === 'refresh_token') {
      options.form.refresh_token = msg.oauth2Request.credentials.refresh_token;
    }

    if (node.client_credentials_in_body) {
      options.form.client_id = msg.oauth2Request.credentials.client_id;
      options.form.client_secret = msg.oauth2Request.credentials.client_secret;
      delete options.headers.Authorization;
    }
  } else if (node.grant_type === 'implicit') {
    const credentials = RED.nodes.getCredentials(node.id);
    options.url = node.access_token_url;
    options.form = {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
      grant_type: 'authorization_code',
      code: credentials.code
    };
  } else if (node.grant_type === 'authorization_code') {
    const credentials = RED.nodes.getCredentials(node.id);
    options.url = node.access_token_url;
    options.headers.Authorization = 'Basic ' + Buffer.from(`${node.client_id}:${node.client_secret}`).toString('base64');
    options.form.grant_type = 'authorization_code';
    options.form.code = credentials.code;
    options.form.client_id = node.client_id;
    options.form.client_secret = node.client_secret;
    options.form.redirect_uri = credentials.redirectUri;
  } else {
    options.url = node.access_token_url;
    options.headers.Authorization = 'Basic ' + Buffer.from(`${node.client_id}:${node.client_secret}`).toString('base64');
    options.form.grant_type = node.grant_type;
    options.form.scope = node.scope;
    options.form.resource = node.resource;
    options.form.state = node.state;

    if (node.grant_type === 'password') {
      options.form.username = node.username;
      options.form.password = node.password;
    }
  }

  if (node.headers) {
    options.headers = { ...options.headers, ...node.headers };
  }

  return options;
};

// Function to configure proxy settings
const configureProxy = (node, proxyConfig) => {
  try {
    if (node.prox) {
      const proxyURL = new URL(node.prox);
      node.proxy = {
        protocol: proxyURL.protocol,
        hostname: proxyURL.hostname,
        port: proxyURL.port,
        username: proxyConfig?.credentials?.username || proxyURL.username,
        password: proxyConfig?.credentials?.password || proxyURL.password
      };
      RED.nodes.addCredentials(node.id, node.proxy);
    }
  } catch (error) {
    node.warn(`Bad proxy URL: ${node.prox}`);
  }
};

// Function to make the POST request
const makePostRequest = (options, node) => {
  return axios.post(options.url, options.form, {
    headers: options.headers,
    proxy: node.proxy,
    httpAgent: new http.Agent({ rejectUnauthorized: node.rejectUnauthorized }),
    httpsAgent: new https.Agent({ rejectUnauthorized: node.rejectUnauthorized })
  });
};

module.exports = function (RED) {
  'use strict';

  class OAuth2Node {
    constructor(oauth2Node) {
      RED.nodes.createNode(this, oauth2Node);

      // Store local copies of the node configuration
      Object.assign(this, oauth2Node, {
        prox: process.env.http_proxy || process.env.HTTP_PROXY,
        noprox: (process.env.no_proxy || process.env.NO_PROXY)?.split(','),
        sendErrorsToCatch: oauth2Node.senderr || false
      });

      if (oauth2Node.proxy) {
        const proxyConfig = RED.nodes.getNode(oauth2Node.proxy);
        this.prox = proxyConfig.url;
        this.noprox = proxyConfig.noproxy;
        this.proxyCredentials = proxyConfig.credentials;
      }

      this.on('input', async (msg, Send, Done) => {
        const options = generateOptions(this, msg, RED);
        configureProxy(this, this.proxyCredentials);

        delete msg.oauth2Request;
        options.form = Object.fromEntries(Object.entries(options.form).filter(([, value]) => value !== undefined && value !== ''));

        const setStatus = (status, text) => {
          this.status({ fill: status, shape: 'dot', text: text });
        };

        try {
          const response = await makePostRequest(options, this);
          msg[this.container] = response.data || {};
          setStatus(response.status === 200 ? 'green' : 'yellow', `HTTP ${response.status}, ${response.status === 200 ? 'ok' : 'nok'}`);
          Send(msg);
        } catch (error) {
          msg[this.container] = error.response || {};
          const status = error.response?.status || error.code;
          const message = error.response?.statusText || error.message;
          setStatus('red', `HTTP ${status}, ${message}`);

          if (this.sendErrorsToCatch) {
            Send(msg);
          }
        }
        Done();
      });
    }
  }

  RED.nodes.registerType('oauth2-credentials', OAuth2Node, {
    credentials: {
      displayName: { type: 'text' },
      clientId: { type: 'text' },
      clientSecret: { type: 'password' },
      accessToken: { type: 'password' },
      refreshToken: { type: 'password' },
      expireTime: { type: 'password' },
      code: { type: 'password' },
      proxy: { type: 'json' }
    }
  });

  RED.httpAdmin.get('/oauth2/credentials/:token', (req, res) => {
    const credentials = RED.nodes.getCredentials(req.params.token);
    credentials ? res.json({ code: credentials.code, redirect_uri: credentials.redirect_uri }) : res.send('oauth2.error.no-credentials');
  });

  RED.httpAdmin.get('/oauth2/redirect', (req, res) => {
    if (req.query.code) {
      const [node_id] = req.query.state.split(':');
      const credentials = RED.nodes.getCredentials(node_id);
      if (credentials) {
        credentials.code = req.query.code;
        RED.nodes.addCredentials(node_id, credentials);
        res.send(
          `<HTML><HEAD><script>function closeWindow(){window.open('','_parent','');window.close();}function delay(){setTimeout("closeWindow()",1000);}</script></HEAD><BODY onload="javascript:delay();"><p>Success! This page can be closed if it doesn't do so automatically.</p></BODY></HTML>`
        );
      }
    } else {
      res.send('oauth2.error.no-credentials');
    }
  });

  RED.httpAdmin.get('/oauth2/auth', async (req, res) => {
    if (!req.query.clientId || !req.query.clientSecret || !req.query.id || !req.query.callback) {
      res.sendStatus(400);
      return;
    }

    const { clientId, clientSecret, id, callback, redirectUri, scope, authorizationEndpoint, resource } = req.query;
    const credentials = { ...req.query, csrfToken: crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_') };
    const proxyConfig = RED.nodes.getNode(credentials.proxy);

    let proxyOptions;
    if (proxyConfig) {
      const proxyURL = new URL(proxyConfig.url);
      proxyOptions = {
        protocol: proxyURL.protocol,
        hostname: proxyURL.hostname,
        port: proxyURL.port,
        username: proxyConfig.credentials.username,
        password: proxyConfig.credentials.password
      };
    }

    res.cookie('csrf', credentials.csrfToken);

    const redirectUrl = new URL(authorizationEndpoint);
    redirectUrl.searchParams.set('client_id', clientId);
    redirectUrl.searchParams.set('redirect_uri', redirectUri);
    redirectUrl.searchParams.set('state', `${id}:${credentials.csrfToken}`);
    redirectUrl.searchParams.set('scope', scope);
    redirectUrl.searchParams.set('resource', resource);
    redirectUrl.searchParams.set('response_type', 'code');

    try {
      const response = await axios.get(redirectUrl.toString(), {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        httpAgent: new http.Agent({ rejectUnauthorized: false }),
        proxy: proxyOptions
      });
      res.redirect(response.request.res.responseUrl);
      RED.nodes.addCredentials(id, credentials);
    } catch (error) {
      res.sendStatus(404);
    }
  });

  RED.httpAdmin.get('/oauth2/auth/callback', (req, res) => {
    if (req.query.error) {
      res.send('oauth2.error.error', { error: req.query.error, description: req.query.error_description });
      return;
    }
    const [node_id, csrfToken] = req.query.state.split(':');
    const credentials = RED.nodes.getCredentials(node_id);
    if (credentials && credentials.clientId && credentials.clientSecret) {
      csrfToken === credentials.csrfToken ? res.status(200).send('oauth2.success') : res.status(401).send('oauth2.error.token-mismatch');
    } else {
      res.send('oauth2.error.no-credentials');
    }
  });

  RED.nodes.registerType('oauth2', OAuth2Node);
};
