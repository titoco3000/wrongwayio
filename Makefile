SHELL := /bin/bash
.DEFAULT_GOAL := help

# Allow `make run dev` / `make run prod` -- picks the backend stage.
# Frontend always runs as `local` (talks to localhost:8003) regardless.
# Bare `make run` uses `local` (DynamoDB Local); bare `make deploy` means dev.
STAGE := $(word 2,$(MAKECMDGOALS))
ifeq ($(STAGE),)
STAGE := dev
RUN_STAGE := local
else
RUN_STAGE := $(STAGE)
endif

# Swallow the stage word so make does not treat it as a target.
.PHONY: local dev prod
local dev prod:
	@:

.PHONY: help
help:
	@echo "make install         run 'make install' in backend, frontend, infra"
	@echo "make fmt             run 'make fmt' in backend, frontend, infra"
	@echo "make test            backend and frontend tests"
	@echo "make run [stage]     run backend (local = DynamoDB Local in docker/podman (default), dev, prod) and frontend (local) together, ctrl+c stops both"
	@echo "make deploy [stage]  deploy backend then frontend to the stage (dev/prod, default dev); infra: 'make -C infra deploy [stage]'"

.PHONY: install fmt
install fmt:
	$(MAKE) -C backend $@
	$(MAKE) -C frontend $@
	$(MAKE) -C infra $@

.PHONY: test
test:
	$(MAKE) -C backend test
	$(MAKE) -C frontend test

.PHONY: run
# Frontend starts only once the backend port is up (max 120s, or backend died),
# so startup logs don't interleave.
run:
	@trap 'kill $$backend_pid $$frontend_pid 2>/dev/null; fuser -k 8003/tcp 5173/tcp 2>/dev/null; true' EXIT INT TERM; \
	(cd backend && exec make run $(RUN_STAGE)) & backend_pid=$$!; \
	for _ in $$(seq 240); do (echo > /dev/tcp/localhost/8003) 2>/dev/null && break; kill -0 $$backend_pid 2>/dev/null || break; sleep 0.5; done; \
	(cd frontend && exec make run local) & frontend_pid=$$!; \
	wait

# Backend first: a frontend that expects new routes should never go live
# ahead of the API that serves them.
.PHONY: deploy
deploy:
	$(MAKE) -C backend deploy $(STAGE)
	$(MAKE) -C frontend deploy $(STAGE)
