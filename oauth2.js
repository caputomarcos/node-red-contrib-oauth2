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
  let request = require('request');
  var querystring = require('querystring');

  // The main node definition - most things happen in here
  function OAuth2Node(oauth2Node) {
    // Create a RED node
    RED.nodes.createNode(this, oauth2Node);

    // Store local copies of the node configuration (as defined in the .html)
    this.name = oauth2Node.name || "";
    this.container = oauth2Node.container || "oauth2Response";
    this.access_token_url = oauth2Node.access_token_url || "";
    this.grant_type = oauth2Node.grant_type || "password";
    this.username = oauth2Node.username || "";
    this.password = oauth2Node.password || "";
    this.client_id = oauth2Node.client_id || "";
    this.client_secret = oauth2Node.client_secret || "";
    this.scope = oauth2Node.scope || "";

    // copy "this" object in case we need it in context of callbacks of other functions.
    let node = this;

    let msg = {};
    // msg.payload = this.payload;

    // respond to inputs....
    this.on("input", function (msg) {

      // set an empty form
      let Form = {};

      // TODO - ??? =)
      let Method = "Post";
      let Authorization = '';
      // Choice a grant_type
      if (node.grant_type === "set_by_credentials" && msg.oauth2Request) {
        node.access_token_url = msg.oauth2Request.access_token_url;
        node.client_id = msg.oauth2Request.credentials.client_id;
        node.client_secret = msg.oauth2Request.credentials.client_secret;
        Form = msg.oauth2Request.credentials;
        if (msg.oauth2Request.username && msg.oauth2Request.password) {
          // TODO - ??? =)
          Authorization = 'Basic ' + Buffer.from(`${msg.oauth2Request.username}:${msg.oauth2Request.password}`).toString('base64');
        } else {
          // TODO - ??? =)
          Authorization = 'Basic ' + Buffer.from(`${node.client_id}:${node.client_secret}`).toString('base64');
        }
      } else if (node.grant_type === "password") {
        Form = {
          'username': node.username,
          'password': node.password,
          'grant_type': node.grant_type,
          'client_id': node.client_id,
          'client_secret': node.client_secret
        };
        // TODO - ??? =)
        Authorization = 'Basic ' + Buffer.from(`${node.client_id}:${node.client_secret}`).toString('base64');
      } else if (node.grant_type === "client_credentials") {
        Form = {
          'grant_type': node.grant_type,
          'client_id': node.client_id,
          'client_secret': node.client_secret,
          'scope': node.scope
        };
        // TODO - ??? =)
        Authorization = 'Basic ' + Buffer.from(`${node.client_id}:${node.client_secret}`).toString('base64');
      }

      let Body = querystring.stringify(Form);

      // set Headers
      // TODO - improve 'Authorization': 'Basic ' ??? =)
      let Headers = {
        // 'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(Body),
        'Authorization': Authorization
      };

      // Put all together
      let Options = {
        method: Method,
        url: node.access_token_url,
        headers: Headers,
        body: Body,
        json: false
      };

      // make a post request
      request.post(Options, function (err, response, body) {
        if (msg.oauth2Request) delete msg.oauth2Request;
        try {
          let oauth2Body = JSON.parse(body ? body : JSON.stringify("{}"));
          if (response && response.statusCode && response.statusCode === 200) {
            msg[node.container] = {
              authorization: `${oauth2Body.token_type} ${oauth2Body.access_token}`,
              oauth2Response: {
                statusCode: response.statusCode,
                statusMessage: response.statusMessage,
                body: oauth2Body
              }
            };

            node.status({
              fill: "green",
              shape: "dot",
              text: `HTTP ${response.statusCode}, has token!`
            });
          } else if (response && response.statusCode && response.statusCode !== 200) {
            msg[node.container] = {
              oauth2Response: {
                statusCode: response.statusCode,
                statusMessage: response.statusMessage,
                body: oauth2Body
              }
            };
            node.status({
              fill: "red",
              shape: "dot",
              text: `HTTP ${response.statusCode}, hasn't token!`
            });
          }
          if (err && err.code) {
            node.status({fill: "red", shape: "dot", text: `ERR ${err.code}`});
            msg.err = JSON.parse(JSON.stringify(err));
          } else if (err && err.message && err.stack) {
            node.status({fill: "red", shape: "dot", text: `ERR ${err.message}`});
            msg.err = {message: err.message, stack: err.stack};
          }
          node.send(msg);
        };
        catch(err) {
          console.log(Date.now())
          console.log(err.message);
          console.log(body);
        };
      });
    });
  }

  RED.nodes.registerType("oauth2", OAuth2Node);
}
