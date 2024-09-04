SHELL := /bin/bash
.SILENT: clean pull start stop

build-local:
	echo "Building openwisp wifi_login_pages......"
	BUILD_ARGS_FILE=$$(cat .build.env 2>/dev/null); \
	for build_arg in $$BUILD_ARGS_FILE; do \
	    BUILD_ARGS+=" --build-arg $$build_arg"; \
	done; \
	docker build --target local --tag enock295simiyu/wifi_login_pages:local \
	             --file ./Dockerfile ./

	echo "Finished building enock295simiyu/wifi_login_pages"

build:
	echo "Building openwisp wifi_login_pages......"
	BUILD_ARGS_FILE=$$(cat .build.env 2>/dev/null); \
	for build_arg in $$BUILD_ARGS_FILE; do \
	    BUILD_ARGS+=" --build-arg $$build_arg"; \
	done; \
	docker build --tag enock295simiyu/wifi_login_pages:latest \
	             --file ./Dockerfile ./

	echo "Finished building enock295simiyu/wifi_login_pages"

start:
	docker run --name=wifi_login_pages -p 3030:3030 --rm --env-file ./.env enock295simiyu/wifi_login_pages:latest
	docker container logs -f wifi_login_pages

start-local:
	docker run --name=wifi_login_pages_local -p 3030:3030  --rm --env-file ./.env -d enock295simiyu/wifi_login_pages:local
	docker container logs -f wifi_login_pages_local

stop:
	docker stop wifi_login_pages

stop-local:
	docker stop wifi_login_pages_local

runtests:start


publish:build
	docker tag enock295simiyu/wifi_login_pages:latest ghcr.io/enock295simiyu/wifi_login_pages:latest
	docker push  ghcr.io/enock295simiyu/wifi_login_pages:latest
