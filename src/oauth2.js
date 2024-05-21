module.exports = function (RED) {
  'use strict';

  const axios = require('axios');
  const { URL } = require('url');
  const crypto = require('crypto');
  const http = require('http');
  const https = require('https');

  /**
   * Replaces circular references in an object to allow safe stringification.
   *
   * @returns {Function} A replacer function for JSON.stringify.
   */
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return;
        seen.add(value);
      }
      return value;
    };
  };

  /**
   * Class representing an OAuth2 Node.
   */
  class OAuth2Node {
    /**
     * Create an OAuth2Node.
     * @param {Object} config - Node configuration object.
     */
    constructor(config) {
      RED.nodes.createNode(this, config);

      // Node configuration properties
      this.name = config.name || '';
      this.container = config.container || '';
      this.access_token_url = config.access_token_url || '';
      this.redirect_uri = config.redirect_uri || '';
      this.grant_type = config.grant_type || '';
      this.username = config.username || '';
      this.password = config.password || '';
      this.client_id = config.client_id || '';
      this.client_secret = config.client_secret || '';
      this.scope = config.scope || '';
      this.resource = config.resource || '';
      this.state = config.state || '';
      this.rejectUnauthorized = config.rejectUnauthorized || false;
      this.client_credentials_in_body = config.client_credentials_in_body || false;
      this.headers = config.headers || {};
      this.sendErrorsToCatch = config.senderr || false;

      // Proxy settings from environment variables or configuration
      this.prox = process.env.http_proxy || process.env.HTTP_PROXY || config.proxy;
      this.noprox = (process.env.no_proxy || process.env.NO_PROXY || '').split(',');

      // Register the input handler
      this.on('input', this.onInput.bind(this));
      this.host = RED.settings.uiHost || 'localhost';
    }

    /**
     * Handles input messages.
     * @param {Object} msg - Input message object.
     * @param {Function} send - Function to send messages.
     * @param {Function} done - Function to indicate processing is complete.
     */
    async onInput(msg, send, done) {
      // console.log('OAuth2Node received input:', msg);

      const options = this.generateOptions(msg); // Generate request options
      // console.log('Generated options:', options);

      this.configureProxy(); // Configure proxy settings
      // console.log('Configured proxy settings:', this.proxy);


      delete msg.oauth2Request; // Remove oauth2Request from msg
      options.form = this.cleanForm(options.form); // Clean the form data

      try {
        // console.log('Making POST request...');
        const response = await this.makePostRequest(options); // Make the POST request
        // console.log('Received response:', response);
        this.handleResponse(response, msg, send); // Handle the response
      } catch (error) {
        // console.error('Error making POST request:', error);
        this.handleError(error, msg, send); // Handle any errors
      }
      done(); // Indicate that processing is complete
      // console.log('Finished processing input.');
    }

    /**
     * Generates options for the HTTP request.
     * @param {Object} msg - Input message object.
     * @returns {Object} - The request options.
     */
    generateOptions(msg) {
      let form = {};
      let url = this.access_token_url;
      let headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      };
    
      // Set options based on grant type
      if (msg.oauth2Request) {
        const creds = msg.oauth2Request.credentials;
        form = {
          grant_type: creds.grant_type || this.grant_type,
          scope: creds.scope || this.scope,
          resource: creds.resource || this.resource,
          state: creds.state || this.state
        };
    
        if (creds.grant_type === 'password') {
          form.username = creds.username || this.username;
          form.password = creds.password || this.password;
        } else if (creds.grant_type === 'refresh_token') {
          form.refresh_token = creds.refresh_token;
        }
    
        if (this.client_credentials_in_body) {
          form.client_id = creds.client_id || this.client_id;
          form.client_secret = creds.client_secret || this.client_secret;
        } else {
          headers.Authorization = 'Basic ' + Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString('base64');
        }
    
        url = msg.oauth2Request.access_token_url || this.access_token_url;
      } else {
        form = {
          grant_type: this.grant_type,
          scope: this.scope,
          resource: this.resource,
          state: this.state
        };
    
        if (this.grant_type === 'password') {
          form.username = this.username;
          form.password = this.password;
        } else if (this.grant_type === 'authorization_code') {
          const credentials = RED.nodes.getCredentials(this.id);
          if (credentials) {
            form.code = credentials.code;
            form.redirect_uri = this.redirect_uri;
          }
        } else if (this.grant_type === 'implicit_flow') {
          const credentials = RED.nodes.getCredentials(this.id);
          if (credentials) {
            form.client_id = this.client_id;
            form.client_secret = this.client_secret;
            form.code = credentials.code;
            form.grant_type = 'authorization_code';
            form.redirect_uri = this.redirect_uri;
          }
        }
    
        if (this.client_credentials_in_body) {
          form.client_id = this.client_id;
          form.client_secret = this.client_secret;
        } else {
          headers.Authorization = 'Basic ' + Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64');
        }
      }
    
      return {
        method: 'POST',
        url: url,
        headers: { ...headers, ...this.headers },
        rejectUnauthorized: this.rejectUnauthorized,
        form: form
      };
    }
  
    /**
     * Configures proxy settings.
     */
    configureProxy() {
      if (!this.prox) return;

      const proxyURL = new URL(this.prox);
      this.proxy = {
        protocol: proxyURL.protocol,
        hostname: proxyURL.hostname,
        port: proxyURL.port,
        username: proxyURL.username || null,
        password: proxyURL.password || null
      };
    }

    /**
     * Cleans form data by removing undefined or empty values.
     * @param {Object} form - The form data.
     * @returns {Object} - The cleaned form data.
     */
    cleanForm(form) {
      return Object.fromEntries(Object.entries(form).filter(([, value]) => value !== undefined && value !== ''));
    }

    /**
     * Makes a POST request.
     * @param {Object} options - The request options.
     * @returns {Promise<Object>} - The response from the request.
     */
    async makePostRequest(options) {
      return axios.post(options.url, options.form, {
        headers: options.headers,
        proxy: this.proxy,
        httpAgent: new http.Agent({ rejectUnauthorized: this.rejectUnauthorized }),
        httpsAgent: new https.Agent({ rejectUnauthorized: this.rejectUnauthorized })
      });
    }

    /**
     * Handles the response from the POST request.
     * @param {Object} response - The response object.
     * @param {Object} msg - Input message object.
     * @param {Function} send - Function to send messages.
     */
    handleResponse(response, msg, send) {
      msg.oauth2Response = response.data || {};
      this.setStatus('green', `HTTP ${response.status}, ok`);
      send(msg);
    }
    /**
     * Handles errors from the POST request.
     * @param {Object} error - The error object.
     * @param {Object} msg - Input message object.
     * @param {Function} send - Function to send messages.
     */
    handleError(error, msg, send) {
      const status = error.response ? error.response.status : error.code;
      const message = error.response ? error.response.statusText : error.message;
      msg.oauth2Error = error.response || { status, message };
      this.setStatus('red', `HTTP ${status}, ${message}`);
      if (this.sendErrorsToCatch) send([null, msg]);
      else {
        this.error(message, msg);
        send([null, msg]);
      }
    }
    
    /**
     * Sets the status of the node.
     * @param {string} color - The color of the status indicator.
     * @param {string} text - The status text.
     */
    setStatus(color, text) {
      this.status({ fill: color, shape: 'dot', text });
      setTimeout(() => {
        this.status({});
      }, 250);
    }
  }

  /**
   * Endpoint to retrieve OAuth2 credentials based on a token.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  RED.httpAdmin.get('/oauth2/credentials/:token', (req, res) => {
    const credentials = RED.nodes.getCredentials(req.params.token);
    if (credentials) {
      res.json({ code: credentials.code, redirect_uri: credentials.redirect_uri });
    } else {
      res.send('oauth2.error.no-credentials');
    }
  });

  /**
   * Endpoint to handle OAuth2 redirect and store the authorization code.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  RED.httpAdmin.get('/oauth2/redirect', (req, res) => {
    if (req.query.code) {
      const [node_id] = req.query.state.split(':');
      let credentials = RED.nodes.getCredentials(node_id);

      if (!credentials) {
        credentials = {};
      }

      credentials = { ...credentials, ...req.query };
      RED.nodes.addCredentials(node_id, credentials);

      res.send(`
        <HTML>
          <HEAD>
            <script language="javascript" type="text/javascript">
              function closeWindow() {
                window.open('', '_parent', '');
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
        </HTML>
      `);
    } else {
      res.send('oauth2.error.no-credentials');
    }
  });

  // Register the OAuth2Node node type
  RED.nodes.registerType('oauth2', OAuth2Node, {
    credentials: {
      clientId: { type: 'text' },
      clientSecret: { type: 'password' },
      accessToken: { type: 'password' },
      refreshToken: { type: 'password' },
      expireTime: { type: 'password' },
      code: { type: 'password' }
    }
  });
};
