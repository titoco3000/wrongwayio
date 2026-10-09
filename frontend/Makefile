SHELL := /bin/bash
.DEFAULT_GOAL := help

# Root env (AWS_PROFILE, AWS_REGION, PROJECT) -- sourced automatically.
-include ../.env
export AWS_PROFILE AWS_REGION PROJECT

BUN ?= bun

# Allow `make run dev` / `make build prod`. Bare targets default to local,
# which talks to the backend on localhost:8003 (`make -C backend run`).
STAGE := $(word 2,$(MAKECMDGOALS))
ifeq ($(STAGE),)
STAGE := local
endif
ENV_FILE := .env.$(STAGE)

# Resolves VITE_API_URL for the stage: localhost for `local`, else API_URL
# from frontend/.env.<stage> (the block `make -C infra output <stage>` prints).
define API_ENV
if [ "$(STAGE)" = local ]; then API_URL=http://localhost:8003; \
else \
  test -f $(ENV_FILE) || { echo "error: $(ENV_FILE) missing."; \
    echo "run 'cd ../infra && make output $(STAGE)' and copy the frontend block into frontend/$(ENV_FILE)"; exit 1; }; \
  . ./$(ENV_FILE); \
fi; \
test -n "$$VITE_API_URL$$API_URL" || { echo "error: no API url for stage $(STAGE)"; exit 1; }; \
export VITE_API_URL="$${VITE_API_URL:-$$API_URL}"
endef

define REQUIRE_MODULES
@test -d node_modules || { echo "error: dependencies missing -- run 'make init' first"; exit 1; }
endef

# `local` points at localhost; only the deployed stages have infrastructure.
define REQUIRE_DEPLOYABLE_STAGE
@case "$(STAGE)" in dev|prod) ;; *) \
  echo "error: cannot deploy stage '$(STAGE)' -- deployable stages are dev and prod."; \
  exit 1;; esac
endef

# Swallow the stage word so make does not treat it as a target.
.PHONY: local dev prod
local dev prod:
	@:

.PHONY: help
help:
	@echo "make init            install dependencies"
	@echo "make run [stage]     vite dev server (stage: local (default), dev, prod)"
	@echo "make build [stage]   production build into dist/"
	@echo "make deploy [stage]  build + sync to S3 + invalidate CloudFront (dev, prod)"
	@echo "make preview [stage] build, then serve dist/ locally"
	@echo "make models          download the offline speech models (run once; needed for the speech games)"
	@echo "make test | clean"

.PHONY: init
init:
	@command -v $(BUN) >/dev/null || { echo "bun not found: https://bun.sh"; exit 1; }
	$(BUN) install
	./scripts/download-speech-models.sh
	@echo "frontend ready."

.PHONY: models
models:
	./scripts/download-speech-models.sh

.PHONY: run
run:
	$(REQUIRE_MODULES)
	@set -a; $(API_ENV); set +a; echo "stage $(STAGE) -> $$VITE_API_URL"; exec $(BUN) run dev

.PHONY: build
build:
	$(REQUIRE_MODULES)
	@set -a; $(API_ENV); set +a; echo "building $(STAGE) against $$VITE_API_URL"; $(BUN) run build

.PHONY: preview
preview: build
	$(BUN) run preview

# Hashed files in assets/ never change under the same name, so they cache for
# a year. Everything else (sounds, icons) caches a day; the entry points that
# name the current build are never cached, or a deploy would not show.
.PHONY: deploy
deploy:
	$(REQUIRE_DEPLOYABLE_STAGE)
	@$(MAKE) --no-print-directory build $(STAGE)
	@set -a; . ./$(ENV_FILE); set +a; \
	  command -v aws >/dev/null || { echo "aws cli not found: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"; exit 1; }; \
	  test -n "$$FRONTEND_BUCKET" || { echo "error: FRONTEND_BUCKET unset in $(ENV_FILE)"; exit 1; }; \
	  test -n "$$FRONTEND_DISTRIBUTION_ID" || { echo "error: FRONTEND_DISTRIBUTION_ID unset in $(ENV_FILE)"; exit 1; }; \
	  echo "uploading dist/ -> s3://$$FRONTEND_BUCKET"; \
	  aws s3 sync dist/ "s3://$$FRONTEND_BUCKET" --delete \
	    --exclude index.html --exclude sw.js --exclude registerSW.js --exclude manifest.webmanifest \
	    --cache-control "public,max-age=86400"; \
	  aws s3 sync dist/assets/ "s3://$$FRONTEND_BUCKET/assets/" \
	    --cache-control "public,max-age=31536000,immutable"; \
	  for f in sw.js registerSW.js manifest.webmanifest index.html; do \
	    test -f dist/$$f && aws s3 cp dist/$$f "s3://$$FRONTEND_BUCKET/$$f" --cache-control "no-cache"; \
	  done; \
	  aws cloudfront create-invalidation \
	    --distribution-id "$$FRONTEND_DISTRIBUTION_ID" --paths '/*' \
	    --query 'Invalidation.Status' --output text; \
	  echo "deployed $(STAGE): $$FRONTEND_URL"

.PHONY: test
test:
	$(REQUIRE_MODULES)
	$(BUN) run test

.PHONY: fmt
fmt:
	@echo "no formatter configured for the frontend"

.PHONY: clean
clean:
	rm -rf dist node_modules
