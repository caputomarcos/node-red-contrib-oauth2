const should = require('should'); // eslint-disable-line no-unused-vars
const helper = require('node-red-node-test-helper');
const nock = require('nock');
const oauth2Node = require('../src/oauth2.js');
const RED = require('node-red');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

helper.init(require.resolve('node-red'));

describe('OAuth2 Node', function () {
   before(function (done) {
      this.timeout(20000); // Increase timeout to 20000ms for more room
      console.log('Starting Node-RED server...');
      helper.startServer(done);
   });

   after(function (done) {
      this.timeout(20000); // Increase timeout to 20000ms for more room
      console.log('Stopping Node-RED server...');
      helper.stopServer(done);
   });

   afterEach(function (done) {
      console.log('Unloading flows...');
      helper.unload().then(function () {
         nock.cleanAll();
         done();
      });
   });

   /**
    * Test if the OAuth2 node loads correctly.
    */
   it('should be loaded', function (done) {
      this.timeout(30000); // Increase timeout for individual test
      console.log('Testing if node loads correctly...');
      const flow = [{ id: 'n1', type: 'oauth2', name: 'oauth2' }];
      helper.load(oauth2Node, flow, function () {
         const n1 = helper.getNode('n1');
         try {
            n1.should.have.property('name', 'oauth2');
            console.log('Node loaded successfully');
            done();
         } catch (err) {
            console.error('Node failed to load', err);
            done(err);
         }
      });
   });

   /**
    * Test if the OAuth2 node handles input and makes POST request.
    */
   it('should handle input and make POST request', async function () {
      this.timeout(30000); // Increase timeout for individual test
      console.log('Testing input handling and POST request...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      await helper.load(oauth2Node, flow, credentials);
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      console.log('Setting up nock for example.com...');
      const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

      return new Promise((resolve, reject) => {
         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
               scope.done(); // Verify if the nock interceptor was called
               resolve();
            } catch (err) {
               console.error('Failed input handling test', err);
               reject(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles errors.
    */
   it('should handle errors', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing error handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [[], ['n3']] },
         { id: 'n3', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n3 = helper.getNode('n3');

         console.log('Setting up nock for invalid-url.com...');
         const scope = nock('https://invalid-url.com').post('/').replyWithError('mocked error');

         n3.on('input', function (msg) {
            console.log('Received input on error helper node');
            try {
               msg.should.have.property('oauth2Error');
               msg.oauth2Error.should.have.property('message', 'mocked error');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed error handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://invalid-url.com',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles invalid client credentials.
    */
   it('should handle invalid client credentials', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing invalid client credentials handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [[], ['n3']] },
         { id: 'n3', type: 'helper' }
      ];
      const credentials = {
         clientId: 'invalidClientId',
         clientSecret: 'invalidClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n3 = helper.getNode('n3');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(401, { error: 'invalid_client' });

         n3.on('input', function (msg) {
            console.log('Received input on error helper node');
            try {
               msg.should.have.property('oauth2Error');
               msg.oauth2Error.should.have.property('status', 401);
               msg.oauth2Error.data.should.have.property('error', 'invalid_client');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed invalid client credentials handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'invalidClientId',
                  client_secret: 'invalidClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles authorization_code grant type.
    */
   it('should handle authorization_code grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing authorization_code grant type handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, {
            access_token: 'mocked_access_token',
            refresh_token: 'mocked_refresh_token'
         });

         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
               msg.oauth2Response.should.have.property('refresh_token', 'mocked_refresh_token');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed authorization_code grant type handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'authorization_code',
                  code: 'testAuthorizationCode',
                  redirect_uri: 'https://example.com/redirect',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles refresh_token grant type.
    */
   it('should handle refresh_token grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing refresh_token grant type handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'new_mocked_access_token' });

         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'new_mocked_access_token');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed refresh_token grant type handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'refresh_token',
                  refresh_token: 'testRefreshToken',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles network failures.
    */
   it('should handle network failure', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing network failure handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [[], ['n3']] },
         { id: 'n3', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n3 = helper.getNode('n3');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').replyWithError('Network error');

         n3.on('input', function (msg) {
            console.log('Received input on error helper node');
            try {
               msg.should.have.property('oauth2Error');
               msg.oauth2Error.should.have.property('message', 'Network error');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed network failure handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles custom headers in the response.
    */
   it('should handle custom headers in response', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing custom headers handling...');
      const flow = [
         {
            id: 'n1',
            type: 'oauth2',
            name: 'test name',
            wires: [['n2']],
            access_token_url: 'https://example.com/oauth2/token',
            headers: { 'X-Custom-Header': 'CustomValue' }
         },
         { id: 'n2', type: 'helper' }
      ];

      helper.load(oauth2Node, flow, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' }, { 'x-custom-header': 'CustomValue' });

         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('headers');
               msg.headers.should.have.property('x-custom-header', 'CustomValue');
               scope.done();
               done();
            } catch (err) {
               console.error('Failed custom headers handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles multiple scopes.
    */
   it('should handle multiple scopes', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing multiple scopes handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed multiple scopes handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'scope1 scope2'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles proxy settings.
    */
   it('should handle proxy settings', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing proxy settings handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']], access_token_url: 'https://example.com/oauth2/token' },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };
      const proxySettings = {
         prox: 'http://proxy.example.com:8080'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         n1.prox = proxySettings.prox;

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

         n2.on('input', function (msg) {
            msg.should.have.property('oauth2Response');
            msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
            scope.done();
            done();
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node generates options for authorization_code grant type.
    */
   it('should generate options for authorization_code grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [{ id: 'n1', type: 'oauth2', name: 'oauth2' }];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'authorization_code',
                  code: 'testAuthorizationCode',
                  redirect_uri: 'https://example.com/redirect',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret'
               }
            }
         });

         // Assert conditions based on the generated options
         done();
      });
   });

   /**
    * Test if the OAuth2 node generates options for implicit_flow grant type.
    */
   it('should generate options for implicit_flow grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [{ id: 'n1', type: 'oauth2', name: 'oauth2' }];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'implicit_flow',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });

         // Assert conditions based on the generated options
         done();
      });
   });

   /**
    * Test if the OAuth2 node generates options for password grant type.
    */
   it('should generate options for password grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [{ id: 'n1', type: 'oauth2', name: 'oauth2' }];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'password',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  username: 'testUsername',
                  password: 'testPassword',
                  scope: 'testScope'
               }
            }
         });

         // Assert conditions based on the generated options
         done();
      });
   });

   /**
    * Test if the OAuth2 node makes a POST request with proxy settings.
    */
   it('should make a POST request with proxy settings', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [{ id: 'n1', type: 'oauth2', name: 'oauth2' }];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };
      const proxySettings = {
         prox: 'http://proxy.example.com:8080'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         n1.prox = proxySettings.prox;

         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });

         // Assert conditions based on the proxy settings
         done();
      });
   });

   /**
    * Test if the OAuth2 node handles server errors correctly.
    */
   it('should handle server errors correctly', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [[], ['n3']] },
         { id: 'n3', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n3 = helper.getNode('n3');

         nock('https://example.com').post('/oauth2/token').reply(500, { error: 'server_error' });

         n3.on('input', function (msg) {
            msg.should.have.property('oauth2Error');
            msg.oauth2Error.should.have.property('status', 500);
            msg.oauth2Error.data.should.have.property('error', 'server_error');
            done();
         });

         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles client_credentials grant type.
    */
   it('should handle client_credentials grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

         n2.on('input', function (msg) {
            msg.should.have.property('oauth2Response');
            msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
            done();
         });

         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles HTTP 401 error correctly.
    */
   it('should handle HTTP 401 error correctly', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [[], ['n3']] },
         { id: 'n3', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n3 = helper.getNode('n3');

         nock('https://example.com').post('/oauth2/token').reply(401, { error: 'unauthorized' });

         n3.on('input', function (msg) {
            msg.should.have.property('oauth2Error');
            msg.oauth2Error.should.have.property('status', 401);
            msg.oauth2Error.data.should.have.property('error', 'unauthorized');
            done();
         });

         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles client_credentials_in_body.
    */
   it('should handle client_credentials_in_body', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing client_credentials_in_body handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', client_credentials_in_body: true, wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed client_credentials_in_body handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles password grant type.
    */
   it('should handle password grant type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing password grant type handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret',
         username: 'testUser',
         password: 'testPassword'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         console.log('Setting up nock for example.com...');
         const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
               scope.done(); // Verify if the nock interceptor was called
               done();
            } catch (err) {
               console.error('Failed password grant type handling test', err);
               done(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'password',
                  username: 'testUser',
                  password: 'testPassword',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles default grant_type.
    */
   it('should handle default grant_type', async function () {
      this.timeout(10000); // Set timeout for individual test
      console.log('Starting test case...');

      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', grant_type: 'client_credentials', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'defaultClientId',
         clientSecret: 'defaultClientSecret'
      };

      await helper.load(oauth2Node, flow, credentials);
      console.log('Flow loaded...');

      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'default_access_token' });

      return new Promise((resolve, reject) => {
         n2.on('input', function (msg) {
            console.log('Received input message...');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'default_access_token');
               // Signal the completion of the test
               console.log('Test case completed successfully.');
               resolve();
            } catch (err) {
               console.error('Error during test execution:', err);
               reject(err);
            }
         });

         console.log('Sending message to n1...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'client_credentials',
                  client_id: 'defaultClientId',
                  client_secret: 'defaultClientSecret'
               }
            }
         });
      });
   });

   it('should handle password grant_type', async function () {
      this.timeout(1000); // Set timeout for individual test
      console.log('Testing password grant type handling...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret',
         username: 'testUser',
         password: 'testPassword'
      };

      await helper.load(oauth2Node, flow, credentials);
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      console.log('Setting up nock for example.com...');
      const scope = nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'mocked_access_token' });

      return new Promise((resolve, reject) => {
         n2.on('input', function (msg) {
            console.log('Received input on helper node');
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
               scope.done(); // Verify if the nock interceptor was called
               resolve();
            } catch (err) {
               console.error('Failed password grant type handling test', err);
               reject(err);
            }
         });

         console.log('Sending input to node...');
         n1.receive({
            oauth2Request: {
               access_token_url: 'https://example.com/oauth2/token',
               credentials: {
                  grant_type: 'password',
                  username: 'testUser',
                  password: 'testPassword',
                  client_id: 'testClientId',
                  client_secret: 'testClientSecret',
                  scope: 'testScope'
               }
            }
         });
      });
   });

   /**
    * Test if the OAuth2 node handles authorization_code grant_type.
    */
   it('should handle authorization_code grant_type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         {
            id: 'n1',
            type: 'oauth2',
            name: 'oauth2',
            grant_type: 'authorization_code',
            client_id: 'defaultClientId',
            client_secret: 'defaultClientSecret',
            redirect_uri: 'https://example.com/redirect',
            access_token_url: 'https://example.com/oauth2/token',
            wires: [['n2']]
         },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = { code: 'testAuthorizationCode' };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'authorization_code_access_token' });

         n2.on('input', function (msg) {
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'authorization_code_access_token');
               done();
            } catch (err) {
               done(err);
            }
         });

         n1.receive({ payload: {} });
      });
   });

   /**
    * Test if the OAuth2 node handles implicit_flow grant_type.
    */
   it('should handle implicit_flow grant_type', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         {
            id: 'n1',
            type: 'oauth2',
            name: 'oauth2',
            grant_type: 'implicit_flow',
            client_id: 'defaultClientId',
            client_secret: 'defaultClientSecret',
            redirect_uri: 'https://example.com/redirect',
            access_token_url: 'https://example.com/oauth2/token',
            wires: [['n2']]
         },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = { code: 'testImplicitFlowCode' };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'implicit_flow_access_token' });

         n2.on('input', function (msg) {
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'implicit_flow_access_token');
               done();
            } catch (err) {
               done(err);
            }
         });

         n1.receive({ payload: {} });
      });
   });

   /**
    * Test if the OAuth2 node handles client_credentials_in_body when no oauth2Request.
    */
   it('should handle client_credentials_in_body when no oauth2Request', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         {
            id: 'n1',
            type: 'oauth2',
            name: 'oauth2',
            client_credentials_in_body: true,
            grant_type: 'client_credentials',
            client_id: 'defaultClientId',
            client_secret: 'defaultClientSecret',
            access_token_url: 'https://example.com/oauth2/token',
            wires: [['n2']]
         },
         { id: 'n2', type: 'helper' }
      ];

      helper.load(oauth2Node, flow, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'client_credentials_body_access_token' });

         n2.on('input', function (msg) {
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'client_credentials_body_access_token');
               done();
            } catch (err) {
               done(err);
            }
         });

         n1.receive({ payload: {} });
      });
   });

   /**
    * Test if the OAuth2 node handles client credentials in headers when no oauth2Request.
    */
   it('should handle client credentials in headers when no oauth2Request', function (done) {
      this.timeout(10000); // Set timeout for individual test
      const flow = [
         {
            id: 'n1',
            type: 'oauth2',
            name: 'oauth2',
            client_credentials_in_body: false,
            grant_type: 'client_credentials',
            client_id: 'defaultClientId',
            client_secret: 'defaultClientSecret',
            access_token_url: 'https://example.com/oauth2/token',
            wires: [['n2']]
         },
         { id: 'n2', type: 'helper' }
      ];

      helper.load(oauth2Node, flow, function () {
         const n1 = helper.getNode('n1');
         const n2 = helper.getNode('n2');

         nock('https://example.com').post('/oauth2/token').reply(200, { access_token: 'client_credentials_header_access_token' });

         n2.on('input', function (msg) {
            try {
               msg.should.have.property('oauth2Response');
               msg.oauth2Response.should.have.property('access_token', 'client_credentials_header_access_token');
               done();
            } catch (err) {
               done(err);
            }
         });

         n1.receive({ payload: {} });
      });
   });
   it('should handle password grant type in generateOptions', function (done) {
      console.log('Testing password grant type handling in generateOptions...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', grant_type: 'password', username: 'testUser', password: 'testPassword', wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         grant_type: 'password',
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(oauth2Node, flow, credentials, function () {
         const n1 = helper.getNode('n1');
         const options = n1.generateOptions({ oauth2Request: { credentials } });

         try {
            options.form.should.have.property('username', 'testUser');
            options.form.should.have.property('password', 'testPassword');
            done();
         } catch (err) {
            done(err);
         }
      });
   });
});
