const should = require('should'); // eslint-disable-line no-unused-vars
const helper = require('node-red-node-test-helper');
const nock = require('nock');
const OAuth2Node = require('node-red-contrib-oauth2/src/oauth2.js'); // Adjust the path as needed

helper.init(require.resolve('node-red'));

describe('OAuth2 Node Grant Types', function () {
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

      helper.load(OAuth2Node, flow, credentials, function () {
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

      helper.load(OAuth2Node, flow, credentials, function () {
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

      helper.load(OAuth2Node, flow, credentials, function () {
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

      await helper.load(OAuth2Node, flow, credentials);
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

      helper.load(OAuth2Node, flow, credentials, function () {
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
   it('should cover client credentials in body', function (done) {
      this.timeout(10000); // Set timeout for individual test
      console.log('Testing client credentials in body...');
      const flow = [
         { id: 'n1', type: 'oauth2', name: 'oauth2', client_credentials_in_body: true, wires: [['n2']] },
         { id: 'n2', type: 'helper' }
      ];
      const credentials = {
         clientId: 'testClientId',
         clientSecret: 'testClientSecret'
      };

      helper.load(OAuth2Node, flow, credentials, function () {
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
               console.error('Failed client credentials in body test', err);
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
});
