const should = require('should'); // eslint-disable-line no-unused-vars
const helper = require('node-red-node-test-helper');
const nock = require('nock');
const oauth2Node = require('node-red-contrib-oauth2/src/oauth2.js');

helper.init(require.resolve('node-red'));

describe('OAuth2 Node Edge Cases', function () {
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
});
