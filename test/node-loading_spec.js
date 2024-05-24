const helper = require('node-red-node-test-helper');
const oauth2Node = require('../src/oauth2.js');

describe('OAuth2 Node Loading', function () {
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
