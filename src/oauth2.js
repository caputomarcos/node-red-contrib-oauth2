module.exports = function (RED) {
  'use strict';

  const axios = require('axios');
  const url = require('url');
  const crypto = require('crypto');
  const http = require('http');
  const https = require('https');

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

  class OAuth2Node {
    constructor(oauth2Node) {
      RED.nodes.createNode(this, oauth2Node);

      this.name = oauth2Node.name || '';
      this.container = oauth2Node.container || '';
      this.access_token_url = oauth2Node.access_token_url || '';
      this.grant_type = oauth2Node.grant_type || '';
      this.username = oauth2Node.username || '';
      this.password = oauth2Node.password || '';
      this.client_id = oauth2Node.client_id || '';
      this.client_secret = oauth2Node.client_secret || '';
      this.scope = oauth2Node.scope || '';
      this.resource = oauth2Node.resource || '';
      this.state = oauth2Node.state || '';
      this.rejectUnauthorized = oauth2Node.rejectUnauthorized || false;
      this.client_credentials_in_body = oauth2Node.client_credentials_in_body || false;
      this.headers = oauth2Node.headers || {};
      this.sendErrorsToCatch = oauth2Node.senderr || false;

      this.configureProxy(oauth2Node);

      this.on('input', async (msg, send, done) => {
        try {
          const options = this.generateOptions(msg);
          this.configureProxySettings();
          delete msg.oauth2Request;
          options.form = Object.fromEntries(Object.entries(options.form).filter(([, value]) => value !== undefined && value !== ''));

          const response = await this.makePostRequest(options);
          const { status, data } = response;

          msg[this.container] = data || {};
          const statusColor = status === 200 ? 'green' : 'yellow';
          const statusText = `HTTP ${status}, ${status === 200 ? 'ok' : 'nok'}`;

          this.setStatus(statusColor, statusText);
          send(msg);
        } catch (error) {
          this.handleError(error, msg, send);
        }
        done();
      });
    }

    configureProxy(oauth2Node) {
      if (process.env.http_proxy) this.prox = process.env.http_proxy;
      if (process.env.HTTP_PROXY) this.prox = process.env.HTTP_PROXY;
      if (process.env.no_proxy) this.noprox = process.env.no_proxy.split(',');
      if (process.env.NO_PROXY) this.noprox = process.env.NO_PROXY.split(',');

      if (oauth2Node.proxy) {
        const proxyConfig = RED.nodes.getNode(oauth2Node.proxy);
        this.prox = proxyConfig.url;
        this.noprox = proxyConfig.noproxy;
        this.proxyCredentials = proxyConfig.credentials;
      }
    }

    setStatus(status, text) {
      this.status({ fill: status, shape: 'dot', text });
    }

    generateOptions(msg) {
      const baseOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        rejectUnauthorized: this.rejectUnauthorized,
        form: {}
      };

      if (this.grant_type === 'set_by_credentials') {
        Object.assign(baseOptions, {
          url: msg.oauth2Request.access_token_url,
          headers: {
            ...baseOptions.headers,
            Authorization: 'Basic ' + Buffer.from(`${msg.oauth2Request.credentials.client_id}:${msg.oauth2Request.credentials.client_secret}`).toString('base64')
          },
          form: {
            grant_type: msg.oauth2Request.credentials.grant_type,
            scope: msg.oauth2Request.credentials.scope,
            resource: msg.oauth2Request.credentials.resource,
            state: msg.oauth2Request.credentials.state
          }
        });

        if (msg.oauth2Request.credentials.grant_type === 'password') {
          baseOptions.form.username = msg.oauth2Request.credentials.username;
          baseOptions.form.password = msg.oauth2Request.credentials.password;
        } else if (msg.oauth2Request.credentials.grant_type === 'refresh_token') {
          baseOptions.form.refresh_token = msg.oauth2Request.credentials.refresh_token;
        }

        if (this.client_credentials_in_body) {
          baseOptions.form.client_id = msg.oauth2Request.credentials.client_id;
          baseOptions.form.client_secret = msg.oauth2Request.credentials.client_secret;
          baseOptions.headers = Object.fromEntries(Object.entries(baseOptions.headers).filter(([key]) => key !== 'Authorization'));
        }
      } else {
        Object.assign(baseOptions, {
          url: this.access_token_url,
          headers: {
            ...baseOptions.headers,
            Authorization: 'Basic ' + Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64')
          },
          form: {
            grant_type: this.grant_type,
            scope: this.scope,
            resource: this.resource,
            state: this.state
          }
        });

        if (this.grant_type === 'password') {
          baseOptions.form.username = this.username;
          baseOptions.form.password = this.password;
        } else if (this.grant_type === 'authorization_code') {
          if (this.client_credentials_in_body) {
            baseOptions.form.client_id = this.client_id;
            baseOptions.form.client_secret = this.client_secret;
            baseOptions.headers = Object.fromEntries(Object.entries(baseOptions.headers).filter(([key]) => key !== 'Authorization'));
          }

          const credentials = RED.nodes.getCredentials(this.id);
          if (credentials) {
            baseOptions.form.code = credentials.code;
            baseOptions.form.redirect_uri = credentials.redirectUri;
          }
        }
      }

      if (this.headers) {
        for (const h in this.headers) {
          if (this.headers[h] && !Object.prototype.hasOwnProperty.call(baseOptions.headers, h)) {
            baseOptions.headers[h] = this.headers[h];
          }
        }
      }

      return baseOptions;
    }

    configureProxySettings() {
      if (this.prox) {
        const match = this.prox.match(/^(https?:\/\/)?(.+)?:([0-9]+)?/i);
        if (match) {
          const proxyURL = new URL(this.prox);
          const proxyOptions = {
            protocol: proxyURL.protocol,
            hostname: proxyURL.hostname,
            port: proxyURL.port,
            username: null,
            password: null
          };

          if (this.proxyCredentials) {
            proxyOptions.username = this.proxyCredentials.username || '';
            proxyOptions.password = this.proxyCredentials.password || '';
          } else if (proxyURL.username || proxyURL.password) {
            proxyOptions.username = proxyURL.username;
            proxyOptions.password = proxyURL.password;
          }

          this.proxy = proxyOptions;
          RED.nodes.addCredentials(this.id, proxyOptions);
        } else {
          this.warn('Bad proxy url');
        }
      }
    }

    async makePostRequest(options) {
      return axios.post(options.url, options.form, {
        headers: options.headers,
        proxy: this.proxy,
        httpAgent: new http.Agent({ rejectUnauthorized: this.rejectUnauthorized }),
        httpsAgent: new https.Agent({ rejectUnauthorized: this.rejectUnauthorized })
      });
    }

    handleError(error, msg, send) {
      const { response, code, message } = error;

      msg[this.container] = response || {};
      const errorStatus = response?.status || code;
      const errorMessage = response?.statusText || message;
      const statusText = `HTTP ${errorStatus}, ${errorMessage}`;

      this.setStatus('red', statusText);

      if (this.sendErrorsToCatch) {
        send(msg);
      }
    }
  }

  RED.nodes.registerType('oauth2', OAuth2Node, {
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
    if (credentials) {
      res.json({
        code: credentials.code,
        redirect_uri: credentials.redirect_uri
      });
    } else {
      res.send('oauth2.error.no-credentials');
    }
  });

  RED.httpAdmin.get('/oauth2/redirect', (req, res) => {
    if (req.query.code) {
      const state = req.query.state.split(':');
      const node_id = state[0];
      const credentials = RED.nodes.getCredentials(node_id);
      if (credentials) {
        credentials.code = req.query.code;
        RED.nodes.addCredentials(node_id, credentials);
        const html = `
          <HTML>
            <HEAD>
              <script language="javascript" type="text/javascript">
                function closeWindow() {
                  window.open('','_parent','');
                  window.close();
                }
                function delay() {
                  setTimeout("closeWindow()", 1000);
                }
              </script>
            </HEAD>
            <BODY onload="javascript:delay();">
              <p>Success! This page can be closed if it doesn't do so automatically.</p>
            </BODY>
          </HTML>`;
        res.send(html);
      }
    } else {
      res.send('oauth2.error.no-credentials');
    }
  });

  RED.httpAdmin.get('/oauth2/auth', async (req, res) => {
    const { clientId, clientSecret, id, callback, redirectUri, authorizationEndpoint, scope, resource, proxy } = req.query;
    if (!clientId || !clientSecret || !id || !callback) {
      res.sendStatus(400);
      return;
    }

    const node_id = id;
    const credentials = JSON.parse(JSON.stringify(req.query, getCircularReplacer()));
    const proxyConfig = RED.nodes.getNode(proxy);

    let proxyOptions;
    if (proxyConfig) {
      const match = proxyConfig.url.match(/^(https?:\/\/)?(.+)?:([0-9]+)?/i);
      if (match) {
        const proxyURL = new URL(proxyConfig.url);
        proxyOptions = {
          protocol: proxyURL.protocol,
          hostname: proxyURL.hostname,
          port: proxyURL.port,
          username: proxyConfig.credentials.username,
          password: proxyConfig.credentials.password
        };
      }
    }

    const csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');

    credentials.csrfToken = csrfToken;
    credentials.callback = callback;
    credentials.redirectUri = redirectUri;

    res.cookie('csrf', csrfToken);

    const l = url.parse(authorizationEndpoint, true);
    const redirectUrl = new URL(l.href);
    redirectUrl.searchParams.set('client_id', credentials.clientId);
    redirectUrl.searchParams.set('redirect_uri', redirectUri);
    redirectUrl.searchParams.set('state', `${node_id}:${csrfToken}`);
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
      RED.nodes.addCredentials(node_id, credentials);
    } catch (error) {
      res.sendStatus(404);
    }
  });

  RED.httpAdmin.get('/oauth2/auth/callback', (req, res) => {
    if (req.query.error) {
      return res.send('oauth2.error.error', {
        error: req.query.error,
        description: req.query.error_description
      });
    }
    const state = req.query.state.split(':');
    const node_id = state[0];
    const credentials = RED.nodes.getCredentials(node_id);
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return res.send('oauth2.error.no-credentials');
    }
    if (state[1] !== credentials.csrfToken) {
      return res.status(401).send('oauth2.error.token-mismatch');
    }
  });
};
