const should = require('should'); // eslint-disable-line no-unused-vars
const helper = require('node-red-node-test-helper');
const nock = require('nock');
const oauth2Node = require('../src/oauth2.js');

helper.init(require.resolve('node-red'));

describe('OAuth2 Node', function () {
  this.timeout(5000); // Increase timeout to 10000ms for more room

  before(function (done) {
    console.log('Starting Node-RED server...');
    helper.startServer(done);
  });

  after(function (done) {
    console.log('Stopping Node-RED server...');
    helper.stopServer(done);
  });

  afterEach(function (done) {
    console.log('Unloading flows...');
    helper.unload().then(function () {
      done();
    });
  });

  it('should be loaded', function (done) {
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

  it('should handle input and make POST request', function (done) {
    console.log('Testing input handling and POST request...');
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
          console.error('Failed input handling test', err);
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

  it('should handle errors', function (done) {
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

  it('should handle invalid client credentials', function (done) {
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

  it('should handle authorization_code grant type', function (done) {
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

  it('should handle refresh_token grant type', function (done) {
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

  it('should handle network failure', function (done) {
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

  it('should handle custom headers in response', function (done) {
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
        console.log('Received input on helper node');
        try {
          msg.should.have.property('oauth2Response');
          msg.oauth2Response.should.have.property('access_token', 'mocked_access_token');
          scope.done();
          done();
        } catch (err) {
          console.error('Failed proxy settings handling test', err);
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
