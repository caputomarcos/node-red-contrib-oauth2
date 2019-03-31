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
    "_msgid": "781bff99.670d",
    "topic": "",
    "payload": {
      "authorization": "bearer d9e551a7-e165-4186-bf4c-3ff16135d55b",
      "oauth2Response": {
        "statusCode": 200,
        "statusMessage": "OK",
        "body": {
          "access_token": "d9e551a7-e165-4186-bf4c-3ff16135d55b",
          "token_type": "bearer",
          "refresh_token": "567d3f0b-af7e-421e-a0d9-fae99e010173",
          "expires_in": 43199,
          "scope": "openid"
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
  Sample
  ------ 
  HTTP Request 
  with basic authentication: 
    
  `Username: user`
    
  `Password: password`
    
  ```
  [{"id":"1ef4c2dc.9b749d","type":"tab","label":"oauth2 - authorization code, implicity, password and refresh_token","disabled":false,"info":""},{"id":"4340adbc.1ae824","type":"oauth2","z":"1ef4c2dc.9b749d","name":"","container":"payload","access_token_url":"","grant_type":"set_by_credentials","username":"","password":"","client_id":"","client_secret":"","scope":"","x":446,"y":288,"wires":[["f1534515.099bf8"]]},{"id":"68fc1d57.e6cdf4","type":"inject","z":"1ef4c2dc.9b749d","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":108,"y":288,"wires":[["d6799dfb.b3f8"]]},{"id":"d6799dfb.b3f8","type":"function","z":"1ef4c2dc.9b749d","name":"oauth2Request","func":"msg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:9999/uaa/oauth/token\", \n    \"credentials\": {\n        \"grant_type\": \"password\",\n        \"username\": \"user\",\n        \"password\": \"password\",\n        \"client_id\": \"acme\",\n        \"client_secret\": \"acmesecret\",\n        \"scope\": \"openid\"\n    }\n};\nreturn msg;\n","outputs":1,"noerr":0,"x":284,"y":288,"wires":[["4340adbc.1ae824"]]},{"id":"a0123aeb.198018","type":"function","z":"1ef4c2dc.9b749d","name":"oauth2Request","func":"msg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:9999/uaa/oauth/token\", \n    \"credentials\": {\n        \"grant_type\": \"authorization_code\",\n        \"client_id\": \"acme\",\n        \"client_secret\": \"acmesecret\",\n        \"redirect_uri\": \"http://0.0.0.0:1880/code\",\n        \"code\": `${flow.get(\"code\")}`,\n        \"scope\": \"openid\"\n    }\n};\nreturn msg;\n","outputs":1,"noerr":0,"x":284,"y":216,"wires":[["fbe7ce53.63adb"]]},{"id":"725a5742.438168","type":"inject","z":"1ef4c2dc.9b749d","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":108,"y":216,"wires":[["a0123aeb.198018"]]},{"id":"fbe7ce53.63adb","type":"oauth2","z":"1ef4c2dc.9b749d","name":"","container":"payload","access_token_url":"","grant_type":"set_by_credentials","username":"","password":"","client_id":"","client_secret":"","scope":"","x":446,"y":216,"wires":[["f1534515.099bf8"]]},{"id":"63ffd21c.9e4f8c","type":"oauth2","z":"1ef4c2dc.9b749d","name":"","container":"payload","access_token_url":"","grant_type":"set_by_credentials","username":"","password":"","client_id":"","client_secret":"","scope":"","x":446,"y":360,"wires":[["f1534515.099bf8"]]},{"id":"6cef4b13.52ed24","type":"function","z":"1ef4c2dc.9b749d","name":"oauth2Request","func":"msg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:9999/uaa/oauth/token\", \n    \"credentials\": {\n        \"grant_type\": \"refresh_token\",\n        \"client_id\": \"acme\",\n        \"client_secret\": \"acmesecret\",\n        \"refresh_token\": `${flow.get(\"refresh_token\")}`,\n        \"scope\": \"openid\"\n    }\n};\nreturn msg;\n","outputs":1,"noerr":0,"x":284,"y":360,"wires":[["63ffd21c.9e4f8c"]]},{"id":"8c56d907.003858","type":"debug","z":"1ef4c2dc.9b749d","name":"","active":true,"tosidebar":true,"console":true,"tostatus":false,"complete":"true","targetType":"full","x":914,"y":288,"wires":[]},{"id":"ecd08a18.e60058","type":"inject","z":"1ef4c2dc.9b749d","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":108,"y":360,"wires":[["6cef4b13.52ed24"]]},{"id":"f1534515.099bf8","type":"function","z":"1ef4c2dc.9b749d","name":"Set refresh_token","func":"flow.get('refresh_token', function(err, refresh_token) {\n    if (err) {\n        node.error(err, msg);\n    } else {\n        // initialise the counter to 0 if it doesn't exist already\n        refresh_token = msg.payload.oauth2Response.body.refresh_token;\n        // store the value back\n        flow.set('refresh_token',refresh_token, function(err) {\n            if (err) {\n                node.error(err, msg);\n            } else {\n                // make it part of the outgoing msg object\n                msg.refresh_token = refresh_token;\n                // send the message\n                node.status({fill:\"green\",shape:\"dot\",text:`refresh_token: ${msg.refresh_token}`});\n                node.send(msg);\n            }\n        });\n    }\n});\n","outputs":1,"noerr":0,"x":726,"y":288,"wires":[["8c56d907.003858"]]},{"id":"236886c5.bb163a","type":"inject","z":"1ef4c2dc.9b749d","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":108,"y":72,"wires":[["e9149a89.a09558"]]},{"id":"e9149a89.a09558","type":"http request","z":"1ef4c2dc.9b749d","name":"","method":"GET","ret":"obj","paytoqs":false,"url":"http://localhost:9999/uaa/oauth/authorize?response_type=code&client_id=acme&redirect_uri=http://0.0.0.0:1880/code","tls":"","proxy":"","authType":"basic","x":262,"y":72,"wires":[["6db8c29.1e9dd3c"]]},{"id":"2f08d3cb.ba4c2c","type":"debug","z":"1ef4c2dc.9b749d","name":"","active":true,"tosidebar":true,"console":true,"tostatus":false,"complete":"true","targetType":"full","x":554,"y":72,"wires":[]},{"id":"329b9fe9.dccfb","type":"template","z":"1ef4c2dc.9b749d","name":"page","field":"payload","fieldType":"msg","format":"javascript","syntax":"mustache","template":"{\n    \"code\": \"{{req.query.code}}\" \n}","x":214,"y":144,"wires":[["c8b0ee40.dcf3d"]]},{"id":"da79d78f.fab0f8","type":"http in","z":"1ef4c2dc.9b749d","name":"","url":"/code","method":"get","upload":false,"swaggerDoc":"","x":84,"y":144,"wires":[["329b9fe9.dccfb"]]},{"id":"c8b0ee40.dcf3d","type":"http response","z":"1ef4c2dc.9b749d","name":"","statusCode":"200","headers":{"Content-Type":"application/json","Accept":"application/json"},"x":344,"y":144,"wires":[]},{"id":"6db8c29.1e9dd3c","type":"function","z":"1ef4c2dc.9b749d","name":"Set code","func":"flow.get('code', function(err, code) {\n    if (err) {\n        node.error(err, msg);\n    } else {\n        // initialise the counter to 0 if it doesn't exist already\n        code = msg.payload.code;\n        // store the value back\n        flow.set('code',code, function(err) {\n            if (err) {\n                node.error(err, msg);\n            } else {\n                // make it part of the outgoing msg object\n                msg.code = code;\n                // send the message\n                node.status({fill:\"green\",shape:\"dot\",text:`code: ${msg.code}`});\n                node.send(msg);\n            }\n        });\n    }\n});\n","outputs":1,"noerr":0,"x":420,"y":72,"wires":[["2f08d3cb.ba4c2c"]]},{"id":"bd6c7e5d.1901d","type":"comment","z":"1ef4c2dc.9b749d","name":"grant_type: authorization_code","info":"","x":154,"y":180,"wires":[]},{"id":"38e6eb09.86da34","type":"comment","z":"1ef4c2dc.9b749d","name":"grant_type: password","info":"","x":124,"y":252,"wires":[]},{"id":"5d162176.8518a","type":"comment","z":"1ef4c2dc.9b749d","name":"grant_type: refresh_token","info":"","x":134,"y":324,"wires":[]},{"id":"c9c3212e.caf85","type":"comment","z":"1ef4c2dc.9b749d","name":"http://localhost:9999/uaa/oauth/authorize?response_type=code&client_id=acme&redirect_uri=http://0.0.0.0:1880/code","info":"","x":414,"y":36,"wires":[]},{"id":"ad60fdf9.a7b76","type":"comment","z":"1ef4c2dc.9b749d","name":"GET: http://0.0.0.0:1880/code","info":"","x":140,"y":108,"wires":[]},{"id":"527fa153.c654b","type":"function","z":"1ef4c2dc.9b749d","name":"Set params","func":"var params = {};\nmsg.responseUrl.split(\"#\")[1].split(\"&\").forEach(function(part) {\n    var item = part.split(\"=\");\n    params[item[0]] = item[1];\n});\nparams['url'] = msg.responseUrl.split(\"#\")[0];\nmsg.payload.params = params;\nnode.status({fill:\"green\",shape:\"dot\",text:`access_token: ${msg.payload.params.access_token}`});\nreturn msg;","outputs":1,"noerr":0,"x":454,"y":444,"wires":[["e5786587.2542f8"]]},{"id":"74828a07.e453b4","type":"http request","z":"1ef4c2dc.9b749d","name":"","method":"GET","ret":"obj","paytoqs":false,"url":"http://localhost:9999/uaa/oauth/authorize?response_type=token&client_id=acme&redirect_uri=http://0.0.0.0:1880/imp","tls":"","proxy":"","authType":"basic","x":286,"y":444,"wires":[["527fa153.c654b"]]},{"id":"e5786587.2542f8","type":"debug","z":"1ef4c2dc.9b749d","name":"","active":true,"tosidebar":true,"console":true,"tostatus":false,"complete":"true","targetType":"full","x":602,"y":444,"wires":[]},{"id":"ab9e4c75.1e381","type":"inject","z":"1ef4c2dc.9b749d","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":108,"y":444,"wires":[["74828a07.e453b4"]]},{"id":"62cfba0.d169f48","type":"http response","z":"1ef4c2dc.9b749d","name":"","statusCode":"200","headers":{"Content-Type":"application/json","Accept":"application/json"},"x":240,"y":480,"wires":[]},{"id":"401d3121.6c63","type":"http in","z":"1ef4c2dc.9b749d","name":"","url":"/imp","method":"get","upload":false,"swaggerDoc":"","x":84,"y":480,"wires":[["62cfba0.d169f48"]]},{"id":"2992bf63.c2ffc","type":"comment","z":"1ef4c2dc.9b749d","name":"grant_type: implicit","info":"","x":114,"y":408,"wires":[]},{"id":"96ee3dba.b898a","type":"comment","z":"1ef4c2dc.9b749d","name":"http://localhost:9999/uaa/oauth/authorize?response_type=token&client_id=acme&redirect_uri=http://0.0.0.0:1880/imp","info":"","x":606,"y":408,"wires":[]}]
  ```
  This sample used the [OAuth2 Authorization Server](https://github.com/kziomek/oauth2) implemented with Spring Boot 1.3.2. 
   by [kziomek](https://github.com/kziomek)
         
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
