FROM gitpod/workspace-full:2022-07-22-21-28-39

# Install custom tools, runtimes, etc.
# For example "bastet", a command-line tetris clone:
# RUN brew install bastet
#
# More information: https://www.gitpod.io/docs/config-docker/

RUN npm install -g node-red@latest svelte-integration-red@latest
