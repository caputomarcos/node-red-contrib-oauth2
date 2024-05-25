const net = require('net');
const tls = require('tls');
const zlib = require('zlib');
const fs = require('fs');

class ProxyServer {
   constructor(authUser, authPass, serverHost, serverPort, proxyHttpHost, proxyHttpPort, proxyHttpsHost, proxyHttpsPort, httpsOptions = null) {
      this.AUTH_STRING = Buffer.from(`${authUser}:${authPass}`).toString('base64');
      this.SERVER_HOST = serverHost;
      this.SERVER_PORT = serverPort;
      this.PROXY_HTTP_HOST = proxyHttpHost;
      this.PROXY_HTTP_PORT = proxyHttpPort;
      this.PROXY_HTTPS_HOST = proxyHttpsHost;
      this.PROXY_HTTPS_PORT = proxyHttpsPort;
      this.httpsOptions = httpsOptions;
   }

   isAuthenticated(dataString) {
      const authHeader = dataString.split('\r\n').find((line) => line.startsWith('Proxy-Authorization: '));
      if (!authHeader) return false;

      const authToken = authHeader.split(' ')[2];
      return authToken === this.AUTH_STRING;
   }

   decompressGzip(data, callback) {
      zlib.gunzip(data, (err, decompressed) => {
         if (err) {
            console.error('Failed to decompress data:', err);
            callback(err, null);
         } else {
            callback(null, decompressed.toString());
         }
      });
   }

   handleClientConnection(clientToProxySocket, isHttps) {
      console.log(`Client connected to proxy (${isHttps ? 'HTTPS' : 'HTTP'})`);

      clientToProxySocket.once('data', (data) => {
         const dataString = data.toString();
         const isTLSConnection = dataString.indexOf('CONNECT') !== -1;

         console.log('Received data from client:', dataString);

         if (!this.isAuthenticated(dataString)) {
            console.log('Authentication failed');
            clientToProxySocket.write('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="Access to internal site"\r\n\r\n');
            clientToProxySocket.end();
            return;
         }

         console.log('Authentication successful');

         if (isTLSConnection) {
            this.handleTlsConnection(clientToProxySocket, dataString);
         } else {
            this.handleHttpConnection(clientToProxySocket, data);
         }
      });
   }

   handleTlsConnection(clientToProxySocket, dataString) {
      // eslint-disable-next-line no-unused-vars
      const [_, targetHost, targetPort] = dataString.split(' ');

      console.log(`Handling TLS connection to ${targetHost}:${targetPort}`);

      clientToProxySocket.write('HTTP/1.1 200 OK\r\n\r\n');
      const proxyToServerSocket = net.createConnection(
         {
            host: targetHost.split(':')[0],
            port: targetPort.split(':')[0]
         },
         () => {
            console.log('TLS connection established');
            clientToProxySocket.pipe(proxyToServerSocket);
            proxyToServerSocket.pipe(clientToProxySocket);
         }
      );

      proxyToServerSocket.on('error', (err) => {
         console.error('Proxy to server error (TLS):', err);
      });

      clientToProxySocket.on('error', (err) => {
         console.error('Client to proxy error (TLS):', err);
      });

      clientToProxySocket.on('close', () => {
         console.log('Client connection closed (TLS)');
      });

      proxyToServerSocket.on('close', () => {
         console.log('Server connection closed (TLS)');
      });
   }

   handleHttpConnection(clientToProxySocket, initialData) {
      console.log(`Connecting to server at ${this.SERVER_HOST}:${this.SERVER_PORT}`);

      const proxyToServerSocket = net.createConnection(
         {
            host: this.SERVER_HOST,
            port: this.SERVER_PORT
         },
         () => {
            console.log('Proxy to server connection established');
            proxyToServerSocket.write(initialData);
            clientToProxySocket.pipe(proxyToServerSocket);
            proxyToServerSocket.pipe(clientToProxySocket);
         }
      );

      let serverResponseChunks = [];
      let headersReceived = false;
      let headers = '';

      proxyToServerSocket.on('data', (chunk) => {
         serverResponseChunks.push(chunk);

         if (!headersReceived) {
            const chunkString = Buffer.concat(serverResponseChunks).toString();
            const headerEndIndex = chunkString.indexOf('\r\n\r\n');
            if (headerEndIndex !== -1) {
               headersReceived = true;
               headers = chunkString.slice(0, headerEndIndex + 4);
               console.log('Received headers from server:', headers);

               const body = chunk.slice(headerEndIndex + 4);
               serverResponseChunks = [body];
            }
         } else {
            serverResponseChunks.push(chunk);
         }
      });

      proxyToServerSocket.on('end', () => {
         console.log('Server connection ended');

         const responseBuffer = Buffer.concat(serverResponseChunks);
         const contentEncodingHeader = headers.toLowerCase().includes('content-encoding: gzip');

         if (contentEncodingHeader) {
            this.decompressGzip(responseBuffer, (err, decompressedData) => {
               if (!err) {
                  console.log('Decompressed server data:', decompressedData);
               } else {
                  console.error('Failed to decompress server data:', err);
               }
            });
         } else {
            console.log('Received data from server:', responseBuffer.toString());
         }

         clientToProxySocket.write(headers);
         clientToProxySocket.write(responseBuffer);
         clientToProxySocket.end();
      });

      proxyToServerSocket.on('close', () => {
         console.log('Server connection closed');
      });

      proxyToServerSocket.on('error', (err) => {
         console.error('Proxy to server error:', err);
      });

      clientToProxySocket.on('end', () => {
         console.log('Client connection ended');
      });

      clientToProxySocket.on('close', () => {
         console.log('Client connection closed');
      });

      clientToProxySocket.on('error', (err) => {
         console.error('Client to proxy error:', err);
      });
   }

   start() {
      const httpServer = net.createServer((socket) => this.handleClientConnection(socket, false));
      const httpsServer = this.httpsOptions ? tls.createServer(this.httpsOptions, (socket) => this.handleClientConnection(socket, true)) : null;

      httpServer.on('error', (err) => {
         console.error('Internal HTTP server error occurred:', err);
      });

      if (httpsServer) {
         httpsServer.on('error', (err) => {
            console.error('Internal HTTPS server error occurred:', err);
         });
      }

      httpServer.listen(
         {
            host: this.PROXY_HTTP_HOST,
            port: this.PROXY_HTTP_PORT
         },
         () => {
            console.log(`HTTP Server listening on ${this.PROXY_HTTP_HOST}:${this.PROXY_HTTP_PORT}`);
         }
      );

      if (httpsServer) {
         httpsServer.listen(
            {
               host: this.PROXY_HTTPS_HOST,
               port: this.PROXY_HTTPS_PORT
            },
            () => {
               console.log(`HTTPS Server listening on ${this.PROXY_HTTPS_HOST}:${this.PROXY_HTTPS_PORT}`);
            }
         );
      }
   }
}

// HTTPS options (certificates)
const httpsOptions = {
   key: fs.readFileSync('./test/utils/private-key.pem'),
   cert: fs.readFileSync('./test/utils/certificate.pem')
};

const proxyServer = new ProxyServer('user', 'password', '127.0.0.1', 8088, '0.0.0.0', 8080, '0.0.0.0', 8443, httpsOptions);
proxyServer.start();
