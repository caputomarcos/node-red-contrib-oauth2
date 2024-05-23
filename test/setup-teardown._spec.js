const helper = require('node-red-node-test-helper');
const nock = require('nock');

helper.init(require.resolve('node-red'));

let serverStarted = false;

function startServer() {
   return new Promise((resolve, reject) => {
      console.log('Starting Node-RED server...');
      helper.startServer((err) => {
         if (err) {
            console.error('Failed to start Node-RED server:', err);
            return reject(err);
         }
         serverStarted = true;
         console.log('Node-RED server started successfully.');
         resolve();
      });
   });
}

function stopServer() {
   return new Promise((resolve, reject) => {
      console.log('Stopping Node-RED server...');
      if (serverStarted && helper._server && helper._server.listening) {
         console.log('Node-RED server is running, attempting to stop it...');
         helper.stopServer((err) => {
            if (err) {
               console.error('Error stopping Node-RED server:', err);
               return reject(err);
            }
            console.log('Node-RED server stopped successfully.');
            serverStarted = false;
            resolve();
         });
      } else {
         console.log('Node-RED server is not running or was never started.');
         resolve();
      }
   });
}

before(async function () {
   this.timeout(20000); // Increase timeout to 20000ms for more room
   await startServer();
});

after(async function () {
   this.timeout(20000); // Increase timeout to 20000ms for more room
   await stopServer().catch((err) => {
      console.error('Failed to stop Node-RED server:', err);
   });
});

afterEach(function (done) {
   console.log('Unloading flows...');
   helper
      .unload()
      .then(() => {
         console.log('Flows unloaded successfully.');
         nock.cleanAll();
         done();
      })
      .catch((err) => {
         console.error('Error unloading flows:', err);
         done(err);
      });
});

// Exit process after all tests are done to ensure coverage data is written
after(function () {
   stopServer()
      .then(() => {
         process.exit();
      })
      .catch((err) => {
         console.error('Failed to stop Node-RED server:', err);
         process.exit(1);
      });
});
