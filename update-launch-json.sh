#!/bin/bash

# Obter a versão do Node.js atual gerenciada pelo nvm
NODE_VERSION=$(node --version)

# Substituir a versão do Node.js no arquivo launch.json
cat <<EOL > .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "name": "Local - Debug Node-RED",
      "program": "\${env:HOME}/.nvm/versions/node/${NODE_VERSION}/lib/node_modules/node-red/red.js",
      "cwd": "\${env:HOME}/.node-red/",
      "skipFiles": ["<node_internals>/**"],
      "runtimeArgs": ["--preserve-symlinks", "--experimental-modules"],
      "request": "launch"
    },
    {
      "type": "node",
      "request": "attach",
      "name": "GitPOD - Attach to Process",
      "processId": "\${command:PickProcess}"
    }
  ]
}
EOL
