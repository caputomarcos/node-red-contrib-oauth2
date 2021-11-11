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
  let request = require("request");

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
      this.headers = oauth2Node.headers || {};

      // copy "this" object in case we need it in context of callbacks of other functions.
      let node = this;

      // respond to inputs....
      this.on("input", function (msg) {

        if (oauth2Node.headers) {
          for (var h in oauth2Node.headers) {
            if (oauth2Node.headers[h] && !Headers.hasOwnProperty(h)) {
              Headers[h] = oauth2Node.headers[h];
            }
          }
        }
        // Put all together
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
        };
        delete msg.oauth2Request;
        // make a post request
        request(options, function (error, response) {
          try {
            if (error) {
              msg[node.container] = JSON.parse(JSON.stringify(error));
              node.status({ fill: "red", shape: "dot", text: `ERR ${error.code}` });
            } else {
              console.log(response);
              msg[node.container] = JSON.parse(response.body ? response.body : JSON.stringify("{}"));
              if (response.statusCode === 200) {
                node.status({
                  fill: "green",
                  shape: "dot",
                  text: `HTTP ${response.statusCode}, ok`,
                });
              } else {
                node.status({
                  fill: "yellow",
                  shape: "dot",
                  text: `HTTP ${response.statusCode}, nok`,
                });
              };
            }
          } catch (e) {
            msg[node.container] = response;
            msg.error = e;
            node.status({
              fill: "red",
              shape: "dot",
              text: `HTTP ${response.statusCode}, nok`,
            });
          };
          node.send(msg);
        });
      });
    }
  }

  RED.nodes.registerType("oauth2", OAuth2Node);
};
