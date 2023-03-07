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
      this.on("input", function (msg) {
        // generate the options for the request
        var options = {}
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

            options.form.code = node.credentials.code;
            options.form.redirect_uri = node.credentials.redirectUri;
          };
        };

        // add any custom headers, if we haven't already set them above
        if (oauth2Node.headers) {
          for (var h in oauth2Node.headers) {
            if (oauth2Node.headers[h] && !options.headers.hasOwnProperty(h)) {
              options.headers[h] = oauth2Node.headers[h];
            }
          }
        }
        delete msg.oauth2Request;
        // make a post request
        axios.post(options.url, options.form, {
          headers: options.headers,
          httpsAgent: node.rejectUnauthorized ? new https.Agent({ rejectUnauthorized: true }) : new https.Agent({}),
        })
          .then(response => {
            msg[node.container] = response.data || {};
            if (response.status === 200) {
              node.status({ fill: "green", shape: "dot", text: `HTTP ${response.status}, ok` });
            } else {
              node.status({ fill: "yellow", shape: "dot", text: `HTTP ${response.status}, nok` });
            }
            node.send(msg);
          })
          .catch(error => {
            msg[node.container] = error.response ? error.response.data || {} : {};
            node.status({ fill: "red", shape: "dot", text: `ERR ${error.code}` });
            node.send(msg);
          });
      });
    }
  };

  RED.nodes.registerType("oauth2-credentials",OAuth2Node,{
    credentials: {
        displayName: {type:"text"},
        clientId: {type:"text"},
        clientSecret: {type:"password"},
        accessToken: {type:"password"},
        refreshToken: {type:"password"},
        expireTime: {type:"password"},
        code: {type:"password"}
    }
  });


  RED.httpAdmin.get('/oauth2/credentials/:token', function(req, res) {
    var credentials = RED.nodes.getCredentials(req.params.token);
    res.json({code: credentials.code, redirect_uri: credentials.redirect_uri});
  });

  RED.httpAdmin.get('/oauth2/redirect', function(req, res) {
    if (req.query.code) {
      var state = req.query.state.split(':');
      var node_id = state[0];
      var credentials = RED.nodes.getCredentials(node_id);
      credentials.code = req.query.code;

      var html = "<HTML><HEAD><script language=\"javascript\" type=\"text/javascript\">" +
      "function closeWindow() {" +
      "window.open('','_parent','');" +
      "window.close();" +
      "}" +
      "function delay() {\n" +
      "setTimeout(\"closeWindow()\", 1000);\n" +
      "}\n" +
      "</script></HEAD>" +
      "<BODY onload=\"javascript:delay();\">" +
      "<p>Success! This page can be closed if it doesn't do so automatically.</p>"
      "</BODY></HTML>";

      res.send(html);  
    }
  });

  
  RED.httpAdmin.get('/oauth2/auth', function(req, res){
    if (!req.query.clientId || !req.query.clientSecret ||
        !req.query.id || !req.query.callback) {
        res.send(400);
        return;
    }
    const node_id = req.query.id;
    const callback = req.query.callback;
    const redirectUri = req.query.redirectUri;
    const credentials = JSON.parse(JSON.stringify(req.query, getCircularReplacer()))
    const scope = req.query.scope;
    const csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
    
    credentials.csrfToken = csrfToken;
    credentials.callback = callback;
    credentials.redirectUri = redirectUri;
    res.cookie('csrf', csrfToken);
    var l = url.parse(req.query.authorizationEndpoint, true);
    res.redirect(url.format({
      protocol: l.protocol.replace(':',''),
      hostname: l.hostname,
      pathname: l.pathname,
      query: {
          client_id: credentials.clientId,
          redirect_uri: redirectUri,
          state: node_id + ":" + csrfToken,
          scope: scope,
          response_type: 'code'
      }
    }));
    RED.nodes.addCredentials(node_id, credentials);
 });

  RED.httpAdmin.get('/oauth2/auth/callback', function(req, res) {
    if (req.query.error) {
        return res.send("oauth2.error.error", {error: req.query.error, description: req.query.error_description});
    }
    var state = req.query.state.split(':');
    var node_id = state[0];
    var credentials = RED.nodes.getCredentials(node_id);
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
        return res.send("oauth2.error.no-credentials");
    }
    if (state[1] !== credentials.csrfToken) {
        return res.status(401).send("oauth2.error.token-mismatch");
    }

  });
  RED.nodes.registerType("oauth2", OAuth2Node);
};
