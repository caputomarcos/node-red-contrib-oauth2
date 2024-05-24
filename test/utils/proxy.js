const net = require('net');

// Authentication settings
const AUTH_USER = 'user';
const AUTH_PASS = 'password';
const AUTH_STRING = Buffer.from(`${AUTH_USER}:${AUTH_PASS}`).toString('base64');

// Function to verify authentication
/**
 * Checks if the provided data string contains valid authentication.
 * @param {string} dataString - The data string from the client.
 * @returns {boolean} - True if authenticated, otherwise false.
 */
const isAuthenticated = (dataString) => {
   const authHeader = dataString.split('\r\n').find((line) => line.startsWith('Proxy-Authorization: '));
   if (!authHeader) return false;

   const authToken = authHeader.split(' ')[2];
   return authToken === AUTH_STRING;
};

// Target server settings
const SERVER_PORT = 8088;
const SERVER_ADDRESS = '127.0.0.1';

// Proxy server settings
const PROXY_PORT = 8080;
const PROXY_HOST = '0.0.0.0';

// Create proxy server
const server = net.createServer((clientToProxySocket) => {
   console.log('Client connected to proxy');

   clientToProxySocket.once('data', (data) => {
      const dataString = data.toString();
      const isTLSConnection = dataString.indexOf('CONNECT') !== -1;

      console.log(dataString);

      // Verify authentication
      if (!isAuthenticated(dataString)) {
         clientToProxySocket.write('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="Access to internal site"\r\n\r\n');
         clientToProxySocket.end();
         return;
      }

      console.log(`Connecting to server at ${SERVER_ADDRESS}:${SERVER_PORT}`);

      // Create a connection from the proxy to the target server
      const proxyToServerSocket = net.createConnection(
         {
            host: SERVER_ADDRESS,
            port: SERVER_PORT
         },
         () => {
            console.log('Proxy to server set up');
         }
      );

      // Handle TLS connections
      if (isTLSConnection) {
         clientToProxySocket.write('HTTP/1.1 200 OK\r\n\r\n');
      } else {
         proxyToServerSocket.write(data);
      }

      clientToProxySocket.pipe(proxyToServerSocket);
      proxyToServerSocket.pipe(clientToProxySocket);

      proxyToServerSocket.on('error', (err) => {
         console.error('Proxy to server error', err);
      });

      clientToProxySocket.on('error', (err) => {
         console.error('Client to proxy error', err);
      });
   });
});

// Server error handling
server.on('error', (err) => {
   console.error('Internal server error occurred', err);
});

// Log client disconnection
server.on('close', () => {
   console.log('Client disconnected');
});

// Start the proxy server
server.listen(
   {
      host: PROXY_HOST,
      port: PROXY_PORT
   },
   () => {
      console.log(`Server listening on ${PROXY_HOST}:${PROXY_PORT}`);
   }
);
