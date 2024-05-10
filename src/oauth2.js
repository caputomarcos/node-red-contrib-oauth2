module.exports = function (RED) {
  'use strict';

  // require any external libraries we may need....
  const axios = require('axios');
  const url = require('url');
  const crypto = require('crypto');
  const http = require('http');
  const https = require('https');

  /**
   * This function replaces circular references in the provided object to allow
   * safe stringification.
   *
   * @param {object} obj - The object to check for circular references
   * @returns {object} The object with circular references replaced
   */
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

  /**
   * OAuth2Node class represents a custom node used in the Node-RED flow-based programming platform.
   * The node handles authentication with OAuth 2.0 servers by generating tokens required for API access.
   *
   * The main node definition - most things happen in here!
   * @class
   */

  class OAuth2Node {
    /**
     * Constructor for OAuth2Node.
     * @constructor
     * @param {Object} oauth2Node - The configuration for the node.
     */
    constructor(oauth2Node) {
      // Create a RED node
      RED.nodes.createNode(this, oauth2Node);

      // Store local copies of the node configuration (as defined in the .html)
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
      this.response_type = oauth2Node.response_type || 'code';
      this.access_type = oauth2Node.access_type || 'offline';
      this.prompt = oauth2Node.prompt || 'consent';
      this.state = oauth2Node.state || '';
      this.rejectUnauthorized = oauth2Node.rejectUnauthorized || false;
      this.client_credentials_in_body = oauth2Node.client_credentials_in_body || false;
      this.headers = oauth2Node.headers || {};
      this.sendErrorsToCatch = oauth2Node.senderr || false;

      // Check environment variables for proxy settings
      if (process.env.http_proxy) {
        this.prox = process.env.http_proxy;
      }
      if (process.env.HTTP_PROXY) {
        this.prox = process.env.HTTP_PROXY;
      }
      if (process.env.no_proxy) {
        this.noprox = process.env.no_proxy.split(',');
      }
      if (process.env.NO_PROXY) {
        this.noprox = process.env.NO_PROXY.split(',');
      }

      // Set proxyConfig variable if node has a proxy configuration
      let proxyConfig;
      if (oauth2Node.proxy) {
        proxyConfig = RED.nodes.getNode(oauth2Node.proxy);
        this.prox = proxyConfig.url;
        this.noprox = proxyConfig.noproxy;
        this.proxyCredentials = proxyConfig.credentials;
      }

      // copy "this" object in case we need it in context of callbacks of other functions.
      let node = this;

      /**
       * Responds to inputs.
       * @function
       * @param {object} msg - The input message object.
       * @param {function} Send - The callback function for sending messages to next nodes.
       * @param {function} Done - The callback function to end the node's processing.
       */
      this.on('input', async function (msg, Send, Done) {
        let options = generateOptions(node, msg);
        configureProxy(node);
        delete msg.oauth2Request;
        options.form = Object.fromEntries(Object.entries(options.form).filter(([, value]) => value !== undefined && value !== ''));

        const setStatus = (node, status, text) => {
          node.status({
            fill: status,
            shape: 'dot',
            text: text
          });
        };

        try {
          const response = await makePostRequest(options, node);
          const { status, data } = response;

          msg[node.container] = data || {};
          const statusColor = status === 200 ? 'green' : 'yellow';
          const statusText = `HTTP ${status}, ${status === 200 ? 'ok' : 'nok'}`;

          setStatus(node, statusColor, statusText);
          Send(msg);
        } catch (error) {
          const { response, code, message } = error;

          msg[node.container] = response || {};
          const errorStatus = response && response.status ? response.status : code;
          const errorMessage = response && response.statusText ? response.statusText : message;
          const statusText = `HTTP ${errorStatus}, ${errorMessage}`;

          setStatus(node, 'red', statusText);

          if (node.sendErrorsToCatch) {
            Send(msg);
          }
        }
        Done();
      });

      function generateOptions(node, msg) {
        let baseOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
          },
          rejectUnauthorized: node.rejectUnauthorized,
          form: {}
        };

        if (node.grant_type === 'set_by_credentials') {
          baseOptions.url = msg.oauth2Request.access_token_url;
          baseOptions.headers.Authorization = 'Basic ' + Buffer.from(`${msg.oauth2Request.credentials.client_id}:${msg.oauth2Request.credentials.client_secret}`).toString('base64');
          baseOptions.form.grant_type = msg.oauth2Request.credentials.grant_type;
          baseOptions.form.scope = msg.oauth2Request.credentials.scope;
          baseOptions.form.resource = msg.oauth2Request.credentials.resource;
          baseOptions.form.state = msg.oauth2Request.credentials.state;

          // Additional configurations based on grant type
          if (msg.oauth2Request.credentials.grant_type === 'password') {
            baseOptions.form.username = msg.oauth2Request.credentials.username;
            baseOptions.form.password = msg.oauth2Request.credentials.password;
          } else if (msg.oauth2Request.credentials.grant_type === 'refresh_token') {
            baseOptions.form.refresh_token = msg.oauth2Request.credentials.refresh_token;
          }

          if (node.client_credentials_in_body) {
            baseOptions.form.client_id = msg.oauth2Request.credentials.client_id;
            baseOptions.form.client_secret = msg.oauth2Request.credentials.client_secret;
            baseOptions.headers = Object.fromEntries(Object.entries(baseOptions.headers).filter(([key]) => key !== 'Authorization'));
          }
        } else {
          baseOptions.url = node.access_token_url;
          baseOptions.headers.Authorization = 'Basic ' + Buffer.from(`${node.client_id}:${node.client_secret}`).toString('base64');
          baseOptions.form.grant_type = node.grant_type;
          baseOptions.form.scope = node.scope;
          baseOptions.form.resource = node.resource;
          baseOptions.form.state = node.state;

          // Additional configurations based on grant type
          if (node.grant_type === 'password') {
            baseOptions.form.username = node.username;
            baseOptions.form.password = node.password;
          } else if (node.grant_type === 'authorization_code') {

            const credentials = RED.nodes.getCredentials(node.id);
            if (credentials) {
              baseOptions.form.code = credentials.code;
              baseOptions.form.redirect_uri = credentials.redirectUri;
            }
          } else if (node.grant_type === 'authorization_code') {

          }
        }

        if (oauth2Node.headers) {
          for (let h in oauth2Node.headers) {
            if (oauth2Node.headers[h] && !Object.prototype.hasOwnProperty.call(baseOptions.headers, h)) {
              baseOptions.headers[h] = oauth2Node.headers[h];
            }
          }
        }

        return baseOptions;
      }

      function configureProxy(node) {
        if (node.prox) {
          let match = node.prox.match(/^(https?:\/\/)?(.+)?:([0-9]+)?/i);
          if (match) {
            let proxyURL = new URL(node.prox);
            let proxyOptions = {
              proxy: {
                protocol: proxyURL.protocol,
                hostname: proxyURL.hostname,
                port: proxyURL.port,
                username: null,
                password: null
              }
            };

            if (proxyConfig && proxyConfig.credentials) {
              let proxyUsername = proxyConfig.credentials.username || '';
              let proxyPassword = proxyConfig.credentials.password || '';
              if (proxyUsername || proxyPassword) {
                proxyOptions.proxy.username = proxyUsername;
                proxyOptions.proxy.password = proxyPassword;
              }
            } else if (proxyURL.username || proxyURL.password) {
              proxyOptions.proxy.username = proxyURL.username;
              proxyOptions.proxy.password = proxyURL.password;
            }

            node.proxy = proxyOptions.proxy;
            RED.nodes.addCredentials(node.id, proxyOptions.proxy);
          } else {
            node.warn('Bad proxy url');
          }
        }
      }

      async function makePostRequest(options, node) {
        return axios.post(options.url, options.form, {
          headers: options.headers,
          proxy: node.proxy,
          httpAgent: new http.Agent({
            rejectUnauthorized: node.rejectUnauthorized
          }),
          httpsAgent: new https.Agent({
            rejectUnauthorized: node.rejectUnauthorized
          })
        });
      }
    }
  }

  /**
   * Registers an OAuth2Node node type with credentials object
   * @param {string} "oauth2-credentials" - the name of the node type to register
   * @param {OAuth2Node} OAuth2Node - the constructor function for the node type
   * @param {object} {credentials: {...}} - an object specifying the credentials properties and their types
   */
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

  /**
   * Endpoint to retrieve OAuth2 credentials based on a token
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   */
  RED.httpAdmin.get('/oauth2/credentials/:token', function (req, res) {
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

  /**
   * Handles GET requests to /oauth2/redirect
   * @param {object} req - the HTTP request object
   * @param {object} res - the HTTP response object
   */
  RED.httpAdmin.get('/oauth2/redirect', function (req, res) {
    if (req.query.code) {
      const state = req.query.state.split(':');
      const node_id = state[0];
      const credentials = RED.nodes.getCredentials(node_id);
      if (credentials) {
        credentials.code = req.query.code;
        RED.nodes.addCredentials(node_id, credentials);
        const html = `<HTML>
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

  /**
   * Endpoint to handle the OAuth2 authorization code flow
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   */
  RED.httpAdmin.get('/oauth2/auth', async function (req, res) {
    // if (!req.query.clientId || !req.query.clientSecret || !req.query.id || !req.query.callback) {
    //   res.sendStatus(400);
    //   return;
    // }

    const node_id = req.query.id;
    const callback = req.query.callback;
    const redirectUri = req.query.redirect_uri || req.query.redirectUri;
    const credentials = JSON.parse(JSON.stringify(req.query, getCircularReplacer()));
    const proxy = RED.nodes.getNode(credentials.proxy);

    let proxyOptions;
    if (proxy) {
      let match = proxy.url.match(/^(https?:\/\/)?(.+)?:([0-9]+)?/i);
      if (match) {
        let proxyURL = new URL(proxy.url);
        proxyOptions = {
          protocol: proxyURL.protocol,
          hostname: proxyURL.hostname,
          port: proxyURL.port,
          username: proxy.credentials.username,
          password: proxy.credentials.password
        };
      }
    }

    const scope = req.query.scope;
    const csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');

    credentials.csrfToken = csrfToken;
    credentials.callback = callback;
    credentials.redirectUri = redirectUri;

    res.cookie('csrf', csrfToken);

    const l = url.parse(req.query.authorizationEndpoint, true);
    const redirectUrl = new URL(l.href);
    redirectUrl.searchParams.set('client_id', credentials.clientId);
    redirectUrl.searchParams.set('redirect_uri', redirectUri);
    redirectUrl.searchParams.set('state', node_id + ':' + csrfToken);
    redirectUrl.searchParams.set('scope', scope);
    redirectUrl.searchParams.set('resource', req.query.resource);
    redirectUrl.searchParams.set('response_type', 'code');
    const newUrl = redirectUrl.toString();
    try {
      const response = await axios.get(newUrl, {
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

  /**
   * Endpoint to handle the OAuth2 authorization callback
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   */
  RED.httpAdmin.get('/oauth2/auth/callback', function (req, res) {
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
  RED.nodes.registerType('oauth2', OAuth2Node);
};
