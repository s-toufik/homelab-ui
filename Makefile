install:
	npm install

update_dependency:
ifdef PACKAGE
	npm update $(PACKAGE)
else
	npm update
endif

test:
	npx ng test --watch=false

lint:
	npx prettier --check .

fix:
	npx prettier --write .

format:
	npx prettier --write .

typecheck:
	npx tsc -p tsconfig.app.json --noEmit

check:
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test

# --- run -------------------------------------------------------------------
run:
	npx ng serve

clean:
	rm -rf dist .angular/cache

build:
	rm -rf dist
	npx ng build

docker_build:
	docker build -f devops/docker/Dockerfile -t homelab-ui:local .

# Publishes the image homelab-infra runs, for both x86-64 servers and ARM machines.
# Needs `docker login` and a buildx builder (Docker Desktop has one). TAG=1.2.0 for a release.
IMAGE ?= toufik142/homelab-ui
TAG ?= latest
docker_publish:
	docker buildx build --platform linux/amd64,linux/arm64 \
	  -f devops/docker/Dockerfile -t $(IMAGE):$(TAG) --push .

# --- git hooks ---------------------------------------------------------------
hooks:
	pre-commit install --hook-type pre-commit --hook-type pre-push
