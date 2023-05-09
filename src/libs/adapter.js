const optionsAdapter = (config, msg) => {

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
        if (msg.oauth2Request.rejectUnauthorized) options.rejectUnauthorized = msg.oauth2Request.rejectUnauthorized;
        if (msg.oauth2Request.credentials.client_id && msg.oauth2Request.credentials.client_secret) {
            options.headers.authorization = `Basic ${Buffer.from(`${msg.oauth2Request.credentials.client_id}:${msg.oauth2Request.credentials.client_secret}`).toString("base64")}`;
            if (msg.oauth2Request.credentials.grant_type) options.form.grantType = msg.oauth2Request.credentials.grant_type;
            if (msg.oauth2Request.credentials.scope) options.form.scope = msg.oauth2Request.credentials.scope;
            if (options.form.grantType === 'password') {
                options.form.userName = msg.oauth2Request.credentials.username
                options.form.password = msg.oauth2Request.credentials.password
            }
            if (options.form.grantType === 'refresh_token') options.form.refreshToken = msg.oauth2Request.credentials.refresh_token;
        }
    }

    if (config.grantType === 'password') {
        options.form.userName = config.userName;
        options.form.password = config.password;
    }
    if (config.grantType === 'authorizationCode') {
        options.form.code = config.code;
        options.form.redirectUri = config.redirectUri;
    }
    if (config.grantType === 'refreshToken') options.form.refreshToken = config.refreshToken;
    return options;
}

module.exports = (config, msg) => {
    return optionsAdapter(config, msg) 
}
