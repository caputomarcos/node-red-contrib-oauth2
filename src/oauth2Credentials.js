module.exports = function (RED) {
   class OAuth2Credentials {
      constructor(n) {
         RED.nodes.createNode(this, n);
         this.name = n.name;
         this.grant_type = n.grant_type || '';
         this.credentials_config = n.credentials_config || '';
         this.access_token_url = n.access_token_url || '';
         this.authorization_endpoint = n.authorization_endpoint || '';
         this.redirect_uri = n.redirect_uri || '';
         this.open_authentication = n.open_authentication || '';
         this.username = n.username || '';
         this.password = n.password || '';
         this.client_id = n.client_id || '';
         this.client_secret = n.client_secret || '';
         this.refresh_token = n.refresh_token || '';
         this.access_type = n.access_type || '';
         this.response_type = n.response_type || '';
         this.prompt = n.prompt || '';
         this.scope = n.scope || '';
         this.resource = n.resource || '';
         this.state = n.state || '';
      }
   }

   RED.nodes.registerType('oauth2Credentials', OAuth2Credentials, {
      credentials: {
         grant_type: { type: 'text' },
         credentials_config: { type: 'text' },
         access_token_url: { type: 'text' },
         authorization_endpoint: { type: 'text' },
         redirect_uri: { type: 'text' },
         open_authentication: { type: 'text' },
         username: { type: 'text' },
         password: { type: 'password' },
         client_id: { type: 'text' },
         client_secret: { type: 'password' },
         refresh_token: { type: 'password' },
         access_type: { type: 'text' },
         response_type: { type: 'text' },
         prompt: { type: 'text' },
         scope: { type: 'text' },
         resource: { type: 'text' },
         state: { type: 'text' }
      }
   });
};
