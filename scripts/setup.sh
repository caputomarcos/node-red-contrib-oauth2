#!/usr/bin/env bash
npm install -g npm@latest node-red@latest svelte-integration-red@latest 
# Initialize sample project
if [ -d /home/gitpod/.node-red ]; then
    rm -r /home/gitpod/.node-red
fi
mkdir /home/gitpod/.node-red
cp /workspace/node-red-contrib-oauth2/example-project/* /home/gitpod/.node-red/
cd /home/gitpod/.node-red/
npm install
npm link /workspace/node-red-contrib-oauth2 --save
npm link /workspace/node-red-contrib-oauth2/gitpod-plugin --save
# Go back to workspace directory
cd /workspace/node-red-contrib-oauth2