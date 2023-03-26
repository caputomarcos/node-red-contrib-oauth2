/**
 * MIT License
 *
 * Copyright (c) 2019 Marcos Caputo <caputo.marcos@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 **/

module.exports = function (RED) {

  "use strict";

  // require any external libraries we may need....
  const axios = require('axios');
  const url = require('url');
  const crypto = require("crypto");
  const https = require('https');

  // The main node definition - most things happen in here
  class OAuth2Node {
    constructor(oauth2Node) {
      // Create a RED node
      RED.nodes.createNode(this, oauth2Node);

      // Store local copies of the node configuration (as defined in the .html)
      this.name = oauth2Node.name || "";
      this.container = oauth2Node.container || "";
      this.access_token_url = oauth2Node.access_token_url || "";
      this.grant_type = oauth2Node.grant_type || "";
      this.username = oauth2Node.username || "";
      this.password = oauth2Node.password || "";
      this.client_id = oauth2Node.client_id || "";
      this.client_secret = oauth2Node.client_secret || "";
      this.scope = oauth2Node.scope || "";
      this.rejectUnauthorized = oauth2Node.rejectUnauthorized || false;
      this.client_credentials_in_body = oauth2Node.client_credentials_in_body || false;
      this.headers = oauth2Node.headers || {};

      // copy "this" object in case we need it in context of callbacks of other functions.
      let node = this;

      // respond to inputs....
      this.on("input", async (msg) => {
        // generate the options for the request
        let options = {}
        if (node.grant_type === "set_by_credentials") {
          options = {
            'method': 'POST',
            'url': msg.oauth2Request.access_token_url,
            'headers': {
              'Authorization': "Basic " +
                Buffer.from(`${msg.oauth2Request.credentials.client_id}:${msg.oauth2Request.credentials.client_secret}`).toString(
                  "base64"
                ),
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            'rejectUnauthorized': node.rejectUnauthorized,
            form: {
              'grant_type': msg.oauth2Request.credentials.grant_type,
              'scope': msg.oauth2Request.credentials.scope
            }
          };
          if (msg.oauth2Request.credentials.grant_type === "password") {
            options.form.username = msg.oauth2Request.credentials.username;
            options.form.password = msg.oauth2Request.credentials.password;
          };
          if (msg.oauth2Request.credentials.grant_type === "refresh_token") {
            options.form.refresh_token = msg.oauth2Request.credentials.refresh_token;
          }
        } else {
          options = {
            'method': 'POST',
            'url': node.access_token_url,
            'headers': {
              'Authorization': "Basic " +
                Buffer.from(`${node.client_id}:${node.client_secret}`).toString(
                  "base64"
                ),
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            'rejectUnauthorized': node.rejectUnauthorized,
            form: {
              'grant_type': node.grant_type,
              'scope': node.scope
            }
          };
          if (node.grant_type === "password") {
            options.form.username = node.username;
            options.form.password = node.password;
          };
          if (node.grant_type === "authorization_code") {
            // Some services accept these via Authorization while other require it in the POST body
            if (node.client_credentials_in_body) {
              options.form.client_id = node.client_id;
              options.form.client_secret = node.client_secret;
            }

            const credentials = RED.nodes.getCredentials(this.id);
            options.form.code = credentials.code;
            options.form.redirect_uri = credentials.redirectUri;
          };
        };

        // add any custom headers, if we haven't already set them above
        if (oauth2Node.headers) {
          for (const h in oauth2Node.headers) {
            if (oauth2Node.headers[h] && !options.headers.hasOwnProperty(h)) {
              options.headers[h] = oauth2Node.headers[h];
            }
          }
        }
        delete msg.oauth2Request;
        // make a post request
        try {
          const response = await axios.post(options.url, options.form, {
            headers: options.headers,
            httpsAgent: node.rejectUnauthorized ? new https.Agent({ rejectUnauthorized: true }) : new https.Agent({}),
          });
          msg[node.container] = response.data || {};
          if (response.status === 200) {
            node.status({ fill: "green", shape: "dot", text: `HTTP ${response.status}, ok` });
          } else {
            node.status({ fill: "yellow", shape: "dot", text: `HTTP ${response.status}, nok` });
          }
          node.send(msg);
        } catch (error) {
          msg[node.container] = {
            error: {
              message: error.message,
              stack: error.stack
            }
          };
          node.status({ fill: "red", shape: "ring", text: "Error" });
          node.error(error, msg);
        }
      });
    }
  };

  RED.nodes.registerType("oauth2-credentials", OAuth2Node, {
    credentials: {
      displayName: { type: "text" },
      clientId: { type: "text" },
      clientSecret: { type: "password" },
      accessToken: { type: "password" },
      refreshToken: { type: "password" },
      expireTime: { type: "password" },
      code: { type: "password" }
    }
  });


  RED.httpAdmin.get('/oauth2/credentials/:token', async (req, res) => {
    try {
      const credentials = await RED.nodes.getCredentials(req.params.token);
      res.json({ code: credentials.code, redirect_uri: credentials.redirect_uri });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });

  RED.httpAdmin.get('/oauth2/redirect', async (req, res) => {
    try {

      const { code, state } = req.query;
      if (!code || !state) {
        return res.status(400).send('Bad Request');
      }

      const [nodeId] = state.split(':');
      const credentials = await RED.nodes.getCredentials(nodeId);
      credentials.code = code;
      await RED.nodes.addCredentials(nodeId, credentials);

      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>OAuth2 Redirect</title>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.opener = window;
                window.close();
              }, 1000);
            });
          </script>
        </head>
        <body>
          <p>Success! This page can be closed if it doesn't do so automatically.</p>
        </body>
      </html>
    `;

      res.set('Content-Security-Policy', "default-src 'self'");
      res.send(html);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });



  RED.httpAdmin.get('/oauth2/auth', async (req, res) => {
    // Check if all required parameters are present in the request query
    if (!req.query.clientId || !req.query.clientSecret || !req.query.id || !req.query.callback) {
      res.sendStatus(400);
      return;
    }

    // Get the required parameters from the request query
    const node_id = req.query.id;
    const callback = req.query.callback;
    const redirectUri = req.query.redirectUri;
    const scope = req.query.scope;

    // Create a new CSRF token and add it to the credentials
    const csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
    const credentials = {
      ...req.query,
      csrfToken,
      callback,
      redirectUri,
    };

    // Set the CSRF token cookie in the response
    res.cookie('csrf', csrfToken);

    try {
      // Construct the authorization URL for the OAuth2 provider
      const authorizationEndpoint = req.query.authorizationEndpoint;
      const parsedUrl = url.parse(authorizationEndpoint, true);
      const query = {
        client_id: credentials.clientId,
        redirect_uri: redirectUri,
        state: `${node_id}:${csrfToken}`,
        scope,
        response_type: 'code',
      };
      const redirectUrl = url.format({
        protocol: parsedUrl.protocol.replace(':', ''),
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname,
        query,
      });

      // Store the credentials in the Node-RED credential store
      await RED.nodes.addCredentials(node_id, credentials);

      // Redirect the user to the authorization URL
      res.redirect(redirectUrl);

    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });


  RED.httpAdmin.get('/oauth2/auth/callback', async (req, res) => {
    try {
      // Handle errors returned by the OAuth2 provider
      if (req.query.error) {
        return res.send("oauth2.error.error", { error: req.query.error, description: req.query.error_description });
      }

      // Extract node ID and credentials from state parameter
      const state = req.query.state.split(':');
      const node_id = state[0];
      const credentials = await RED.nodes.getCredentials(node_id);

      // Check if credentials are valid
      if (!credentials || !credentials.clientId || !credentials.clientSecret) {
        return res.send("oauth2.error.no-credentials");
      }

      // Check CSRF token
      if (state[1] !== credentials.csrfToken) {
        return res.status(401).send("oauth2.error.token-mismatch");
      }

      // Perform any other necessary async operations here

      // Success!
      res.send('Success!');
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred');
    }
  });

  RED.nodes.registerType("oauth2", OAuth2Node);
};
