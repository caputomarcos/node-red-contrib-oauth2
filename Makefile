# ----------------------------------------------------------------------------------------------------------------------
SHELL=/bin/bash

PROJECT_NAME=$(shell basename $(PWD))

REGISTRY_HOST=registry.b2w.io
REGISTRY_GROUP=b2wdigital

RELEASE_SUPPORT := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))/.make-release-support
IMAGE=$(shell tr '[:upper:]' '[:lower:]' <<< $(PROJECT_NAME))

VERSION=$(shell . $(RELEASE_SUPPORT) ; getVersion)
TAG=$(shell . $(RELEASE_SUPPORT); getTag)

.PHONY: help version release
# ----------------------------------------------------------------------------------------------------------------------

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
	@. $(RELEASE_SUPPORT) ; ! tagExists $(TAG) || (echo "ERROR: tag $(TAG) for version $(VERSION) already tagged in git" >&2 && exit 1) ;
	@. $(RELEASE_SUPPORT) ; setRelease $(VERSION)
	git add .release
	git commit -m "bumped to version $(VERSION)" ;
	git tag $(TAG) ;
	@[ -n "$(shell git remote -v)" ] && git push --tags
# ----------------------------------------------------------------------------------------------------------------------
# RELEASE
# ----------------------------------------------------------------------------------------------------------------------
release: check-status check-release
# ----------------------------------------------------------------------------------------------------------------------
# MAJOR-RELEASE
# ----------------------------------------------------------------------------------------------------------------------
tag-major-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMajorLevel)
tag-major-release: .release tag
major-release: tag-major-release release ## Major Release
	@echo $(VERSION)

# ----------------------------------------------------------------------------------------------------------------------
# MINOR-RELEASE
# ----------------------------------------------------------------------------------------------------------------------
tag-minor-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMinorLevel)
tag-minor-release: .release tag
minor-release: tag-minor-release release ## Minor Release
	@echo $(VERSION)

# ----------------------------------------------------------------------------------------------------------------------
# MICRO-RELEASE
# ----------------------------------------------------------------------------------------------------------------------
tag-micro-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMicroLevel)
tag-micro-release: .release tag
micro-release: tag-micro-release release ## Micro Release
	@echo $(VERSION)
