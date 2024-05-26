module.exports = function (RED) {
   'use strict';

   const axios = require('axios');
   const http = require('http');
   const https = require('https');
   const { URLSearchParams } = require('url');
   const Logger = require('node-red-contrib-oauth2/src/libs/logger');

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
         this.logger = new Logger({ name: 'identifier', count: null, active: config.debug || false, label: 'debug' });
         this.logger.debug('Constructor: Initializing node with config', config);

         this.credentials_config = RED.nodes.getCredentials(config.credentials_config) || {};

         if (this.credentialsConfigNode) {
            this.logger.debug('Constructor: OAuth2 credentials node found', this.credentialsConfigNode);
         } else {
            this.logger.error('Constructor: OAuth2 credentials node not found');
         }

         // Node configuration properties
         this.name = config.name || '';
         this.container = config.container || '';
         this.access_token_url = config.access_token_url || '';
         this.authorization_endpoint = config.authorization_endpoint || '';
         this.redirect_uri = config.redirect_uri || '';
         this.grant_type = config.grant_type || '';
         this.refresh_token = config.refresh_token || '';
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
         this.proxy = config.proxy || false;
         this.force = config.force || false;
         this.logger.debug('Constructor: Finished setting up node properties');

         // Register the input handler
         this.on('input', this.onInput.bind(this));
         this.host = RED.settings.uiHost || 'localhost';
         this.logger.debug('Constructor: Node input handler registered');

         // Load credentials from Node-RED
         this.credentials = RED.nodes.getCredentials(this.id) || {};
      }

      /**
       * Handles input messages.
       * @param {Object} msg - Input message object.
       * @param {Function} send - Function to send messages.
       * @param {Function} done - Function to indicate processing is complete.
       */
      async onInput(msg, send, done) {
         this.logger.debug('onInput: Received message', msg);
         // Check if access token is stored and still valid
         if (!this.force && this.credentials.access_token && this.credentials.expire_time) {
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime < this.credentials.expire_time) {
               this.logger.debug('onInput: Using stored access token');
               msg = { ...msg, oauth2Response: this.credentials.oauth2Response, headers: this.credentials.headers };
               this.setStatus('green', 'Access token still valid!');
               send(msg);
               done();
               return;
            }
         }

         const options = this.generateOptions(msg); // Generate request options
         this.logger.debug('onInput: Generated request options', options);

         this.configureProxy(); // Configure proxy settings
         this.logger.debug('onInput: Configured proxy settings', this.prox);

         delete msg.oauth2Request; // Remove oauth2Request from msg
         this.logger.debug('onInput: Removed oauth2Request from message');

         options.form = this.cleanForm(options.form); // Clean the form data
         this.logger.debug('onInput: Cleaned form data', options.form);

         try {
            const response = await this.makePostRequest(options); // Make the POST request
            this.logger.debug('onInput: POST request response', response);
            this.handleResponse(response, msg, send); // Handle the response
         } catch (error) {
            this.logger.error('onInput: Error making POST request', error);
            this.handleError(error, msg, send); // Handle any errors
         }

         done(); // Indicate that processing is complete
         this.logger.debug('onInput: Finished processing input');
      }

      /**
       * Generates options for the HTTP request.
       * @param {Object} msg - Input message object.
       * @returns {Object} - The request options.
       */
      generateOptions(msg) {
         // Log the start of the option generation process with the input message
         this.logger.debug('generateOptions: Configuring options with message', msg);

         // Initialize the form object to hold the form data
         let form = {};
         // Set the default URL to the access token URL configured in the node
         let url = this.access_token_url;
         // Initialize headers with default Content-Type and Accept headers
         let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
         };

         // Retrieve credentials from the message if available, otherwise use an empty object
         const creds = msg.oauth2Request ? msg.oauth2Request.credentials || {} : {};
         // Initialize the form data with grant_type, scope, resource, and state
         form = {
            grant_type: creds.grant_type || this.grant_type,
            scope: creds.scope || this.scope,
            resource: creds.resource || this.resource,
            state: creds.state || this.state
         };

         // Define functions for different OAuth2 flows
         const flows = {
            // Password flow function
            password: () => {
               this.logger.debug('generateOptions: Password flow detected');
               form.username = creds.username || this.username;
               form.password = creds.password || this.password;
            },
            // Client credentials flow function
            client_credential: () => {
               this.logger.debug('generateOptions: Client credentials flow detected');
               form.client_id = creds.client_id || this.client_id;
               form.client_secret = creds.client_secret || this.client_secret;
            },
            // Refresh token flow function
            refresh_token: () => {
               this.logger.debug('generateOptions: Refresh token flow detected');
               form.client_id = creds.client_id || this.client_id;
               form.client_secret = creds.client_secret || this.client_secret;
               form.refresh_token = creds.refresh_token || this.refresh_token;
            },
            // Authorization code flow function
            authorization_code: () => {
               this.logger.debug('generateOptions: Authorization code flow detected');
               const credentials = RED.nodes.getCredentials(this.id) || {};
               if (credentials) {
                  form.code = credentials.code;
                  form.redirect_uri = this.redirect_uri;
               }
            },
            // Implicit flow function
            implicit_flow: () => {
               this.logger.debug('generateOptions: Implicit flow detected');
               const credentials = RED.nodes.getCredentials(this.id) || {};
               if (credentials) {
                  form.client_id = this.client_id;
                  form.client_secret = this.client_secret;
                  form.code = credentials.code;
                  form.grant_type = 'authorization_code';
                  form.redirect_uri = this.redirect_uri;
               }
            },
            // Set by credentials function
            set_by_credentials: () => {
               this.logger.debug('generateOptions: Set by credentials flow detected');
               if (msg.oauth2Request) {
                  const credentials = msg.oauth2Request.credentials || {};
                  form.client_id = credentials.client_id || this.client_id;
                  form.client_secret = credentials.client_secret || this.client_secret;
                  form.refresh_token = credentials.refresh_token || '';
               }
            }
         };

         // Check if the grant type from the credentials is supported and call the corresponding function
         if (creds.grant_type && flows[creds.grant_type]) {
            flows[creds.grant_type]();
         }
         // Check if the default grant type of the node is supported and call the corresponding function
         else if (this.grant_type && flows[this.grant_type]) {
            flows[this.grant_type]();
         }

         // Check if client credentials should be included in the body
         if (this.client_credentials_in_body) {
            this.logger.debug('generateOptions: Client credentials in body detected, using credentials');
            form.client_id = creds.client_id || this.client_id;
            form.client_secret = creds.client_secret || this.client_secret;
         } else {
            // Otherwise, add the Authorization header with client credentials encoded in base64
            headers.Authorization = 'Basic ' + Buffer.from(`${creds.client_id || this.client_id}:${creds.client_secret || this.client_secret}`).toString('base64');
         }

         // Set the URL to the access token URL from the message if available, otherwise use the default
         url = msg.oauth2Request ? msg.oauth2Request.access_token_url || this.access_token_url : this.access_token_url;

         // Log the final generated options
         this.logger.debug('generateOptions: Returning options', { method: 'POST', url, headers, form });
         // Return the HTTP request options
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
         // Proxy settings from environment variables or configuration
         const noProxyEnv = process.env.no_proxy || process.env.NO_PROXY || '';
         const noProxyList = noProxyEnv.split(',').filter((entry) => entry);

         if (!this.proxy && !process.env.http_proxy && !process.env.HTTP_PROXY) {
            return;
         }

         let proxy = '';
         let proxyConfig = {};

         if (this.proxy) {
            proxyConfig = RED.nodes.getNode(this.proxy);
         } else {
            proxy = process.env.http_proxy || process.env.HTTP_PROXY;
         }

         if (proxyConfig || proxy) {
            const proxyURL = new URL(proxyConfig?.url || proxy);
            this.noproxy = proxyConfig?.noproxy || noProxyList;
            this.proxy = {
               protocol: proxyURL.protocol,
               hostname: proxyURL.hostname,
               port: proxyURL.port,
               username: proxyURL.username || proxyConfig?.credentials?.username || null,
               password: proxyURL.password || proxyConfig?.credentials?.password || null
            };
         }

         this.logger.debug('configureProxy: Proxy configured', this.proxy);
      }

      /**
       * Checks if the URL should bypass the proxy.
       * @param {string} url - The URL to check.
       * @param {string[]} noProxyList - The list of domains to bypass the proxy.
       * @returns {boolean} - True if the URL should bypass the proxy, otherwise false.
       */
      shouldBypassProxy(url, noProxyList) {
         const parsedUrl = new URL(url);
         const hostname = parsedUrl.hostname;

         return noProxyList.some((entry) => {
            if (entry === '*') {
               return true;
            } else {
               return hostname.endsWith(entry);
            }
         });
      }

      /**
       * Cleans form data by removing undefined or empty values.
       * @param {Object} form - The form data.
       * @returns {Object} - The cleaned form data.
       */
      cleanForm(form) {
         const cleanedForm = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== undefined && value !== ''));
         this.logger.debug('cleanForm: Cleaned form data', cleanedForm);
         return cleanedForm;
      }

      /**
       * Makes a POST request.
       * @param {Object} options - The request options.
       * @returns {Promise<Object>} - The response from the request.
       */
      async makePostRequest(options) {
         this.logger.debug('makePostRequest: Making POST request with options', options);

         const axiosOptions = {
            method: options.method,
            url: options.url,
            headers: options.headers,
            data: new URLSearchParams(options.form).toString()
         };

         if (!options.rejectUnauthorized) {
            axiosOptions.httpAgent = new http.Agent({ rejectUnauthorized: options.rejectUnauthorized });
            axiosOptions.httpsAgent = new https.Agent({ rejectUnauthorized: options.rejectUnauthorized });
         }

         if (this.proxy && !this.shouldBypassProxy(options.url, this.noproxy)) {
            axiosOptions.proxy = {
               protocol: this.proxy.protocol,
               host: this.proxy.hostname,
               port: this.proxy.port,
               auth: {
                  username: this.proxy.username,
                  password: this.proxy.password
               }
            };
         } else {
            axiosOptions.proxy = false; // Disable proxy if URL is in the NO_PROXY list
         }

         this.logger.debug('makePostRequest: Axios request options prepared', axiosOptions);

         return axios(axiosOptions).catch((error) => {
            this.logger.error('makePostRequest: Error during POST request', error);
            throw error;
         });
      }

      /**
       * Handles the response from the POST request.
       * @param {Object} response - The response object.
       * @param {Object} msg - Input message object.
       * @param {Function} send - Function to send messages.
       */
      handleResponse(response, msg, send) {
         this.logger.debug('handleResponse: Handling response', response);

         if (!response || !response.data) {
            this.logger.warn('handleResponse: Invalid response data', response);
            this.handleError({ message: 'Invalid response data' }, msg, send);
            return;
         }

         msg.oauth2Response = { ...(response.data || {}), access_token_url: this.access_token_url || '', authorization_endpoint: this.authorization_endpoint || '' };
         msg.headers = response.headers || {}; // Include headers in the message
         this.setStatus('green', `HTTP ${response.status}, ok`);
         this.logger.debug('handleResponse: Response data set in message', msg);

         const expireTime = Math.floor(Date.now() / 1000) + (response.data.expires_in || 3600);
         this.credentials.access_token = response.data.access_token;
         this.credentials.expire_time = expireTime;
         this.credentials = { ...this.credentials, oauth2Response: msg.oauth2Response, headers: msg.headers };
         RED.nodes.addCredentials(this.id, this.credentials);

         send(msg);
      }

      /**
       * Handles errors from the POST request.
       * @param {Object} error - The error object.
       * @param {Object} msg - Input message object.
       * @param {Function} send - Function to send messages.
       */
      handleError(error, msg, send) {
         this.logger.error('handleError: Handling error', error);

         const status = error.response ? error.response.status : error.code;
         const message = error.response ? error.response.statusText : error.message;
         const data = error.response && error.response.data ? error.response.data : {};
         const headers = error.response ? error.response.headers : {};
         msg.oauth2Error = { status, message, data, headers };
         this.setStatus('red', `HTTP ${status}, ${message}`);
         this.logger.debug('handleError: Error data set in message', msg);

         if (this.sendErrorsToCatch) {
            send([null, msg]);
         } else {
            this.error(msg);
            send([null, msg]);
         }
      }

      /**
       * Sets the status of the node.
       * @param {string} color - The color of the status indicator.
       * @param {string} text - The status text.
       */
      setStatus(color, text) {
         this.logger.debug('setStatus: Setting status', { color, text });
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
      try {
         const credentials = RED.nodes.getCredentials(req.params.token);
         if (credentials) {
            res.json({ code: credentials.code, redirect_uri: credentials.redirect_uri });
         } else {
            res.status(404).send('oauth2.error.no-credentials');
         }
      } catch (error) {
         res.status(500).send('oauth2.error.server-error');
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
         res.status(400).send('oauth2.error.no-credentials');
      }
   });

   // Register the OAuth2Node node type
   RED.nodes.registerType('oauth2', OAuth2Node, {
      credentials: {
         client_id: { type: 'text' },
         client_secret: { type: 'text' },
         access_token: { type: 'text' },
         username: { type: 'text' },
         password: { type: 'text' },
         refresh_token: { type: 'text' },
         expire_time: { type: 'text' },
         open_authentication: { type: 'text' }
      }
   });
};
