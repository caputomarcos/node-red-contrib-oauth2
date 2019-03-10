module.exports = function (RED) {
  'use strict';

  const OAuth2 = require('simple-oauth2');
  const StateMachine = require('javascript-state-machine')
  const crypto = require('crypto')

  function OAuth2CredentialsNode (config) {
    RED.nodes.createNode(this, config)
    let stringOrDefault = (value, defaultValue) => {
      return typeof value === 'string' && value.length > 0 ? value : defaultValue
    }
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.tokenHost = config.tokenHost
    this.tokenPath = stringOrDefault(config.tokenPath, undefined)
    this.revokePath = stringOrDefault(config.revokePath, undefined)
    this.authorizeHost = stringOrDefault(config.authorizeHost, undefined)
    this.authorizePath = stringOrDefault(config.authorizePath, undefined)
  }
  RED.nodes.registerType('oauth2-credentials', OAuth2CredentialsNode)

  function OAuth2Node (config) {
    RED.nodes.createNode(this, config)
    this.account = config.account
    this.scope = config.scope
    this.credentials = RED.nodes.getNode(config.account).credentials
    const node = this
    const credentials = {
      'client': {
        'id': node.credentials.clientId,
        'secret': node.credentials.clientSecret
      },
      'auth': {
        'tokenHost': node.credentials.tokenHost,
        'tokenPath': node.credentials.tokenPath,
        'revokePath': node.credentials.revokePath,
        'authorizeHost': node.credentials.authorizeHost,
        'authorizePath': node.credentials.authorizePath
      }
    }
    const oauth2 = OAuth2.create(credentials)
    const fsm = new StateMachine({
      init: 'no_token',
      transitions: [
        { name: 'obtain', from: 'no_token', to: 'has_token' },
        { name: 'invalidate', from: 'has_token', to: 'token_expired' },
        { name: 'renew', from: 'token_expired', to: 'has_token' },
        { name: 'failed', from: 'token_expired', to: 'no_token' }
      ],
      methods: {
        onObtain: function (transition, code) {
          let tokenConfig = {
            code: code,
            redirect_uri: node.context().get('callback_url')
          }
          return new Promise((resolve, reject) => {
            oauth2.authorizationCode.getToken(tokenConfig)
              .then((result) => {
                node.context().set('access_token', oauth2.accessToken.create(result))
                resolve()
              })
              .catch((error) => {
                node.error('Obtaining Access Token Failed: ' + error.message, error)
                reject(error)
              })
          })
        },
        onRenew: function () {
          let accessToken = node.context().get('access_token')
          return new Promise((resolve, reject) => {
            accessToken.refresh()
              .then((result) => {
                node.context().set('access_token', result)
                resolve(result)
              })
              .catch((error) => {
                node.error('Access Token Renew Failed: ' + error.message, error)
                reject(error)
                fsm.failed()
              })
          })
        },
        onEnterHasToken: function () {
          node.status({ fill: 'green', shape: 'dot', text: 'has token' })
        },
        onEnterTokenExpired: function () {
          node.status({ fill: 'red', shape: 'dot', text: 'expired token' })
        },
        onEnterNoToken: function () {
          node.status({ fill: 'grey', shape: 'dot', text: 'uninitialized token' })
        }
      }
    })
    node.on('input', (msg) => {
      if (!fsm.is('has_token')) {
        return
      }

      let emitTokenEvent = (accessToken) => {
        if (undefined == msg.payload) {
          msg.payload = {}
        }
        msg.payload.accessToken = accessToken.token.access_token
        node.send(msg)
      }
      let accessToken = node.context().get('access_token')

      if (accessToken.expired()) {
        fsm.invalidate()
        fsm.renew()
          .then((accessToken) => {
            emitTokenEvent(accessToken)
          })
        return
      }

      emitTokenEvent(accessToken)
    })
    node.getStateMachine = function () {
      return fsm
    }
    node.getAuthorizationUrl = function (protocol, hostname, port) {
      let callbackUrl = protocol + '://' + hostname + (port ? ':' + port : '') +
                '/oauth2/node/' + node.id + '/auth/callback'
      node.context().set('callback_url', callbackUrl)
      let csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_')
      node.context().set('csrf_token', csrfToken)
      return oauth2.authorizationCode.authorizeURL({
        redirect_uri: callbackUrl,
        scope: node.scope,
        state: csrfToken
      })
    }
  }
  RED.nodes.registerType('oauth2', OAuth2Node, {
    credentials: {
      account: { type: 'text' }
    }
  })

  RED.httpAdmin.get('/oauth2/node/:id/auth/url', (req, res) => {
    if (!req.params.id || !req.query.protocol || !req.query.hostname || !req.query.port) {
      res.sendStatus(400)
      return
    }

    let node = RED.nodes.getNode(req.params.id)
    if (!node) {
      res.sendStatus(404)
      return
    }

    res.send({
      'url': node.getAuthorizationUrl(req.query.protocol, req.query.hostname, req.query.port)
    })
  })

  RED.httpAdmin.get('/oauth2/node/:id/auth/callback', (req, res) => {
    if (!req.params.id || !req.query.code || !req.query.state) {
      res.sendStatus(400)
      return
    }

    let node = RED.nodes.getNode(req.params.id)
    if (!node) {
      res.sendStatus(404)
      return
    }

    if (node.context().get('csrf_token') !== req.query.state) {
      res.sendStatus(401)
      return
    }

    node.getStateMachine().obtain(req.query.code)
      .then(() => {
        res.sendStatus(200)
      })
      .catch(() => {
        res.sendStatus(500)
      })
  })
}
