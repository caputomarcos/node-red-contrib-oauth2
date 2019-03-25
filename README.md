  node-red-contrib-oauth2
  =================
  An OAuth2 client which sends an oauth2Response object as output.
  
  Inputs
  ------
  Any message to trigger producing an oauth2Response.
  
  #### Container
  The name of the container that will receive the message oauth2Response object.
  
  `p.s. msg.payload.oauth2Response object`
  
  #### Grant Type
  * `Client Credentials`
  
    **inputs:**
      ```
        Access Token URL
        Client ID
        Client Secret
        Scope
      ```
  
  * `Password`
  
    **inputs:**
      ```
        Access Token URL
        Username
        Password
        Client ID
        Client Secret
        Scope
      ```
  
  * `- Set by msg.oauth2 -`
  
    **input:** 
      
      `client_credentials`
      
      ```
        msg.oauth2Request = { 
            "access_token_url": "http://localhost:9999/uaa/oauth/token", 
            "credentials": {
                "grant_type": "client_credentials",
                "client_id": "acmesecret",
                "client_secret": "acme",
                "scope": "openid"
            }
        };
        return msg;
      ```
      
      `authorization_code`
      
      ```
        msg.oauth2Request = { 
            "access_token_url": "http://localhost:9999/uaa/oauth/token", 
            "credentials": {
                "grant_type": "authorization_code",
                "client_id": "acme",
                "client_secret": "acmesecret",
                "code":"LXZ5dn",
                "redirect_uri": "http://localhost:1880/admin",
                "scope": "openid"
            }
        };
        return msg;
      ```
       
      `password`
      
      ```
      msg.oauth2Request = { 
          "access_token_url": "http://localhost:9999/uaa/oauth/token", 
          "credentials": {
              "grant_type": "password",
              "username": "user",
              "password": "password",
              "client_id": "acme",
              "client_secret": "acmesecret",
              "refresh_token": "1f2c7ed8-4f12-4c05-8ac5-67ef85f2461f",
              "scope": "openid"
          }
      };
      return msg;
      ```
       
      `refresh_token`
      
      ```
      msg.oauth2Request = { 
          "access_token_url": "http://localhost:9999/uaa/oauth/token", 
          "credentials": {
              "grant_type": "refresh_token",
              "client_id": "acme",
              "client_secret": "acmesecret",
              "refresh_token": "1f2c7ed8-4f12-4c05-8ac5-67ef85f2461f",
              "scope": "openid"
          }
      };
      return msg;
      ```
      
  Outputs
  -------
  1. Standard output
  
  `msg.payload.oauth2Response object`
        
  ```
  {
    _msgid: '616aca2e.a19a14',
    topic: 'Get Token',
    payload: {
      authorization: 'Bearer 2d261fcfe5ee17f9ab586e14336c27d826d96255',
      oauth2Response: {
        statusCode: 200,
        statusMessage: 'OK',
        body: {
          access_token: '2d261fcfe5ee17f9ab586e14336c27d826d96255',
          token_type: 'Bearer',
          expires_in: 3599,
          refresh_token: 'e95d37bb889ac5838a40bbf144e49acb28c10038',
          scope: '*'
        }
      }
    }
  }
  ```
  
  
  2. Standard output error
  
  `msg.payload.oauth2Response object`
  
  ```
  {
    _msgid: '9f97a5b8.ff13f8',
    topic: 'Get Token',
    payload: {
      oauth2Response: {
        statusCode: 400,
        statusMessage: 'Bad Request',
        body: {
          message: 'Invalid grant: user credentials are invalid',
          error: {
            statusCode: 400,
            status: 400,
            code: 400,
            message: 'Invalid grant: user credentials are invalid',
            name: 'invalid_grant'
          }
        }
      }
    }
  }
  ```
      
  Generic error
  -------------
  Err object describing the cause of a failed operation.
      
  `msg.err object` 
  
  ```
  {
  _msgid: 'd45ffa20.0f28e8',
    topic: 'Get Token',
    payload: 1552255377233,
    err: {
      code: 'ECONNRESET',
      path: null,
      host: 'localhost',
      port: '8000'
    }
  }
  ```
        
  Details
  -------
  This node is intended to be used for communicating with OAuth2 protected APIs. Once you configured it, for each incoming message the node will emit a message containing the msg.payload.oauth2Response value which can be passed to other nodes sending messages to an OAuth protected API.
 
  TODO
  ---- 
 
   * Set by msg.oauth2 
      - ~~Client Credentials~~
      - ~~Authorization Code~~
      - ~~Password~~
      - ~~Refresh Token~~
      - Device Code
      - Implici
      
   * Set by node form 
      - ~~Client Credentials~~
      - Authorization Code
      - ~~Password~~
      - Refresh Token
      - Device Code
      - Implicit

   
    
  References
  -----------
  [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749) - The OAuth 2.0 authorization framework enables a third-party application to obtain limited access to an HTTP service, either on behalf of a resource owner by orchestrating an approval interaction between the resource owner and the HTTP service, or by allowing the third-party application to obtain access on its own behalf. This specification replaces and obsoletes the OAuth 1.0 protocol described in RFC 5849.
