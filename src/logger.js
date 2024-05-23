const loggerStatusActive = { fill: 'yellow', shape: 'ring', text: 'Logging' };
const loggerStatusOff = { fill: 'green', shape: 'ring', text: '' };
const { inspect } = require('util');

function Logger(label = '***', active = true, count = 111, msg) {
   this.consoleFunction = console.log;
   this.sendFunction = this.sendConsole;
   this.type = 'debug';
   if (label instanceof Object) Object.assign(this, label);
   else this.label = label;
   if (this.active == undefined) this.active = active;
   if (this.count == undefined) this.count = count;
   this.set(this.active, this.count);
   return msg ? this.sendInfo(msg) : this;
}
Logger.prototype.objectDump = function (o) {
   return o ? this.send(inspect(o, { showHidden: true, depth: null })) : this;
};
Logger.prototype.send = function (message, type, node, sendFunction = this.sendFunction) {
   if (!this.active) return this;
   if (--this.count) {
      try {
         sendFunction.apply(this, [message instanceof Object ? JSON.stringify(message) : message, type, node]);
      } catch (ex) {
         sendFunction.apply(this, [ex.message, type, node]);
      }
   } else {
      this.setOff();
   }
   return this;
};
Logger.prototype.sendConsole = function (message, type = this.type, consoleFunction = this.consoleFunction) {
   const ts = new Date().toString().split(' ');
   consoleFunction.apply(this, [[parseInt(ts[2], 10), ts[1], ts[4]].join(' ') + ' - [' + type + '] ' + this.label + ' ' + message]);
   return this;
};
Logger.prototype.sendDebug = function (message, values) {
   if (values) return this.send(Object.assign({}, { label: message }, values), 'debug');
   return this.send(message, 'debug');
};
Logger.prototype.debug = Logger.prototype.sendDebug;
Logger.prototype.sendError = function (message) {
   return this.send(message, 'error');
};
Logger.prototype.error = Logger.prototype.sendError;
Logger.prototype.sendErrorAndDump = function (message, o, ex) {
   return this.sendError(message).objectDump(o).stackDump(ex);
};
Logger.prototype.sendErrorAndStackDump = function (message, ex) {
   return this.sendError(message).stackDump(ex);
};
Logger.prototype.sendInfo = function (message) {
   return this.send(message, 'info');
};
Logger.prototype.info = Logger.prototype.sendInfo;
Logger.prototype.sendNode = function (message, node = this.node, type = this.noderedLogType) {
   return node[type](message);
};
Logger.prototype.sendWarn = function (message) {
   return this.send(message, 'warn');
};
Logger.prototype.sendWarning = Logger.prototype.sendWarn;
Logger.prototype.warn = Logger.prototype.sendWarn;
Logger.prototype.warning = Logger.prototype.sendWarn;
Logger.prototype.setNodeStatus = function (node) {
   if (node) this.node = node;
   if (this.node == null) throw Error('No node set');
   this.showNodeStatus();
   return this;
};
Logger.prototype.set = function (active, count) {
   if (count !== undefined) {
      this.count = count;
      this.countDefault = count;
   }
   if (active !== undefined) this.active = active;
   this.showNodeStatus();
   this.sendConsole('logging turning ' + (this.active ? 'on logging next ' + this.count + ' log points' : 'off'));
   return this;
};
Logger.prototype.setOff = function () {
   return this.set(false);
};
Logger.prototype.setOn = function (count = this.countDefault) {
   return this.set(true, count);
};
Logger.prototype.showNodeStatus = function () {
   if (this.node) this.node.status(this.active ? loggerStatusActive : loggerStatusOff);
};
Logger.prototype.stackDump = function (ex) {
   if (ex) console.log(ex.stack);
   else console.trace();
   return this;
};

module.exports = Logger;
