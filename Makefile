SHELL=/bin/bash

PROJECT_NAME=$(shell basename $(PWD))
REGISTRY_HOST=
REGISTRY_GROUP=

RELEASE_SUPPORT := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))/.make-release-support
IMAGE=$(shell tr '[:upper:]' '[:lower:]' <<< $(PROJECT_NAME))

VERSION=$(shell . $(RELEASE_SUPPORT) ; getVersion)
TAG=$(shell . $(RELEASE_SUPPORT); getTag)

.PHONY: help version release lint test coverage

help:
	@echo 'Usage: make <target>'
	@echo ''
	@echo '  Targets:'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "   \033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ''

version: .release ## Display Release Version.
	@. $(RELEASE_SUPPORT); getVersion

.release:
	@echo "release=0.0.0" > .release
	@echo "tag=$(PROJECT_NAME)-0.0.0" >> .release
	@echo INFO: .release created
	@cat .release

check-release: .release
	@. $(RELEASE_SUPPORT) ; tagExists $(TAG) || (echo "ERROR: version not yet tagged in git. make [major,minor,micro]-release." >&2 && exit 1) ;
	@. $(RELEASE_SUPPORT) ; ! differsFromRelease $(TAG) || (echo "ERROR: current directory differs from tagged $(TAG). make [major,minor,micro]-release." ; exit 1)

check-status:
	@. $(RELEASE_SUPPORT) ; ! hasChanges || (echo "ERROR: there are still outstanding changes" >&2 && exit 1) ;

tag: TAG=$(shell . $(RELEASE_SUPPORT); getTag $(VERSION))
tag: check-status
	@echo "Current version: $(VERSION)"  # Debug statement
	@echo "Current tag: $(TAG)"  # Debug statement
	@. $(RELEASE_SUPPORT) ; ! tagExists $(TAG) || (echo "ERROR: tag $(TAG) for version $(VERSION) already tagged in git" >&2 && exit 1) ;
	@. $(RELEASE_SUPPORT) ; setRelease $(VERSION)
	git add .release package.json
	@sed -i.bak 's/"version": "[^"]*"/"version": "$(VERSION)"/' package.json && rm package.json.bak
	git commit -m "bumped to version $(VERSION)"
	git tag $(TAG)
	@[ -n "$(shell git remote -v)" ] && git push --tags

tag-major-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMajorLevel)
tag-major-release: .release tag
major-release: tag-major-release release ## Major Release
	@echo $(VERSION)

tag-minor-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMinorLevel)
tag-minor-release: .release tag
minor-release: tag-minor-release release ## Minor Release
	@echo $(VERSION)

tag-micro-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMicroLevel)
tag-micro-release: .release tag
micro-release: tag-micro-release release ## Micro Release
	@echo $(VERSION)

lint: ## Lint the project
	npm run lint

test: ## Run tests
	npm test

coverage: ## Generate test coverage
	npm run coverage

PID_FILE=proxy.pid

start: ## Start the proxy server
	@echo "Starting proxy server..." 
	@nohup node test/utils/proxy.js > proxy.log 2>&1 & echo $$! > $(PID_FILE) 
	@echo "Proxy server started with PID $$(cat $(PID_FILE))"

stop: ## Stop the proxy server
	@if [ -f $(PID_FILE) ]; then \
		echo "Stopping proxy server..."; \
		PID=$$(cat $(PID_FILE)); \
		kill $$PID && rm -f $(PID_FILE); \
		echo "Proxy server stopped"; \
	else \
		echo "Proxy server is not running"; \
	fi

status: ## Check the status of the proxy server
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if ps -p $$PID > /dev/null; then \
			echo "Proxy server is running with PID $$PID"; \
		else \
			echo "Proxy server is not running, but PID file exists"; \
		fi \
	else \
		echo "Proxy server is not running"; \
	fi

