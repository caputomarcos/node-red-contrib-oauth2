exports.default = {
  setup(app) {
    console.log('The gitpod-plugin gets installed for ' + app.name + '.');
  },
  configure: {
    helmet(config) {
      config.contentSecurityPolicy = false;
      return config;
    },
    vite(config) {
      config.server.hmr.clientPort = 443;
      return config;
    }
  }
};
