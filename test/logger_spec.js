const assert = require('assert');
const sinon = require('sinon');
const Logger = require('node-red-contrib-oauth2/src/libs/logger'); // Adjust the path as necessary

const loggerStatusActive = { fill: 'yellow', shape: 'ring', text: 'Logging' };

describe('Logger', function () {
   let consoleStub;

   beforeEach(function () {
      consoleStub = sinon.stub(console, 'log');
   });

   afterEach(function () {
      consoleStub.restore();
   });

   it('should initialize with default values', function () {
      const logger = new Logger();
      assert.strictEqual(logger.label, '***');
      assert.strictEqual(logger.active, true);
      assert.strictEqual(logger.count, null);
   });

   it('should initialize with given values', function () {
      const logger = new Logger('test', false, 5);
      assert.strictEqual(logger.label, 'test');
      assert.strictEqual(logger.active, false);
      assert.strictEqual(logger.count, 5);
   });

   it('should set logger active status and count', function () {
      const logger = new Logger();
      logger.set(false, 10);
      assert.strictEqual(logger.active, false);
      assert.strictEqual(logger.count, 10);
   });

   it('should log a message when active', function () {
      const logger = new Logger();
      logger.send('test message', 'info');
      assert(consoleStub.calledWith(sinon.match('test message')));
   });

   it('should not log a message when inactive', function () {
      const logger = new Logger();
      logger.set(false);
      logger.send('test message', 'info');
      assert(consoleStub.notCalled);
   });

   it('should decrement count and stop logging when count reaches zero', function () {
      const logger = new Logger('test', true, 1);
      logger.send('test message 1', 'info');
      assert(consoleStub.calledOnce);
      logger.send('test message 2', 'info');
      assert(consoleStub.calledOnce);
   });

   it('should dump object', function () {
      const logger = new Logger();
      const obj = { key: 'value' };
      logger.objectDump(obj);
      assert(consoleStub.calledWith(sinon.match('key')));
      assert(consoleStub.calledWith(sinon.match('value')));
   });

   // Additional tests to improve coverage

   it('should not log message when type is not specified', function () {
      const logger = new Logger();
      logger.send('test message');
      assert(consoleStub.notCalled);
   });

   it('should log different types of messages', function () {
      const logger = new Logger();
      logger.send('info message', 'info');
      assert(consoleStub.calledWith(sinon.match('info message')));
      logger.send('error message', 'error');
      assert(consoleStub.calledWith(sinon.match('error message')));
   });

   it('should handle edge case with null count', function () {
      const logger = new Logger('test', true, null);
      logger.send('test message', 'info');
      assert(consoleStub.calledWith(sinon.match('test message')));
   });

   it('should handle undefined or null inputs gracefully', function () {
      const logger = new Logger();
      logger.send(null, 'info');
      assert(consoleStub.notCalled);
      logger.send(undefined, 'info');
      assert(consoleStub.notCalled);
   });

   it('should reset count and become active when count is reset', function () {
      const logger = new Logger('test', true, 1);
      logger.send('test message 1', 'info');
      assert(consoleStub.calledOnce);
      logger.set(true, 2);
      logger.send('test message 2', 'info');
      assert(consoleStub.calledTwice);
   });

   it('should not throw error on objectDump with non-object', function () {
      const logger = new Logger();
      logger.objectDump('string');
      assert(consoleStub.calledWith(sinon.match('Invalid object')));
   });

   // Additional tests for full coverage

   it('should handle sendConsole properly', function () {
      const logger = new Logger();
      const message = 'console message';
      logger.sendConsole(message, 'info');
      assert(consoleStub.calledWith(sinon.match(message)));
   });

   it('should handle sendErrorAndDump properly', function () {
      const logger = new Logger();
      const obj = { key: 'value' };
      const errorMsg = 'error message';
      logger.sendErrorAndDump(errorMsg, obj);
      assert(consoleStub.calledWith(sinon.match(errorMsg)));
      assert(consoleStub.calledWith(sinon.match('key')));
   });

   it('should handle sendErrorAndStackDump properly', function () {
      const logger = new Logger();
      const errorMsg = 'error message';
      const error = new Error('test error');
      logger.sendErrorAndStackDump(errorMsg, error);
      assert(consoleStub.calledWith(sinon.match(errorMsg)));
      assert(consoleStub.calledWith(sinon.match(error.stack)));
   });

   it('should setNodeStatus properly', function () {
      const logger = new Logger();
      const node = {
         status: sinon.spy()
      };
      logger.setNodeStatus(node);
      assert(node.status.calledWith(loggerStatusActive));
   });

   it('should handle setOff and setOn properly', function () {
      const logger = new Logger('test', true, 1);
      logger.setOff();
      assert.strictEqual(logger.active, false);
      logger.setOn();
      assert.strictEqual(logger.active, true);
      assert.strictEqual(logger.count, 1);
   });

   it('should handle stackDump properly', function () {
      const logger = new Logger();
      const error = new Error('test error');
      logger.stackDump(error);
      assert(consoleStub.calledWith(sinon.match(error.stack)));
      logger.stackDump();
      assert(consoleStub.calledOnce); // As console.trace is used here
   });
});
