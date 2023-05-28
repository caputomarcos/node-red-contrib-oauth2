/**
 * Create payload based on configuration and message.
 * @param {object} RED - The Node-RED runtime object.
 * @param {object} config - The configuration object.
 * @param {object} msg - The message object.
 * @returns {object} - The options object containing stored credentials.
 */
const createPayload = (RED, config, msg) => {
  const credentials = RED.nodes.getCredentials(config.id);
  if (msg.oauth2Request) {
    config = { ...config, ...msg.oauth2Request, ...msg.oauth2Request?.credentials };
  } else {
    config = { ...config, ...credentials };
  }
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

    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

    if (proxy && proxy?.type) options.proxy.type = proxy.type;
    if (proxy && proxy?.name) options.proxy.name = proxy.name;
    if (proxy && proxy?.url) options.proxy.url = proxy.url;
    if (proxy && proxy?.noproxy) options.proxy.noproxy = proxy.noproxy;
    if (proxy && proxy?.credentials) options.proxy.credentials = proxy.credentials;
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

  if (msg.oauth2Request) {
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
      options.form.clientId = credentials.clientId || options.form.clientId;
      options.form.clientSecret = credentials.clientSecret || options.form.clientSecret;
      if (credentials.grantType === 'password') {
        options.form.username = credentials.username || options.form.username;
        options.form.password = credentials.password || options.form.password;  
      }
      options.form.refreshToken = credentials.refreshToken || options.form.refreshToken;
      options.form.scope = credentials.scope || options.form.scope;
      options.rejectUnauthorized = credentials.rejectUnauthorized || options.rejectUnauthorized;
    }

    delete msg.oauth2Request;
  }

  if (!msg.oauth2Request && config.grantType === 'password') {
    options.form.username = config.username;
    options.form.password = config.password;
  }

  if (!msg.oauth2Request && config.grantType === 'authorizationCode') {
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

  if (!msg.oauth2Request && config.grantType === 'refreshToken') {
    options.form.refreshToken = config.refreshToken;
  }

  return options;
};

/**
 * Create options object by invoking createPayload function.
 * @param {object} RED - The Node-RED runtime object.
 * @param {object} config - The configuration object.
 * @param {object} msg - The message object.
 * @returns {object} - The options object containing stored credentials.
 */
module.exports = (RED, config, msg) => {
  return createPayload(RED, config, msg);
};
