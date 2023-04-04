
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=FLB35ANBK99ZA)
 

<img src="icons/oauth2.svg" width="128" height="128">

  node-red-contrib-oauth2
  =================
  The `node-red-contrib-oauth2` is a Node-RED node that provides an OAuth2 authentication flow. This node uses the OAuth2 protocol to obtain an access token, which can be used to make authenticated API requests.

```mermaid
sequenceDiagram
  participant User
  participant OAuth2Node
  participant OAuth2Server

  User->>OAuth2Node: Sends input request
  OAuth2Node->>OAuth2Node: Generate request options
  alt Credentials set by input request
    OAuth2Node->>OAuth2Server: POST request with input credentials
  else Credentials set by configuration
    OAuth2Node->>OAuth2Server: POST request with configured credentials
  end
  OAuth2Server-->>OAuth2Node: Returns token
  OAuth2Node->>OAuth2Node: Add token to output
  OAuth2Node->>User: Sends output response
```

  Usage
  -----
  
  The node requires an access token URL and a set of client credentials to authenticate with that URL. The node will generate an HTTP request to the access token URL to retrieve the access token using the client credentials.
  The access token can be stored in a message property that can be used by subsequent nodes in a flow.
  
  The node provides two modes of operation:
  
   1. Static credentials: The client credentials can be set in the node configuration page.
   2. Dynamic credentials: The client credentials can be sent as part of the message payload to the node.

  Install
  -------
  You can install this node directly from the Node-RED editor by going to the Manage Palette menu and searching for "node-red-contrib-oauth2". Alternatively, you can install it using npm:  
  
  ```bash
  $ cd ~/.node-red
  $ npm install node-red-contrib-oauth2
  ```

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

![image](https://user-images.githubusercontent.com/3945941/229128108-2e104b94-cd88-4e8e-be60-a746cefbf867.png)

  ```
[{"id":"d15d33a4fa9a8ad9","type":"tab","label":"node-red-contrib-oauth2","disabled":false,"info":"","env":[]},{"id":"7e1a2f9059f99060","type":"group","z":"d15d33a4fa9a8ad9","g":"368ef084fe6b53de","name":"REFRESH","style":{"label":true,"stroke":"#7f7f7f","color":"#000000","fill":"#bfdbef"},"nodes":["d1ba341040cea0c3","aa24d69faa1640cd","efd1a2a910ca1051","a8fca004e704e071","9e9332c792dbdc01","7f22873286146e83"],"x":76,"y":499,"w":1210,"h":208},{"id":"7f22873286146e83","type":"group","z":"d15d33a4fa9a8ad9","g":"7e1a2f9059f99060","name":"via HTTP REQUEST","style":{"label":true},"nodes":["64d9243f.b7be7c","31727a2c.05a026","4030c52c.c2c29c","3b67977c.a53c08"],"x":102,"y":599,"w":1158,"h":82},{"id":"54025cb0a19e0f14","type":"group","z":"d15d33a4fa9a8ad9","g":"368ef084fe6b53de","name":"Client Credentials","style":{"label":true,"stroke":"#a4a4a4","color":"#ffffff","fill":"#3f93cf"},"nodes":["10de26226e66ea9e","147aae5c70a7eecb","1e2169485cd2be43","ca6a8cddea946ab2","c6d4eb5c867902eb","d7a2041ef2683870","3f5a09c4fc8e769f"],"x":74,"y":179,"w":1212,"h":142},{"id":"f37b3410d0e03c57","type":"group","z":"d15d33a4fa9a8ad9","g":"368ef084fe6b53de","name":"Authorization Code","style":{"label":true,"fill":"#3f93cf","color":"#ffffff"},"nodes":["8bd177259bc473f4","ee86852f62926632","d340377991d2d9b9","9e4d3edfde1766b9"],"x":74,"y":59,"w":1212,"h":82},{"id":"a783ce686ac81a0c","type":"group","z":"d15d33a4fa9a8ad9","g":"368ef084fe6b53de","name":"Password","style":{"label":true,"fill":"#3f93cf","color":"#ffffff"},"nodes":["5ff7fb2616706080","8eadc61e4e5b4ac2","d857d0bc3e90d394","95745c4253c151f0","dcbde702eae7191d","d6a9695a923ab18b","c5da03044bdca6f1"],"x":74,"y":339,"w":1212,"h":142},{"id":"368ef084fe6b53de","type":"group","z":"d15d33a4fa9a8ad9","name":"Grant Type","style":{"label":true,"fill":"#bfc7d7","color":"#0070c0"},"nodes":["7e1a2f9059f99060","54025cb0a19e0f14","f37b3410d0e03c57","a783ce686ac81a0c"],"x":48,"y":33,"w":1264,"h":700},{"id":"ee86852f62926632","type":"oauth2","z":"d15d33a4fa9a8ad9","g":"f37b3410d0e03c57","name":"Authorization Code","container":"oauth2Response","grant_type":"authorization_code","access_token_url":"http://localhost:8080/v1/oauth/tokens","authorization_endpoint":"http://localhost:8080/web/authorize","redirect_uri":"/oauth2/redirect_uri","open_authentication":"c9cf92ea-6f1d-44b6-86ed-6de1279f45d8","username":"","password":"","client_id":"test_client_1","client_secret":"test_secret","scope":"read_write","client_credentials_in_body":false,"rejectUnauthorized":true,"headers":{},"x":450,"y":100,"wires":[["8bd177259bc473f4"]]},{"id":"9e4d3edfde1766b9","type":"inject","z":"d15d33a4fa9a8ad9","g":"f37b3410d0e03c57","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":100,"wires":[["ee86852f62926632"]]},{"id":"d7a2041ef2683870","type":"debug","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"DBG 2","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1190,"y":220,"wires":[]},{"id":"c6d4eb5c867902eb","type":"oauth2","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"Client Credentials","container":"oauth2Response","grant_type":"client_credentials","access_token_url":"http://localhost:8080/v1/oauth/tokens","authorization_endpoint":"http://localhost:8080/web/authorize","redirect_uri":"/oauth2/redirect_uri","open_authentication":"41595d3b-a2b5-41aa-84e7-02d2c7b54304","username":"","password":"","client_id":"test_client_1","client_secret":"test_secret","scope":"read_write","client_credentials_in_body":false,"rejectUnauthorized":true,"headers":{},"x":450,"y":220,"wires":[["1e2169485cd2be43"]]},{"id":"3f5a09c4fc8e769f","type":"inject","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":220,"wires":[["c6d4eb5c867902eb"]]},{"id":"d1ba341040cea0c3","type":"inject","z":"d15d33a4fa9a8ad9","g":"7e1a2f9059f99060","name":"Refresh Token","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"3300","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":208,"y":540,"wires":[["aa24d69faa1640cd"]]},{"id":"aa24d69faa1640cd","type":"function","z":"d15d33a4fa9a8ad9","g":"7e1a2f9059f99060","name":"set msg.oauth2Request","func":"let refreshToken = global.get('refreshToken');\n\nmsg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:8080/v1/oauth/tokens\",\n    \"credentials\": {\n        \"grant_type\": \"refresh_token\",\n        \"client_id\": \"test_client_1\",\n        \"client_secret\": \"test_secret\",\n        \"scope\": \"read_write\",\n        \"refresh_token\": refreshToken   \n    },\n};\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":438,"y":540,"wires":[["efd1a2a910ca1051"]]},{"id":"efd1a2a910ca1051","type":"oauth2","z":"d15d33a4fa9a8ad9","g":"7e1a2f9059f99060","name":"Set by msg.oauth2Request","container":"oauth2Response","grant_type":"set_by_credentials","access_token_url":"http://localhost:3000/oauth/token ","username":"pedroet","password":"","client_id":"confidentialApplication","client_secret":"topSecret","scope":"*","headers":{},"x":708,"y":540,"wires":[["a8fca004e704e071"]]},{"id":"a8fca004e704e071","type":"function","z":"d15d33a4fa9a8ad9","g":"7e1a2f9059f99060","name":"Set refreshToken","func":"if (msg.oauth2Response.refresh_token) {\n    global.set('refreshToken', msg.oauth2Response.refresh_token);\n}\nif (msg.oauth2Response.access_token) {\n    global.set('accessToken', msg.oauth2Response.access_token);\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":978,"y":540,"wires":[["9e9332c792dbdc01"]]},{"id":"9e9332c792dbdc01","type":"debug","z":"d15d33a4fa9a8ad9","g":"7e1a2f9059f99060","name":"DBG 2","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1187,"y":540,"wires":[]},{"id":"4030c52c.c2c29c","type":"inject","z":"d15d33a4fa9a8ad9","g":"7f22873286146e83","name":"Refresh Token","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":218,"y":640,"wires":[["31727a2c.05a026"]]},{"id":"31727a2c.05a026","type":"function","z":"d15d33a4fa9a8ad9","g":"7f22873286146e83","name":"SETTING REQUEST","func":"var REFRESH_TOKEN = global.get('refreshToken');\nvar ACCESS_TOKEN = global.get('accessToken');\n\nmsg.method = \"POST\"\nmsg.url = `http://localhost:8080/v1/oauth/tokens?grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`\n\nmsg.headers = {}\nmsg.headers[\"content-type\"] = \"application/json\"\nmsg.headers[\"Authorization\"] = 'Basic ' + Buffer.from('test_client_1:test_secret').toString('base64');\n\nreturn msg","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":468,"y":640,"wires":[["64d9243f.b7be7c"]]},{"id":"64d9243f.b7be7c","type":"http request","z":"d15d33a4fa9a8ad9","g":"7f22873286146e83","name":"","method":"use","ret":"obj","paytoqs":"ignore","url":"","tls":"","persist":false,"proxy":"","insecureHTTPParser":false,"authType":"","senderr":false,"headers":[],"x":798,"y":640,"wires":[["3b67977c.a53c08"]]},{"id":"3b67977c.a53c08","type":"debug","z":"d15d33a4fa9a8ad9","g":"7f22873286146e83","name":"DBG 3","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1164,"y":640,"wires":[]},{"id":"1e2169485cd2be43","type":"function","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"Set refreshToken","func":"if (msg.oauth2Response.refresh_token) {\n    global.set('refreshToken', msg.oauth2Response.refresh_token);\n}\nif (msg.oauth2Response.access_token) {\n    global.set('accessToken', msg.oauth2Response.access_token);\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":990,"y":220,"wires":[["d7a2041ef2683870"]]},{"id":"147aae5c70a7eecb","type":"function","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"set msg.oauth2Request","func":"msg.oauth2Request = { \n    \"access_token_url\": \"http://localhost:8080/v1/oauth/tokens\",\n    \"credentials\": {\n        \"grant_type\": \"client_credentials\",\n        \"client_id\": \"test_client_1\",\n        \"client_secret\": \"test_secret\",\n        \"scope\": \"read_write\"\n    },\n};\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":430,"y":280,"wires":[["10de26226e66ea9e"]]},{"id":"10de26226e66ea9e","type":"oauth2","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"Set by msg.oauth2Request","container":"oauth2Response","grant_type":"set_by_credentials","access_token_url":"http://localhost:3000/oauth/token ","authorization_endpoint":"","open_authentication":"","username":"pedroet","password":"","client_id":"confidentialApplication","client_secret":"topSecret","scope":"*","client_credentials_in_body":false,"rejectUnauthorized":true,"headers":{},"x":720,"y":280,"wires":[["1e2169485cd2be43"]]},{"id":"ca6a8cddea946ab2","type":"inject","z":"d15d33a4fa9a8ad9","g":"54025cb0a19e0f14","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":280,"wires":[["147aae5c70a7eecb"]]},{"id":"8bd177259bc473f4","type":"function","z":"d15d33a4fa9a8ad9","g":"f37b3410d0e03c57","name":"Set refreshToken","func":"if (msg.oauth2Response.refresh_token) {\n    global.set('refreshToken', msg.oauth2Response.refresh_token);\n}\nif (msg.oauth2Response.access_token) {\n    global.set('accessToken', msg.oauth2Response.access_token);\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":990,"y":100,"wires":[["d340377991d2d9b9"]]},{"id":"d340377991d2d9b9","type":"debug","z":"d15d33a4fa9a8ad9","g":"f37b3410d0e03c57","name":"DBG 1","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1190,"y":100,"wires":[]},{"id":"5ff7fb2616706080","type":"oauth2","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"Set by msg.oauth2Request","container":"oauth2Response","grant_type":"set_by_credentials","access_token_url":"http://localhost:3000/oauth/token ","authorization_endpoint":"","open_authentication":"","username":"pedroet","password":"","client_id":"confidentialApplication","client_secret":"topSecret","scope":"*","client_credentials_in_body":false,"rejectUnauthorized":true,"headers":{},"x":720,"y":440,"wires":[["d857d0bc3e90d394"]]},{"id":"8eadc61e4e5b4ac2","type":"function","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"set msg.oauth2Request","func":"msg.oauth2Request = {\n    \"access_token_url\": \"http://localhost:8080/v1/oauth/tokens\",\n    \"credentials\": {\n        \"grant_type\": \"password\",\n        \"client_id\": \"test_client_1\",\n        \"client_secret\": \"test_secret\",\n        \"scope\": \"read_write\",\n        \"username\": \"test@user\",\n        \"password\": \"test_password\"\n    },\n};\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":430,"y":440,"wires":[["5ff7fb2616706080"]]},{"id":"d857d0bc3e90d394","type":"function","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"Set refreshToken","func":"if (msg.oauth2Response.refresh_token) {\n    global.set('refreshToken', msg.oauth2Response.refresh_token);\n}\nif (msg.oauth2Response.access_token) {\n    global.set('accessToken', msg.oauth2Response.access_token);\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":990,"y":380,"wires":[["dcbde702eae7191d"]]},{"id":"95745c4253c151f0","type":"inject","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":440,"wires":[["8eadc61e4e5b4ac2"]]},{"id":"dcbde702eae7191d","type":"debug","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"DBG 3","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1190,"y":380,"wires":[]},{"id":"d6a9695a923ab18b","type":"inject","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":380,"wires":[["c5da03044bdca6f1"]]},{"id":"c5da03044bdca6f1","type":"oauth2","z":"d15d33a4fa9a8ad9","g":"a783ce686ac81a0c","name":"Password","container":"oauth2Response","grant_type":"password","access_token_url":"http://localhost:8080/v1/oauth/tokens","authorization_endpoint":"http://localhost:8080/web/authorize","redirect_uri":"/oauth2/redirect_uri","open_authentication":"41595d3b-a2b5-41aa-84e7-02d2c7b54304","username":"caputo.marcos@gmail.com","password":"123123","client_id":"test_client_1","client_secret":"test_secret","scope":"read_write","client_credentials_in_body":false,"rejectUnauthorized":true,"headers":{},"x":480,"y":380,"wires":[["d857d0bc3e90d394"]]}]
```

  This sample used the [go-oauth2-server](https://github.com/RichardKnop/go-oauth2-server) implemented with GO (Golang). 
   by [RichardKnop](https://github.com/RichardKnop)
         
  Details
  -------
  The `node-red-contrib-oauth2` is designed to simplify the communication process with APIs that require `OAuth2 authentication`. Upon configuration, incoming messages will trigger a response that includes the msg.oauth2Response value. This response can then be passed on to other nodes to enable communication with `OAuth2-protected APIs`.
     
  References
  -----------
  [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749) - The OAuth 2.0 authorization framework enables a third-party application to obtain limited access to an HTTP service, either on behalf of a resource owner by orchestrating an approval interaction between the resource owner and the HTTP service, or by allowing the third-party application to obtain access on its own behalf. This specification replaces and obsoletes the OAuth 1.0 protocol described in RFC 5849.


## Contributors
<table>
  <tr>
    <td>
      <a href="https://github.com/caputomarcos/node-red-contrib-oauth2/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=caputomarcos/node-red-contrib-oauth2" />
      </a>
     </td>
  </tr>
</table>
