const axios = require('axios');
const jwt = require('jsonwebtoken');

// Define OAuth2 configuration
const oauthConfig = {
    tokenEndpoint: 'http://localhost:8080/v1/oauth/tokens',
    introspectEndpoint: 'http://localhost:8080/v1/oauth/introspect',
    clientId: 'test_client_1',
    clientSecret: 'test_secret',
    redirectUri: 'http://localhost:1888/admin/oauth2/redirect'
};

// Define JWT configuration
const jwtConfig = {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'myapp',
    audience: oauthConfig.clientId
};

// Define functions for each grant type
async function clientCredentials() {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('scope', 'read_write');

    const tokenResponse = await axios.post(oauthConfig.tokenEndpoint, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: oauthConfig.clientId,
            password: oauthConfig.clientSecret
        }
    });

    return tokenResponse.data;
}

async function authorizationCode(code, jwtToken = null) {
    // Define the authorization request
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('redirect_uri', oauthConfig.redirectUri);

    // Exchange code for access token
    const tokenResponse = await axios.post(oauthConfig.tokenEndpoint, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: oauthConfig.clientId,
            password: oauthConfig.clientSecret
        }
    });

    return tokenResponse.data;
}

async function password(jwtToken = null) {
    // Define the password grant request
    const passwordGrantRequest = {
        grant_type: 'password',
        username: 'test@user',
        password: 'test_password',
        scope: 'read_write'
    };

    if (jwtToken) {
        passwordGrantRequest.nonce = jwtToken;
    }

    const formData = new URLSearchParams(passwordGrantRequest);

    const tokenResponse = await axios.post(oauthConfig.tokenEndpoint, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: oauthConfig.clientId,
            password: oauthConfig.clientSecret
        }
    });

    return tokenResponse.data;
}

async function refreshToken() {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', '6fd8d272-375a-4d8a-8d0f-43367dc8b791');

    const tokenResponse = await axios.post(oauthConfig.tokenEndpoint, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: oauthConfig.clientId,
            password: oauthConfig.clientSecret
        }
    });

    return tokenResponse.data;
}

// Define function to generate JWT token
function generateJwtToken(tokenData) {
    return jwt.sign(tokenData, oauthConfig.clientSecret, jwtConfig);
}

// Define async function to get an access token
async function getAccessToken(code, grantType, jwtToken = null) {
    let tokenResponse;

    switch (grantType) {
        case 'clientCredentials':
            tokenResponse = await clientCredentials();
            break;
        case 'authorizationCode':
            tokenResponse = await authorizationCode(code, jwtToken);
            break;
        case 'password':
            tokenResponse = await password(jwtToken);
            break;
        case 'refresh_token':
            tokenResponse = await refreshToken();
            break;
        default:
            throw new Error(`Unsupported grant type: ${ grantType }`);
    }

    // Generate JWT token
    const jwtTokenData = {
        sub: tokenResponse.access_token,
        scope: tokenResponse.scope
    };
    jwtToken = generateJwtToken(jwtTokenData);

    return {
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type,
        scope: tokenResponse.scope,
        refreshToken: tokenResponse.refresh_token,
        jwtToken: jwtToken
    };
}

module.exports = {
    getAccessToken
};
