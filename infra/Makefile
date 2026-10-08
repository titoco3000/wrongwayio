SHELL := /bin/bash
.DEFAULT_GOAL := help

# Root env (AWS_PROFILE, AWS_REGION, PROJECT) -- sourced automatically, no
# manual export needed.
-include ../.env
export AWS_PROFILE AWS_REGION PROJECT

# Allow `make deploy dev` / `make destroy prod`. Bare targets default to dev.
STAGE := $(word 2,$(MAKECMDGOALS))
ifeq ($(STAGE),)
STAGE := dev
endif
TFVARS := envs/$(STAGE).tfvars

# Swallow the stage word so make does not treat it as a target.
.PHONY: dev prod
dev prod:
	@:

define REQUIRE_ENV
@test -n "$$PROJECT" || { \
  echo "error: PROJECT is not set -- ../.env is missing or malformed."; \
  echo "expected AWS_PROFILE, AWS_REGION, PROJECT in the repo root .env."; \
  exit 1; }
endef

define REQUIRE_INIT
@test -d .terraform || { echo "error: uninitialized -- run 'make init' first"; exit 1; }
endef

define SELECT_WS
@terraform workspace select -or-create $(STAGE) >/dev/null
endef

.PHONY: help
help:
	@echo "make init             check terraform, run 'terraform init'"
	@echo "make plan [stage]     show planned changes"
	@echo "make deploy [stage]   apply the stack, then print backend env values"
	@echo "make output [stage]   print outputs to copy into backend/ and frontend/ .env.<stage>"
	@echo "make destroy [stage]  tear the stage down (asks for confirmation)"
	@echo "stages: dev, prod"

.PHONY: init
init:
	$(REQUIRE_ENV)
	@command -v terraform >/dev/null || { \
	  echo "terraform not found -- install it: https://developer.hashicorp.com/terraform/install"; exit 1; }
	@command -v aws >/dev/null || { \
	  echo "aws cli not found -- install it: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"; exit 1; }
	terraform init -input=false
	terraform fmt -check
	terraform validate
	@echo "infra ready."

.PHONY: plan
plan:
	$(REQUIRE_ENV)
	$(REQUIRE_INIT)
	$(SELECT_WS)
	terraform plan -input=false -var-file=$(TFVARS)

.PHONY: deploy
deploy:
	$(REQUIRE_ENV)
	$(REQUIRE_INIT)
	$(SELECT_WS)
	terraform apply -input=false -auto-approve -var-file=$(TFVARS)
	@$(MAKE) --no-print-directory output STAGE=$(STAGE)

.PHONY: output
output:
	$(REQUIRE_ENV)
	$(REQUIRE_INIT)
	$(SELECT_WS)
	@terraform output
	@echo ""
	@echo "copy into backend/.env.$(STAGE):"
	@echo "---8<---"
	@terraform output -raw backend_env_file
	@echo "---8<---"
	@echo ""
	@echo "copy into frontend/.env.$(STAGE):"
	@echo "---8<---"
	@terraform output -raw frontend_env_file
	@echo "---8<---"

.PHONY: destroy
destroy:
	$(REQUIRE_ENV)
	$(REQUIRE_INIT)
	$(SELECT_WS)
	@echo "about to DESTROY every '$(STAGE)' resource in $$(terraform output -raw region 2>/dev/null || echo 'this stack')."
	@read -r -p "type '$(STAGE)' to confirm: " ans; \
	  test "$$ans" = "$(STAGE)" || { echo "aborted."; exit 1; }
	terraform destroy -input=false -auto-approve -var-file=$(TFVARS)
	@echo "destroyed $(STAGE)."

.PHONY: deploy-dev deploy-prod destroy-dev destroy-prod
deploy-dev:
	@$(MAKE) --no-print-directory deploy STAGE=dev
deploy-prod:
	@$(MAKE) --no-print-directory deploy STAGE=prod
destroy-dev:
	@$(MAKE) --no-print-directory destroy STAGE=dev
destroy-prod:
	@$(MAKE) --no-print-directory destroy STAGE=prod

.PHONY: fmt
fmt:
	$(REQUIRE_ENV)
	terraform fmt -recursive
