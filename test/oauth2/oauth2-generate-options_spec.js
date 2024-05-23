const helper = require('node-red-node-test-helper');
const OAuth2Node = require('node-red-contrib-oauth2/src/oauth2.js');
const should = require('should');

helper.init(require.resolve('node-red'));

describe('OAuth2 Node generateOptions', function () {
   const defaultCredentials = {
      client_id: 'testClientId',
      client_secret: 'testClientSecret',
      username: 'testUser',
      password: 'testPassword',
      refresh_token: 'testRefreshToken',
      redirect_uri: 'https://example.com/redirect',
      scope: 'testScope',
      resource: 'testResource',
      state: 'testState'
   };

   const createFlow = (credentials = defaultCredentials) => [
      { id: 'n1', type: 'oauth2', name: 'oauth2', wires: [['n2']], ...credentials },
      { id: 'n2', type: 'helper' }
   ];

   const testGenerateOptions = (flow, input, expectedForm, expectedHeaders, done) => {
      helper.load(OAuth2Node, flow, function () {
         const n1 = helper.getNode('n1');
         console.log('Input to generateOptions:', JSON.stringify(input, null, 2));
         const options = n1.generateOptions(input);
         console.log('Generated options:', JSON.stringify(options, null, 2));
         try {
            options.form.should.deepEqual(expectedForm);
            options.headers.should.deepEqual(expectedHeaders);
            done();
         } catch (err) {
            done(err);
         }
      });
   };

   this.timeout(60000); // Increase timeout to 60 seconds

   it('should handle password flow', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'password',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               username: 'testUser',
               password: 'testPassword',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'password',
         username: 'testUser',
         password: 'testPassword',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should handle client credentials flow', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'client_credentials',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'client_credentials',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should handle refresh token flow', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'refresh_token',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               refresh_token: 'testRefreshToken',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'refresh_token',
         client_id: 'testClientId',
         client_secret: 'testClientSecret',
         refresh_token: 'testRefreshToken',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should handle authorization code flow', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'authorization_code',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               code: 'testCode',
               redirect_uri: 'https://example.com/redirect',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'authorization_code',
         code: undefined,
         redirect_uri: 'https://example.com/redirect',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should handle implicit flow', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'implicit_flow',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               code: 'testCode',
               redirect_uri: 'https://example.com/redirect',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'authorization_code',
         client_id: 'testClientId',
         client_secret: 'testClientSecret',
         code: undefined,
         redirect_uri: 'https://example.com/redirect',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should handle set by credentials flow', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'set_by_credentials',
               client_id: 'setClientId',
               client_secret: 'setClientSecret',
               refresh_token: 'setRefreshToken',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'set_by_credentials',
         client_id: 'setClientId',
         client_secret: 'setClientSecret',
         refresh_token: 'setRefreshToken',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };
      const expectedHeaders = {
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('setClientId:setClientSecret').toString('base64'),
         'Content-Type': 'application/x-www-form-urlencoded'
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should include client credentials in the body if configured', function (done) {
      const flow = createFlow({ client_credentials_in_body: true });
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'client_credentials',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'client_credentials',
         client_id: 'testClientId',
         client_secret: 'testClientSecret',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json'
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should add Authorization header with client credentials if not in body', function (done) {
      const flow = createFlow({ client_credentials_in_body: false });
      const input = {
         oauth2Request: {
            credentials: {
               grant_type: 'client_credentials',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'client_credentials',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      testGenerateOptions(flow, input, expectedForm, expectedHeaders, done);
   });

   it('should use access token URL from the message if available', function (done) {
      const flow = createFlow();
      const input = {
         oauth2Request: {
            access_token_url: 'https://custom.example.com/token',
            credentials: {
               grant_type: 'client_credentials',
               client_id: 'testClientId',
               client_secret: 'testClientSecret',
               scope: 'testScope',
               resource: 'testResource',
               state: 'testState'
            }
         }
      };

      const expectedForm = {
         grant_type: 'client_credentials',
         scope: 'testScope',
         resource: 'testResource',
         state: 'testState'
      };

      const expectedHeaders = {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
         Authorization: 'Basic ' + Buffer.from('testClientId:testClientSecret').toString('base64')
      };

      helper.load(OAuth2Node, flow, function () {
         const n1 = helper.getNode('n1');
         console.log('Input to generateOptions:', JSON.stringify(input, null, 2));
         const options = n1.generateOptions(input);
         console.log('Generated options:', JSON.stringify(options, null, 2));
         try {
            options.form.should.deepEqual(expectedForm);
            options.headers.should.deepEqual(expectedHeaders);
            options.url.should.equal('https://custom.example.com/token');
            done();
         } catch (err) {
            done(err);
         }
      });
   });
});
