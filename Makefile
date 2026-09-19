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

# --- git hooks ---------------------------------------------------------------
hooks:
	pre-commit install --hook-type pre-commit --hook-type pre-push
