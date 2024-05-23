const should = require('should'); // eslint-disable-line no-unused-vars
const helper = require('node-red-node-test-helper');
const nock = require('nock');
const oauth2Node = require('node-red-contrib-oauth2/src/oauth2.js');

helper.init(require.resolve('node-red'));

describe('OAuth2 Node POST Request', function () {
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
});
