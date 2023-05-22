const { CreateBackwardCompatible } = require('./libs/utils.js');
const { getAccessToken } = require('./libs/post.js');
const StoreCredentials = require('./libs/adapter.js');
const axios = require('axios');
const { URL } = require('url');
const crypto = require('crypto');
const https = require('https');
/**
 * This function replaces circular references in the provided object to allow
 * safe stringification.
 *
 * @param {object} obj - The object to check for circular references.
 * @returns {object} The object with circular references replaced.
 */
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }

      seen.add(value);
    }

    return value;
  };
};

module.exports = function (RED) {
  function OAuth2(config) {
    RED.nodes.createNode(this, config);

    const node = this;

    node.on('input', (msg, send, done) => {
      // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
      // Backwards compatibility - https://nodered.org/blog/2019/09/20/node-done
      send =
        send ||
        function () {
          node.send.apply(node, arguments);
        };

      const sendError = (e) => {
        setTimeout(() => {
          node.status({});
        }, 5000);
        node.status({ fill: 'red', shape: 'dot', text: 'Error' });
        if (config.errorHandling === 'other output') {
          send([msg, { msg: { error: { ...e, source: { id: node.id } } } }]);
        } else if (config.errorHandling === 'all in one') {
          msg.error = { ...e, source: { id: node.id } };
          node.error(msg);
        } else if (config.errorHandling === 'throw exception') {
          delete msg.topic;
          delete msg.payload;
          msg.error = { ...e, source: { id: node.id } };
          node.error(msg);
        } else {
          send(msg);
        }

        if (done) {
          done();
        }
      };

      CreateBackwardCompatible(config);
      // TODO: Review this code. maybe a better name.
      const payload = StoreCredentials(RED, config, msg);
      getAccessToken(payload)
        .then((data) => {
          setTimeout(() => {
            node.status({});
          }, 5000);
          node.status({ fill: 'green', shape: 'dot', text: 'ok' });
          msg[config.container] = data ? data : {};
          send(msg);
          done();
        })
        .catch((error) => {
          sendError({ message: error, status: error.message, errorMsg: error.stack });
        });
    });
  }

  /**
   * GET handler for OAuth2 credentials retrieval based on a token.
   * @param {object} req - The HTTP request object.
   * @param {object} res - The HTTP response object.
   */
  RED.httpAdmin.get('/oauth2/credentials/:token', (req, res) => {
    const credentials = RED.nodes.getCredentials(req.params.token);
    // if (!credentials) return res.status(401).json({ error: 'Token was missing or invalid!' });
    // if (!credentials.code) return res.status(401).json({ error: 'Token was missing or invalid!' });
    // if (!credentials.redirectUri) return res.status(401).json({ error: 'redirectUri was missing or invalid!' });
    if (credentials && credentials.code && credentials.redirectUri) {
      return res.status(200).json({
        code: credentials.code,
        redirectUri: credentials.redirectUri
      });
    }
  });

  /**
   * GET handler for /oauth2/redirect requests.
   * @param {object} req - The HTTP request object.
   * @param {object} res - The HTTP response object.
   */
  RED.httpAdmin.get('/oauth2/redirect', (req, res) => {
    if (req.query.code) {
      const [node_id] = req.query.state.split(':');
      const credentials = RED.nodes.getCredentials(node_id);
      if (credentials) {
        credentials.code = req.query.code ? req.query.code : null;
        credentials.state = req.query.state ? req.query.state : null;
        RED.nodes.addCredentials(node_id, credentials);
        const html = `<html>
          <head>
          <script language="javascript" type="text/javascript">
            function closeWindow() {
              window.open("", "_parent", "");
              window.close();
            }
            function delay() {
              setTimeout("closeWindow()", 2000);
            }
          </script>
        </head>
        <body onload="javascript:delay();">
            <div style="text-align: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="#42b983" />
                <text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="24px" font-weight="bold" dy=".3em">Success!</text>
              </svg>
              <p>This page can be closed if it doesn't do so automatically.</p>
            </div>
          </body>
        </html>`;
        return res.status(200).send(html);
      }
    } else {
      const html = `<html>
       <head>
          <script language="javascript" type="text/javascript">
            function closeWindow() {
              window.open("", "_parent", "");
              window.close();
            }
            function delay() {
              setTimeout("closeWindow()", 2000);
            }
          </script>
        </head>
        <body onload="javascript:delay();">        
          <div style="text-align: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="#ff0000" />
              <text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="24px" font-weight="bold" dy=".3em">Error 400</text>
            </svg>
            <p>An error occurred. Please check your credentials and try again.</p>
          </div>
        </body>
      </html>`;
      return res.status(400).send(html);
    }
  });

  /**
   * GET handler for OAuth2 authorization code flow.
   * @param {object} req - The HTTP request object.
   * @param {object} res - The HTTP response object.
   */
  RED.httpAdmin.get('/oauth2/auth', async (req, res) => {
    if (!req.query.clientId || !req.query.clientSecret || !req.query.id || !req.query.callback) {
      return res.status(400).json({ error: 'Bad Request' });
    }

    const node_id = req.query.id;
    const credentials = JSON.parse(JSON.stringify(req.query, getCircularReplacer()));
    const proxy = RED.nodes.getNode(credentials.proxy);

    let proxyOptions;
    if (proxy) {
      const match = proxy.url.match(/^(https?:\/\/)?(.+)?:([0-9]+)?/i);
      if (match) {
        const proxyURL = new URL(proxy.url);
        proxyOptions = {
          protocol: proxyURL.protocol,
          hostname: proxyURL.hostname,
          port: proxyURL.port,
          username: proxy.credentials.username,
          password: proxy.credentials.password
        };
      }
    }

    const csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');

    credentials.csrfToken = csrfToken;
    RED.nodes.addCredentials(node_id, credentials);

    res.cookie('csrf', csrfToken);

    const l = new URL(req.query.authorizationEndpoint);
    const redirectUrl = new URL(l);
    redirectUrl.searchParams.set('client_id', credentials.clientId);
    redirectUrl.searchParams.set('redirect_uri', credentials.redirectUri);
    redirectUrl.searchParams.set('state', credentials.id + ':' + credentials.csrfToken);
    redirectUrl.searchParams.set('scope', credentials.scope);
    redirectUrl.searchParams.set('response_type', 'code');

    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      const response = await axios.get(redirectUrl.toString(), {
        proxy: proxyOptions,
        httpsAgent: agent
      });
      res.redirect(response.request.res.responseUrl);
    } catch (error) {
      const statusCode = error?.code ? 500 : error?.response?.status || 404;
      const statusText = error?.message ? error.message : error?.response || 'Not Found';
      const html = `<html>
        <head>
          <script language="javascript" type="text/javascript">
            function closeWindow() {
              window.open("", "_parent", "");
              window.close();
            }
            function delay() {
              setTimeout("closeWindow()", 5000);
            }
          </script>
        </head>
        <body onload="javascript:delay();">
          <div style="text-align: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="#ff0000" />
              <text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="24px" font-weight="bold" dy=".3em">Error ${statusCode}</text>
            </svg>
            <p>${statusText}</p>
          </div>
        </body>
      </html>`;
      return res.status(statusCode).send(html);
    }
  });
  /**
   * Endpoint to handle the OAuth2 authorization callback.
   * @param {object} req - The HTTP request object.
   * @param {object} res - The HTTP response object.
   */
  RED.httpAdmin.get('/oauth2/auth/callback', (req, res) => {
    if (req.query.error) {
      return res.send('oauth2.error.error', {
        error: req.query.error,
        description: req.query.error_description
      });
    }

    if (!req.query.state) {
      return res.status(401).send('oauth2.error.state');
    }

    const state = req.query.state.split(':');
    const node_id = state[0];
    const credentials = RED.nodes.getCredentials(node_id);
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return res.send('oauth2.error.no-credentials');
    }

    if (state[1] !== credentials.csrfToken) {
      return res.status(401).json({ error: 'oauth2.error.token-mismatch' });
    }
  });

  RED.nodes.registerType('oauth2', OAuth2);

  /**
   * Registers an OAuth2Node node type with credentials object.
   * @param {string} "oauth2-credentials" - The name of the node type to register.
   * @param {OAuth2} OAuth2 - The constructor function for the node type.
   * @param {object} {Credentials} - an object specifying the credentials properties and their types.
   */
  RED.nodes.registerType('oauth2-credentials', OAuth2, {
    credentials: {
      displayName: { type: 'text' },
      clientId: { type: 'text' },
      clientSecret: { type: 'password' },
      accessToken: { type: 'password' },
      refreshToken: { type: 'password' },
      expireTime: { type: 'password' },
      code: { type: 'password' },
      proxy: { type: 'json' }
    }
  });
};
