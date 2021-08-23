
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=FLB35ANBK99ZA)
 
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
  
  * `- Set by msg.oauth2Request -`
  
    **input:** 
      
      `client_credentials`
      
      ```
      msg.oauth2Request = { 
      "access_token_url": "http://localhost:3000/oauth/token",
      "credentials": {
          "grant_type": "client_credentials",
          "client_id": "confidentialApplication",
          "client_secret": "topSecret",
          "scope": "*"
          },
      };
      return msg;
      ```
       
      `password`
      
      ```
      msg.oauth2Request = { 
      "access_token_url": "http://localhost:3000/oauth/token",
      "credentials": {
          "grant_type": "password",
          "client_id": "application",
          "client_secret": "secret",
          "scope": "*",
          "username": "pedroetb",
          "password": "password"   
        },
      };
      return msg;
      ```
       
      `refresh_token`
      
      ```
      var refreshToken = flow.get('refreshToken');

      msg.oauth2Request = { 
          "access_token_url": "http://localhost:3000/oauth/token",
          "credentials": {
              "grant_type": "refresh_token",
              "client_id": "application",
              "client_secret": "secret",
              "scope": "*",
              "refresh_token": refreshToken   
          },
      };
      return msg;
      ```
      
  Outputs
  -------
  1. Standard output
  
  `msg.oauth2Response object`
        
  ```
  {
      "_msgid": "2670c12c7893c3f9",
      "payload": 1629740729931,
      "topic": "Client Credentials set by msg.oauth2Request",
      "oauth2Response": {
          "accessToken": "b7a0d0c04d44e093b2dac7d6def877da2e19aa76",
          "accessTokenExpiresAt": "2021-08-23T18:45:29.943Z",
          "scope": "*",
          "client": {
              "id": "confidentialApplication"
          },
          "user": {}
      }
  }
  ```
  
  
  2. Standard output error
  
  `msg.oauth2Response object`
  
  ```
  {
      "_msgid": "e85afdfa97d3d79d",
      "payload": 1629734971400,
      "topic": "Refresh Token HTTP 400 by msg.oauth2Request",
      "oauth2Response": {
          "statusCode": 400,
          "status": 400,
          "code": 400,
          "message": "Invalid grant: refresh token is invalid",
          "name": "invalid_grant"
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
  Sample
  ------ 

  ```
[{"id":"be9f8d3e5126b0aa","type":"inject","z":"fbfbc50a1ded59ed","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":240,"wires":[["457c466345b3c830"]]},{"id":"457c466345b3c830","type":"oauth2","z":"fbfbc50a1ded59ed","name":"Password","container":"oauth2Response","access_token_url":"http://localhost:3000/oauth/token ","grant_type":"password","username":"pedroetb","password":"password","client_id":"application","client_secret":"secret","scope":"*","headers":{},"x":380,"y":240,"wires":[["1f9670457ea0fdeb"]]},{"id":"fa297a2263ccab64","type":"debug","z":"fbfbc50a1ded59ed","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":870,"y":60,"wires":[]},{"id":"b09fcda36b29337e","type":"oauth2","z":"fbfbc50a1ded59ed","name":"Client Credentials","container":"oauth2Response","access_token_url":"http://localhost:3000/oauth/token ","grant_type":"client_credentials","username":"pedroet","password":"","client_id":"confidentialApplication","client_secret":"topSecret","scope":"*","headers":{},"x":350,"y":60,"wires":[["fa297a2263ccab64"]]},{"id":"68ce0e033979d11d","type":"inject","z":"fbfbc50a1ded59ed","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":60,"wires":[["b09fcda36b29337e"]]},{"id":"6adbb00a164f0d30","type":"inject","z":"fbfbc50a1ded59ed","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":360,"wires":[["5eedef6eb8215636"]]},{"id":"5eedef6eb8215636","type":"function","z":"fbfbc50a1ded59ed","name":"Refresh Token","func":"let refreshToken = global.get('refreshToken');\n\nmsg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:3000/oauth/token\",\n    \"credentials\": {\n        \"grant_type\": \"refresh_token\",\n        \"client_id\": \"application\",\n        \"client_secret\": \"secret\",\n        \"scope\": \"*\",\n        \"refresh_token\": refreshToken   \n    },\n};\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":360,"y":360,"wires":[["bbb398a4c6b6581d"]]},{"id":"bbb398a4c6b6581d","type":"oauth2","z":"fbfbc50a1ded59ed","name":"Set by msg.oauth2Request","container":"oauth2Response","access_token_url":"http://localhost:3000/oauth/token ","grant_type":"set_by_credentials","username":"pedroet","password":"","client_id":"confidentialApplication","client_secret":"topSecret","scope":"*","headers":{},"x":640,"y":300,"wires":[["1f9670457ea0fdeb"]]},{"id":"5f5889fc9873830c","type":"function","z":"fbfbc50a1ded59ed","name":"Password","func":"msg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:3000/oauth/token\",\n    \"credentials\": {\n        \"grant_type\": \"password\",\n        \"client_id\": \"application\",\n        \"client_secret\": \"secret\",\n        \"scope\": \"*\",\n        \"username\": \"pedroetb\",\n        \"password\": \"password\"   \n    },\n};\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":380,"y":300,"wires":[["bbb398a4c6b6581d"]]},{"id":"aa78cee9cf6b05a4","type":"debug","z":"fbfbc50a1ded59ed","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1100,"y":240,"wires":[]},{"id":"e92113c4c92e02b9","type":"inject","z":"fbfbc50a1ded59ed","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":300,"wires":[["5f5889fc9873830c"]]},{"id":"1f9670457ea0fdeb","type":"function","z":"fbfbc50a1ded59ed","name":"Set refreshToken","func":"if (msg.oauth2Response.refreshToken) {\n    global.set('refreshToken',msg.oauth2Response.refreshToken);\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":900,"y":240,"wires":[["aa78cee9cf6b05a4"]]},{"id":"00bcb23670663c56","type":"function","z":"fbfbc50a1ded59ed","name":"Client Credentials","func":"msg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:3000/oauth/token\",\n    \"credentials\": {\n        \"grant_type\": \"client_credentials\",\n        \"client_id\": \"confidentialApplication\",\n        \"client_secret\": \"topSecret\",\n        \"scope\": \"*\"\n    },\n};\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":350,"y":120,"wires":[["ac78cb33d964efde"]]},{"id":"ac78cb33d964efde","type":"oauth2","z":"fbfbc50a1ded59ed","name":"Set by msg.oauth2Request","container":"oauth2Response","access_token_url":"http://localhost:3000/oauth/token ","grant_type":"set_by_credentials","username":"pedroet","password":"","client_id":"confidentialApplication","client_secret":"topSecret","scope":"*","headers":{},"x":620,"y":120,"wires":[["fa297a2263ccab64"]]},{"id":"da4c05becf924c6a","type":"inject","z":"fbfbc50a1ded59ed","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":120,"wires":[["00bcb23670663c56"]]}]
  ```
  This sample used the [node-oauth2-server-example](https://github.com/pedroetb/node-oauth2-server-example) implemented with Spring Boot 1.3.2. 
   by [pedroetb](https://github.com/pedroetb)
         
  Details
  -------
  This node is intended to be used for communicating with OAuth2 protected APIs. Once you configured it, for each incoming message the node will emit a message containing the msg.oauth2Response value which can be passed to other nodes sending messages to an OAuth protected API.
 
  TODO
  ---- 
 
   * Set by msg.oauth2 
      - ~~Client Credentials~~
      - ~~Authorization Code~~
      - ~~Password~~
      - ~~Refresh Token~~
      - Device Code
      - Implicit
      
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
