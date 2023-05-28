const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * Configuration for OAuth and JWT.
 * @typedef {object} OAuthConfig
 * @property {string} tokenEndpoint - The token endpoint URL.
 * @property {string} introspectEndpoint - The introspect endpoint URL.
 * @property {string} clientId - The client ID.
 * @property {string} clientSecret - The client secret.
 * @property {string} redirectUri - The redirect URI.
 */

/**
 * Configuration for JWT.
 * @typedef {object} JWTConfig
 * @property {string} algorithm - The algorithm used for signing the JWT.
 * @property {string} expiresIn - The expiration time for the JWT.
 * @property {string} issuer - The issuer of the JWT.
 * @property {string} audience - The audience of the JWT.
 */

/**
 * Payload for different grant types.
 * @typedef {object} GrantTypePayload
 * @property {string} grantType - The grant type.
 * @property {object} form - The form data.
 * @property {string} form.clientId - The client ID.
 * @property {string} form.clientSecret - The client secret.
 * @property {string} form.scope - The scope.
 * @property {string} form.code - The authorization code.
 * @property {string} form.redirectUri - The redirect URI.
 * @property {string} form.username - The username.
 * @property {string} form.password - The password.
 * @property {string} form.refreshToken - The refresh token.
 * @property {object} headers - The headers for the request.
 * @property {string} url - The URL for the request.
 */

/**
 * Response from the OAuth server.
 * @typedef {object} TokenResponse
 * @property {string} access_token - The access token.
 * @property {number} expires_in - The expiration time in seconds.
 * @property {string} token_type - The type of token.
 * @property {string} scope - The scope.
 * @property {string} refresh_token - The refresh token.
 */

class Oauth2Error extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

/**
 * Function to obtain an access token using the client credentials grant.
 * @param {GrantTypePayload} payload - The payload for the request.
 * @returns {Promise<TokenResponse>} The token response.
 * @throws {Error} If failed to obtain the access token.
 */
async function clientCredentials(payload, options) {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('scope', payload.form.scope);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...payload.headers
    };

    const tokenResponse = await handlerPostRequest(payload.url, formData, {
      ...options,
      headers,
      auth: {
        username: payload.form.clientId,
        password: payload.form.clientSecret
      }
    });

    return tokenResponse.data;
  } catch (error) {
    throw new Error(`Failed to obtain access token using client credentials. ${error} `);
  }
}

/**
 * Function to obtain an access token using the authorization code grant.
 * @param {GrantTypePayload} payload - The payload for the request.
 * @returns {Promise<TokenResponse>} The token response.
 * @throws {Error} If failed to obtain the access token.
 */
async function authorizationCode(payload, options) {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', payload.form.code);
    formData.append('redirect_uri', payload.form.redirectUri);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...payload.headers
    };

    const tokenResponse = await handlerPostRequest(payload.url, formData, {
      ...options,
      headers,
      auth: {
        username: payload.form.clientId,
        password: payload.form.clientSecret
      }
    });

    return tokenResponse.data;
  } catch (error) {
    throw new Error('Failed to obtain access token using authorization code');
  }
}

/**
 * Function to obtain an access token using the password grant.
 * @param {GrantTypePayload} payload - The payload for the request.
 * @returns {Promise<TokenResponse>} The token response.
 * @throws {Error} If failed to obtain the access token.
 */
async function password(payload, options) {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', payload.form.username);
    formData.append('password', payload.form.password);
    formData.append('scope', payload.form.scope);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...payload.headers
    };

    const tokenResponse = await handlerPostRequest(payload.url, formData, {
      ...options,
      headers,
      auth: {
        username: payload.form.clientId,
        password: payload.form.clientSecret
      }
    });

    return tokenResponse.data;
  } catch (error) {
    throw new Error('Failed to obtain access token using password grant');
  }
}

/**
 * Function to refresh an access token.
 * @param {GrantTypePayload} payload - The payload for the request.
 * @returns {Promise<TokenResponse>} The token response.
 * @throws {Error} If failed to refresh the access token.
 */
async function refreshToken(payload, options) {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', payload.form.refreshToken);
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...payload.headers
    };

    const tokenResponse = await handlerPostRequest(payload.url, formData, {
      ...options,
      headers,
      auth: {
        username: payload.form.clientId,
        password: payload.form.clientSecret
      }
    });

    return tokenResponse.data;
  } catch (error) {
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Generates a JWT token.
 * @param {string} clientSecret - The client secret used for signing.
 * @param {object} tokenData - The data to be included in the JWT token.
 * @param {JWTConfig} jwtConfig - The JWT configuration.
 * @returns {string} The generated JWT token.
 */
function generateJwtToken(clientSecret, tokenData, jwtConfig) {
  return jwt.sign(tokenData, clientSecret, jwtConfig);
}

/**
 * Function to get an access token based on the grant type.
 * @param {GrantTypePayload} payload - The payload for the request.
 * @returns {Promise<object>} The access token response.
 * @throws {Error} If an unsupported grant type is provided.
 */
async function getAccessToken(payload, options) {
  let tokenResponse;

  switch (payload.grantType) {
    case 'clientCredentials':
      tokenResponse = await clientCredentials(payload, options);
      break;
    case 'authorizationCode':
      tokenResponse = await authorizationCode(payload, options);
      break;
    case 'password':
      tokenResponse = await password(payload, options);
      break;
    case 'refreshToken':
      tokenResponse = await refreshToken(payload, options);
      break;
    default:
      throw new Error(`Unsupported grant type: ${payload.grantType}`);
  }

  const jwtConfig = {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'node-red-contrib-oauth2',
    audience: payload.form.clientId
  };

  const jwtTokenData = {
    sub: tokenResponse.access_token,
    scope: tokenResponse.scope
  };

  const generatedJwtToken = generateJwtToken(payload.form.clientSecret, jwtTokenData, jwtConfig);

  return {
    accessToken: tokenResponse.access_token,
    expiresIn: tokenResponse.expires_in,
    tokenType: tokenResponse.token_type,
    scope: tokenResponse.scope,
    refreshToken: tokenResponse.refresh_token,
    jwtToken: generatedJwtToken
  };
}

/**
 * Function to handle get request using axios.
 * @param {string} url - The URL to request.
 * @param {object} options - The request options.
 * @returns {Promise} - The axios request promise.
 */
async function handlerGetRequest(url, options) {
  try {
    const response = await axios.get(url, options);
    return response;
  } catch (error) {
    throw new Oauth2Error(error.response.statusText, error.response.status);
  }
}

/**
 * Function to handle pot request using axios.
 * @param {string} url - The URL to request.
 * @param {object} options - The request options.
 * @returns {Promise} - The axios request promise.
 */
async function handlerPostRequest(url, formData, options) {
  try {
    const response = await axios.post(url, formData, options);
    return response;
  } catch (error) {
    throw new Oauth2Error(error.message, error.code);
  }
}

/**
 * Encrypts the provided credentials using AES-256-CBC encryption.
 * @param {Object} crypto - The Node.js 'crypto' module.
 * @param {Object} credentials - The credentials to encrypt.
 * @returns {Object} - An object containing the encrypted credentials, IV, and encryption key.
 */
function encryptCredentials(crypto, credentials) {
  // Generate a random encryption key with 32 bytes (256 bits)
  const encryptionKey = crypto.randomBytes(32);

  // Convert the credentials to JSON
  const credentialsJSON = JSON.stringify(credentials);

  // Generate a random initialization vector (IV)
  const iv = crypto.randomBytes(16);

  // Create a cipher using the encryption key and IV
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);

  // Encrypt the credentials
  let encryptedCredentials = cipher.update(credentialsJSON, 'utf8', 'hex');
  encryptedCredentials += cipher.final('hex');

  // Return the encrypted credentials, IV, and encryption key
  return { encryptedCredentials, iv, encryptionKey };
}

module.exports = {
  getAccessToken,
  handlerGetRequest,
  handlerPostRequest,
  encryptCredentials
};
