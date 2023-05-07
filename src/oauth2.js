const { createBackwardCompatible } = require("./libs/utils.js");

module.exports = function (RED) {
  function OAuth2(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {

      // If this is pre-1.0, 'send' will be undefined, so fallback to node.send 
      send = send || function () { node.send.apply(node, arguments) }
      // Backwards compatibility - https://nodered.org/blog/2019/09/20/node-donew

      createBackwardCompatible(config);

      let options = {
        method: "POST",
        url: config.accessTokenUrl,
        headers: {
          authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
          contentType: "application/x-www-form-urlencoded",
          accept: "application/json"
        },
        rejectUnauthorized: config.rejectUnauthorized,
        form: {
          grantType: config.grantType,
          scope: config.scope,
        },
      };

      if (config.headers) {
        for (let h in config.headers) {
          if (config.headers[h] && !options.headers.hasOwnProperty(h)) {
            options.headers[h] = config.headers[h];
          }
        }
      }

      switch (config.grantType) {
        case "oauth2Request": {
          options.headers.authorization = `Basic ${Buffer.from(`${msg.oauth2Request.credentials.clientId}:${msg.oauth2Request.credentials.clientSecret}`).toString("base64")}`;
          if (msg.oauth2Request.headers) {
            for (let h in msg.oauth2Request.headers) {
              if (msg.oauth2Request.headers[h] && !options.headers.hasOwnProperty(h)) {
                options.headers[h] = msg.oauth2Request.headers[h];
              }
            }
          }
          options.rejectUnauthorized = msg.oauth2Request?.rejectUnauthorized;
          options.form.grantType = msg.oauth2Request.credentials.grantType;
          options.form.scope = msg.oauth2Request.credentials.scope;
          console.log(`${msg.oauth2Request.credentials.grantType}: ${options}`)
          break;
        }
        // case "clientCredentials":{
        //   console.log(`${config.grantType}: ${options}`)
        //   break;
        // }
        case "password": {
          options.form.username = config.username;
          options.form.password = config.password;
          console.log(`${config.grantType}: ${options}`)
          break;
        }
        case "authorizationCode": {
          options.form.code = config.code;
          options.form.redirectUri = config.redirectUri;
          console.log(`${config.grantType}: ${options}`)
          break;
        }
        case "refreshToken": {
          options.form.refreshToken = config.refreshToken;
          console.log(`${config.grantType}: ${options}`)
          break;
        }
      }
      const credentials = RED.nodes.getCredentials(node.id);
      if (!credentials) {
        RED.nodes.addCredentials(node.id, options);

      } else {
        RED.nodes.addCredentials(node.id, credentials);
      }

      const sendError = (e) => {
        node.status({ fill: "red", shape: "dot", text: "Error" });
        let errorMsg = e.message;
        if (e.message && isNaN(e.message.substring(0, 1)) && e.status) {
          errorMsg = e.status + " " + e.message;
        }
        msg.response = e.response;
        if (config.errorHandling === "other output") {
          send([null, msg]);
        } else if (config.errorHandling === "throw exception") {
          if (done) {
            done(errorMsg);
          } else {
            node.error(errorMsg, msg);
          }
        } else {
          send(msg);
          if (done) done();
        }
      };

      // generate the options for the request
    })
  }
  RED.nodes.registerType("oauth2", OAuth2);

  RED.nodes.registerType("oauth2-credentials", OAuth2, {
    credentials: {
      displayName: { type: "text" },
      clientId: { type: "text" },
      clientSecret: { type: "password" },
      accessToken: { type: "password" },
      refreshToken: { type: "password" },
      expireTime: { type: "password" },
      code: { type: "password" },
      proxy: { type: "json" },
    },
  });

  RED.httpAdmin.get("/getGetnetSpec", (request, response) => {
  });
};

