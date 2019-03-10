var should = require('should')
var oauth2Node = require('../src/oauth2.js')
var helper = require('node-red-node-test-helper')
var nock = require('nock')
var request = require('request')

describe('OAuth2 client', function () {
  beforeEach(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    helper.unload()
    helper.stopServer(done)
  })

  describe('Token Management', function () {
    it('obtains a new access token when there is no token', function (done) {
      helper.load(
        oauth2Node,
        [
          { id: 'config-node1', type: 'oauth2-credentials' },
          { id: 'oauth2-node1', type: 'oauth2', 'account': 'config-node1', 'scope': 'app-specific-feature' }
        ],
        {
          'config-node1': {
            'tokenPath': 'token-path',
            'revokePath': 'revoke-path',
            'authorizeHost': 'https://server.com',
            'authorizePath': 'authorize-path',
            'tokenHost': 'https://server2.com',
            'clientId': 'foo',
            'clientSecret': 'bar'
          }
        },
        function () {
          let oauth_node = helper.getNode('oauth2-node1')
          should(oauth_node.context().get('access_token')).be.exactly(undefined)
          nock('https://server.com')
            .get(/^\/authorize-path/)
            .reply(302, 'Redirect', {
              'Location': function(request, response, body) {
                return (new URLSearchParams(request.path).get('redirect_uri')) + '?code=the-authorization-code&scope=' + (new URLSearchParams(request.path).get('scope')) + '&state=' + (new URLSearchParams(request.path).get('state'))
              }
            })
          nock('https://server2.com:443')
            .post('/token-path', {grant_type: 'authorization_code', code: 'the-authorization-code', client_id: 'foo', client_secret: 'bar', redirect_uri: /.+/})
            .reply(200, {access_token: 'RsT5OjbzRn430zqMLgV3Ia', expires_in: 3600})
          nock('http://localhost:1880')
            .get(/^\/oauth2\/node/)
            .reply(200, function(uri, requestBody) {
              helper.request()
                .get(uri)
                .expect(200)
                .end(function(error, response) {
                  if (error) {
                    return done(error)
                  }
                  should(oauth_node.context().get('access_token'))
                    .have.property('token')
                    .which.have.property('access_token')
                    .which.is.exactly('RsT5OjbzRn430zqMLgV3Ia')
                  done()
                })
              return {};
            })
          helper.request()
            .get('/oauth2/node/oauth2-node1/auth/url?protocol=http&hostname=localhost&port=1880')
            .expect(200)
            .end(function(error, response) {
              if (error) {
                return done(error)
              }
              request(response.body.url, function(error, response, body) {
                if (error) {
                  return done(error)
                }
              })
            })
        }
      )
    })
    it('refreshes an expired access token when the node receives a message', function (done) {
      helper.load(
        oauth2Node,
        [
          { id: 'config-node1', type: 'oauth2-credentials' },
          { id: 'oauth2-node1', type: 'oauth2', 'account': 'config-node1', 'scope': 'app-specific-feature', wires: [['test-node']] },
          { id: 'test-node', type: 'helper' }
        ],
        {
          'config-node1': {
            'tokenPath': 'token-path',
            'revokePath': 'revoke-path',
            'authorizeHost': 'https://server.com',
            'authorizePath': 'authorize-path',
            'tokenHost': 'https://server2.com',
            'clientId': 'foo',
            'clientSecret': 'bar'
          }
        },
        function () {
          let oauth_node = helper.getNode('oauth2-node1')
          nock('https://server2.com:443')
            .post('/token-path', {grant_type: 'authorization_code', code: 'the-authorization-code', client_id: 'foo', client_secret: 'bar'})
            .reply(200, {access_token: 'RsT5OjbzRn430zqMLgV3Ia', refresh_token: 'fdb8fdbecf1d03ce5e6125c067733c0d51de209c', expires_in: 3600})
          nock('https://server2.com:443')
            .post('/token-path', {grant_type: 'refresh_token', refresh_token: 'fdb8fdbecf1d03ce5e6125c067733c0d51de209c', client_id: 'foo', client_secret: 'bar'})
            .reply(200, {access_token: '93gp3nP5ZiTEkXBQ34Wey4', refresh_token: 'fdb8fdbecf1d03ce5e6125c067733c0d51de209c', expires_in: 3600})
          let state_machine = oauth_node.getStateMachine()
          state_machine.obtain('the-authorization-code').then(() => {
            let test_node = helper.getNode('test-node')
            let token = oauth_node.context().get('access_token')
            let one_hour_ago = new Date()
            one_hour_ago.setHours(one_hour_ago.getHours() - 1)
            token.token.expires_at = one_hour_ago
            should(token.expired()).be.exactly(true)
            test_node.on('input', function(msg) {
              msg.should.have.property('payload')
              msg.payload.should.have.property('accessToken')
              msg.payload.accessToken.should.be.exactly('93gp3nP5ZiTEkXBQ34Wey4')
              token = oauth_node.context().get('access_token')
              should(token.expired()).be.exactly(false)
              done()
            })
            oauth_node.emit('input', {})
          })
        }
      )
    })
  })
})
