/**
 * Store credentials based on configuration and message.
 * @param {object} RED - The Node-RED runtime object.
 * @param {object} config - The configuration object.
 * @param {object} msg - The message object.
 * @returns {object} - The options object containing stored credentials.
 */
const storeCredentials = (RED, config, msg) => {
  const options = {
    url: config.accessTokenUrl,
    grantType: config.grantType,
    rejectUnauthorized: config.rejectUnauthorized,
    form: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scope: config.scope
    }
  };

  if (config.proxy) {
    // Check environment variables for proxy settings
    const proxyEnv = process.env.http_proxy || process.env.HTTP_PROXY;
    const noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    
    options.proxy = {
      type: '',
      name: '',
      url: '',
      noproxy: [],
      credentials: {}
    };

    if (proxyEnv) {
      options.proxy.type = 'http';
      options.proxy.url = proxyEnv;
    }

    if (noProxyEnv) {
      options.proxy.noproxy = noProxyEnv.split(',');
    }

    const proxy = RED.nodes.getNode(config.proxy);
    options.proxy.type = proxy?.type || null;
    options.proxy.name = proxy?.name || null;
    options.proxy.url = proxy?.url || null;
    options.proxy.noproxy = proxy?.noproxy || null;
    options.proxy.credentials = proxy?.credentials || null;
  }

  if (config.headers) {
    options.headers = { ...(options.headers || {}) };
    Object.keys(config.headers).forEach((h) => {
      const header = config.headers[h];
      if (header.key && !options.headers[header.key]) {
        switch (header.type) {
          case 'json':
            options.headers[header.key] = JSON.parse(header.value);
            break;
          case 'num':
            options.headers[header.key] = parseInt(header.value, 10);
            break;
          case 'str':
            options.headers[header.key] = header.value;
            break;
          case 'bool':
            options.headers[header.key] = header.value === 'true';
            break;
        }
      } else if (header.key) {
        options.headers[header.key] = header.value;
      }
    });
  }

  if (config.grantType === 'oauth2Request' && msg.oauth2Request) {
    options.url = msg.oauth2Request.accessTokenUrl || null;
    if (msg.oauth2Request.headers) {
      options.headers = { ...(options.headers || {}) };
      Object.keys(msg.oauth2Request.headers).forEach((h) => {
        if (msg.oauth2Request.headers[h] && !options.headers[h]) {
          options.headers[h] = msg.oauth2Request.headers[h];
        }
      });
    }

    const credentials = msg.oauth2Request.credentials;
    if (credentials) {
      options.grantType = credentials.grantType || options.grantType;
      options.form.username = credentials.username || options.form.username;
      options.form.password = credentials.password || options.form.password;
      options.form.refreshToken = credentials.refreshToken || options.form.refreshToken;
      options.form.scope = credentials.scope || options.form.scope;
      options.rejectUnauthorized = credentials.rejectUnauthorized || options.rejectUnauthorized;
      options.form.clientId = credentials.clientId || options.form.clientId;
      options.form.clientSecret = credentials.clientSecret || options.form.clientSecret;
    }

    delete msg.oauth2Request;
  }

  if (config.grantType === 'password') {
    options.form.username = config.userName;
    options.form.password = config.password;
  }

  if (config.grantType === 'authorizationCode') {
    if (config.clientCredentialsInBody) {
      options.form.clientId = config.clientId;
      options.form.clientSecret = config.clientSecret;
    }

    const credentials = RED.nodes.getCredentials(config.id);
    if (credentials) {
      options.form.code = credentials.code;
      options.form.redirectUri = credentials.redirectUri;
    }
  }

  if (config.grantType === 'refreshToken') {
    options.form.refreshToken = config.refreshToken;
  }

  return options;
};

/**
 * Create options object by invoking storeCredentials function.
 * @param {object} RED - The Node-RED runtime object.
 * @param {object} config - The configuration object.
 * @param {object} msg - The message object.
 * @returns {object} - The options object containing stored credentials.
 */
module.exports = (RED, config, msg) => {
  return storeCredentials(RED, config, msg);
};
