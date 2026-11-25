SHELL := /bin/bash
.DEFAULT_GOAL := help

# Root env (AWS_PROFILE, AWS_REGION, PROJECT) -- sourced automatically.
-include ../.env
export AWS_PROFILE AWS_REGION PROJECT

BIN  := wrongwayio-api
ARCH ?= arm64

# `make run` reloads on source edits via cargo-watch. WATCH=0 runs once.
WATCH       ?= 1
WATCH_PATHS := -w lib -w main.rs -w Cargo.toml -w Cargo.lock
ZIP  := target/lambda/$(BIN)/bootstrap.zip

# Allow `make run dev` / `make deploy prod`. Bare `make run` uses `local`:
# DynamoDB Local in a container, no AWS needed. Everything else defaults to dev.
STAGE := $(word 2,$(MAKECMDGOALS))
ifeq ($(STAGE),)
ifeq ($(filter run db-local,$(MAKECMDGOALS)),)
STAGE := dev
else
STAGE := local
endif
endif
ENV_FILE := .env.$(STAGE)

CONTAINER_NAME := wrongwayio-dynamodb-local
LOCAL_DB_PORT  ?= 8000
# first of docker/podman whose daemon actually answers
CONTAINER      := $(shell for c in docker podman; do command -v $$c >/dev/null 2>&1 && $$c info >/dev/null 2>&1 && { echo $$c; break; }; done)

# Swallow the stage word so make does not treat it as a target.
.PHONY: local dev prod
local dev prod:
	@:

# `local` needs no file: the table and endpoint are fixed (see db-local).
define REQUIRE_ENV_FILE
@test "$(STAGE)" = local || test -f $(ENV_FILE) || { \
  echo "error: $(ENV_FILE) missing."; \
  echo "run 'make -C ../infra deploy $(STAGE)' (or 'output $(STAGE)' if already deployed) to write it"; \
  exit 1; }
endef

.PHONY: help
help:
	@echo "make install          install toolchain + fetch deps"
	@echo "make run [stage]      run locally on http://localhost:8003 against the stage's DynamoDB table (reloads on edits; WATCH=0 disables)"
	@echo "make db-local          start DynamoDB Local (make run does this)"
	@echo "make build            cross-compile the lambda zip ($(ARCH))"
	@echo "make deploy [stage]   build + push code to the stage's lambda"
	@echo "make test | fmt | lint | clean"

.PHONY: install
install:
	@command -v cargo >/dev/null || { echo "cargo not found: https://rustup.rs"; exit 1; }
	@command -v cargo-lambda >/dev/null || cargo install cargo-lambda --locked
	@command -v cargo-watch >/dev/null || cargo install cargo-watch --locked
	@command -v zig >/dev/null || { echo "zig not found (cargo-lambda cross-compiles with it): https://ziglang.org/download/"; exit 1; }
	rustup target add aarch64-unknown-linux-gnu x86_64-unknown-linux-gnu
	cargo fetch
	@echo "backend ready."

# DynamoDB Local, persisted in .dynamodb/. The server creates the table itself.
.PHONY: db-local
db-local:
	@test -n "$(CONTAINER)" || { echo "error: no running docker or podman -- start one for the local database"; exit 1; }
	@if [ "$$($(CONTAINER) inspect -f '{{.State.Running}}' $(CONTAINER_NAME) 2>/dev/null)" != true ]; then \
	  $(CONTAINER) rm -f $(CONTAINER_NAME) >/dev/null 2>&1; mkdir -p .dynamodb; \
	  echo "starting DynamoDB Local on :$(LOCAL_DB_PORT)"; \
	  $(CONTAINER) run -d --name $(CONTAINER_NAME) -p 127.0.0.1:$(LOCAL_DB_PORT):8000 \
	    -v "$$PWD/.dynamodb:/home/dynamodblocal/data:Z" --user 0 \
	    docker.io/amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data >/dev/null; \
	fi
	@for _ in $$(seq 60); do (echo > /dev/tcp/localhost/$(LOCAL_DB_PORT)) 2>/dev/null && exit 0; sleep 0.5; done; \
	  echo "error: DynamoDB Local did not come up"; exit 1

.PHONY: run
run:
	$(REQUIRE_ENV_FILE)
	@if [ "$(STAGE)" = local ]; then $(MAKE) --no-print-directory db-local; fi
	@if [ "$(STAGE)" = local ]; then export TABLE_NAME=wrongwayio-users-local DYNAMODB_ENDPOINT=http://localhost:$(LOCAL_DB_PORT); else set -a; . ./$(ENV_FILE); set +a; fi; \
	  export PORT=$${PORT:-8003}; \
	  if [ "$(WATCH)" = "1" ]; then \
	    command -v cargo-watch >/dev/null || { \
	      echo "error: cargo-watch not found (needed for hot reload)."; \
	      echo "run 'make install', or 'make run WATCH=0' to run once without it."; \
	      exit 1; }; \
	    echo "watching -- edits rebuild and restart the server"; \
	    exec cargo watch $(WATCH_PATHS) --why -x run; \
	  else \
	    exec cargo run; \
	  fi

.PHONY: build
build:
	cargo lambda build --release --$(ARCH) --output-format zip --features lambda

.PHONY: deploy
deploy: build
	$(REQUIRE_ENV_FILE)
	@set -a; . ./$(ENV_FILE); set +a; \
	  test -n "$$LAMBDA_FUNCTION_NAME" || { echo "error: LAMBDA_FUNCTION_NAME unset in $(ENV_FILE)"; exit 1; }; \
	  echo "uploading $(ZIP) -> $$LAMBDA_FUNCTION_NAME"; \
	  aws lambda update-function-code \
	    --function-name "$$LAMBDA_FUNCTION_NAME" \
	    --zip-file "fileb://$(ZIP)" \
	    --query 'LastUpdateStatus' --output text; \
	  aws lambda wait function-updated --function-name "$$LAMBDA_FUNCTION_NAME"; \
	  echo "deployed $(STAGE): $$API_URL"

.PHONY: test
test:
	cargo test

.PHONY: fmt
fmt:
	cargo fmt

.PHONY: lint
lint:
	cargo clippy --all-targets -- -D warnings

.PHONY: clean
clean:
	cargo clean
