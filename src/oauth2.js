const { createBackwardCompatible } = require("./libs/utils.js");
const  optionsAdapter   = require("./libs/adapter.js");

module.exports = function (RED) {
  function OAuth2(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {

      // If this is pre-1.0, 'send' will be undefined, so fallback to node.send 
      send = send || function () { node.send.apply(node, arguments) }
      // Backwards compatibility - https://nodered.org/blog/2019/09/20/node-donew

      createBackwardCompatible(config);
      let options = optionsAdapter(config, msg)
      const credentials = RED.nodes.getCredentials(node.id);
      if (!credentials) {
        RED.nodes.addCredentials(node.id, options);
      } else {
        RED.nodes.addCredentials(node.id, credentials);
      }

      // eslint-disable-next-line no-unused-vars
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

};

