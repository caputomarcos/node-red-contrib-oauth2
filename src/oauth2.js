const { createBackwardCompatible } = require("./libs/utils.js");
const optionsAdapter = require("./libs/adapter.js");

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
        if (config.errorHandling === "other output") {
          send([msg, { message: e, source: { id: node.id } }]);
        } else if (config.errorHandling === "throw exception") {
          node.error({ message: e, source: { id: node.id } });
        } else {
          send(msg);
        }
        if (done) done();
      };
      sendError({ message: 'error', status: 'test', errorMsg: 'eita!' })

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

