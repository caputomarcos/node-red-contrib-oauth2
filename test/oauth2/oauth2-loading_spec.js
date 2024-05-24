const should = require('should'); // eslint-disable-line no-unused-vars
const helper = require('node-red-node-test-helper');
const oauth2Node = require('node-red-contrib-oauth2/src/oauth2.js');
const nock = require('nock');

helper.init(require.resolve('node-red'));

describe('OAuth2 Node Loading', function () {
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
});
