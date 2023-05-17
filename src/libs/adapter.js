const StoreCredentials = (RED, config, msg) => {
    
    // Define OAuth2 configuration
    let oauthConfig = {
        tokenEndpoint: config.accessTokenUrl,
        introspectEndpoint: 'http://localhost:8080/v1/oauth/introspect',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: 'https://www.example.com'
    };

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

    if (config.proxy) {
        options.proxy = {type:'', name:'', url:'', noproxy:[], credentials:{}}
        const proxy = RED.nodes.getNode(config.proxy);
        options.proxy.type =  proxy.type ? proxy.type : null 
        options.proxy.name =  proxy.name ? proxy.name : null
        options.proxy.url = proxy.url ?  proxy.url : null 
        options.proxy.noproxy = proxy.noproxy ?  proxy.noproxy : null 
        options.proxy.credentials = proxy.credentials ?  proxy.credentials : null 
    }

    if (config.headers) {
        options.headers = Object.keys(config.headers).reduce((acc, h) => {
            if (config.headers[h].key && !options.headers[config.headers[h].key]) {
                if (config.headers[h].type === 'json') acc[config.headers[h].key] = JSON.parse(config.headers[h].value);
                if (config.headers[h].type === 'num') acc[config.headers[h].key] = Number.parseInt(config.headers[h].value);
                if (config.headers[h].type === 'str') acc[config.headers[h].key] = config.headers[h].value;
                if (config.headers[h].type === 'bool') config.headers[h].value === 'true' ? true : false;
            } else if (config.headers[h].key) {
                acc[config.headers[h].key] = config.headers[h].value;
            }
            return acc;
        }, options.headers || {});
    }

    if (config.grantType === 'oauth2Request' && msg.oauth2Request) {
        options.url = msg.oauth2Request.access_token_url ? msg.oauth2Request.access_token_url : null;
        if (msg.oauth2Request.headers) {
            options.headers = Object.keys(msg.oauth2Request.headers).reduce((acc, h) => {
                if (msg.oauth2Request.headers[h] && !options.headers[h]) {
                    acc[h] = msg.oauth2Request.headers[h];
                }
                return acc;
            }, options.headers || {});
        }

        if (msg.oauth2Request.credentials.grant_type) options.form.grant_type = msg.oauth2Request.credentials.grant_type;
        if (options.form.grantType === 'password') {
            options.form.username = msg.oauth2Request.credentials.username
            options.form.password = msg.oauth2Request.credentials.password
        }
        if (options.form.grantType=== 'refresh_token') options.form.refreshToken = msg.oauth2Request.credentials.refresh_token;        
        
        if (msg.oauth2Request.credentials.scope) options.form.scope = msg.oauth2Request.credentials.scope;
        if (msg.oauth2Request.rejectUnauthorized) options.rejectUnauthorized = msg.oauth2Request.rejectUnauthorized;

        if (msg.oauth2Request.credentials.client_id && msg.oauth2Request.credentials.client_secret) {
            options.form.client_id = msg.oauth2Request.credentials.client_id;
            options.form.client_secret = msg.oauth2Request.credentials.client_secret;
            options.headers.authorization = `Basic ${Buffer.from(`${options.form.clientId}:${options.form.clientSecret}`).toString("base64")}`;
        }
        delete msg.oauth2Request
    }

    if (config.grantType === 'password') {
        options.form.username = config.userName;
        options.form.password = config.password;
    }
    if (config.grantType === "authorizationCode") {
        // Some services accept these via Authorization while other require it in the POST body
        if (config.clientCredentialsInBody) {
          options.form.client_id = config.clientId;
          options.form.client_secret = config.clientSecret;
        }

        const credentials = RED.nodes.getCredentials(config.id);
        if (credentials) {
          options.form.code = credentials.code;
          options.form.redirect_uri = credentials.redirectUri;
        }
      }
    if (config.grantType === 'refreshToken') options.form.refreshToken = config.refreshToken;
    
    return options;
}

module.exports = (RED, config, msg) => {
    return StoreCredentials(RED,config, msg);
}
